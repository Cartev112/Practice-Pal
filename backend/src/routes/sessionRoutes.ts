import express, { Request, Response, Router } from 'express';
import db from '../database';
import sqlite3 from 'sqlite3'; // Import sqlite3 for type usage if needed

// Define the expected structure for PitchEvent and RhythmEvent in the request
// These should match the frontend structures
interface PitchEventData {
    timestamp: number;
    note: string | null;
    frequency: number | null;
    cents: number | null;
    confidence?: number;
}

interface RhythmEventData {
    timestamp: number;
    deviation: number | null;
    beatIndex: number | null;
    isOnBeat?: boolean;
}

// Define the structure for the incoming session payload
interface PracticeSessionPayload {
    id: string; // UUID generated on the frontend
    startTime: number;
    endTime: number | null;
    duration: number;
    tempo: number;
    timeSignature: string;
    pitchEvents?: PitchEventData[];
    rhythmEvents?: RhythmEventData[];
}

const router: Router = express.Router();

// POST /api/sessions - Save a new practice session (Async Refactor)
router.post('/sessions', async (req: Request, res: Response): Promise<void> => { // Add async and Promise<void> return type
    const sessionData: PracticeSessionPayload = req.body;

    // Validate basic session data presence
    if (!sessionData || !sessionData.id || !sessionData.startTime || !sessionData.duration ) {
        res.status(400).json({ message: 'Missing required session data fields.' });
        return; // Explicit return void
    }

    const { id, startTime, endTime, duration, tempo, timeSignature, pitchEvents = [], rhythmEvents = [] } = sessionData;

    try {
        // Wrap DB operations in a Promise
        await new Promise<void>((resolve, reject) => {
            db.serialize(() => {
                // Begin transaction
                db.run('BEGIN TRANSACTION;', (beginErr: Error | null) => {
                    if (beginErr) {
                        console.error('Failed to begin transaction:', beginErr.message);
                        return reject(new Error(`Database transaction failed: ${beginErr.message}`));
                    }

                    let errorOccurred: Error | null = null; // Track the first error

                    // Prepare statements
                    const sessionInsertStmt = db.prepare(
                        'INSERT INTO practice_sessions (id, startTime, endTime, duration, tempo, timeSignature) VALUES (?, ?, ?, ?, ?, ?)'
                    );
                    const pitchInsertStmt = db.prepare(
                        'INSERT INTO pitch_events (sessionId, timestamp, note, frequency, cents, confidence) VALUES (?, ?, ?, ?, ?, ?)'
                    );
                    const rhythmInsertStmt = db.prepare(
                        'INSERT INTO rhythm_events (sessionId, timestamp, deviation, beatIndex, isOnBeat) VALUES (?, ?, ?, ?, ?)'
                    );

                    // --- Execute Inserts (within serialize block) --- 

                    sessionInsertStmt.run(id, startTime, endTime, duration, tempo, timeSignature, function (this: sqlite3.RunResult, sessionErr: Error | null) {
                        if (sessionErr && !errorOccurred) errorOccurred = sessionErr;
                    });
                    sessionInsertStmt.finalize();

                    pitchEvents.forEach(event => {
                        pitchInsertStmt.run(id, event.timestamp, event.note, event.frequency, event.cents, event.confidence, function (this: sqlite3.RunResult, pitchErr: Error | null) {
                            if (pitchErr && !errorOccurred) errorOccurred = pitchErr;
                        });
                    });
                    pitchInsertStmt.finalize();

                    rhythmEvents.forEach(event => {
                        rhythmInsertStmt.run(id, event.timestamp, event.deviation, event.beatIndex, event.isOnBeat, function(this: sqlite3.RunResult, rhythmErr: Error | null) {
                            if (rhythmErr && !errorOccurred) errorOccurred = rhythmErr;
                        });
                    });
                    rhythmInsertStmt.finalize();

                    // --- Commit or Rollback (queued after finalize calls) --- 
                    db.run(errorOccurred ? 'ROLLBACK;' : 'COMMIT;', (finalErr: Error | null) => {
                        const finalError = errorOccurred || finalErr;
                        if (finalError) {
                             console.error(errorOccurred ? 'Transaction rolled back due to error:' : 'Commit/Rollback failed:', finalError.message);
                             reject(new Error(`Failed to save session data: ${finalError.message}`));
                        } else {
                            console.log(`Session ${id} and associated events committed successfully.`);
                            resolve(); // Resolve the promise on successful commit
                        }
                    });
                }); // End of BEGIN TRANSACTION callback
            }); // End of db.serialize
        }); // End of Promise constructor

        // If promise resolved (commit successful)
        res.status(201).json({ message: 'Session saved successfully.', sessionId: id });

    } catch (error) {
        // If promise rejected (any error during transaction)
        console.error('Error during session save transaction:', error);
        // Ensure error is an instance of Error before accessing message
        const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
        if (!res.headersSent) { // Check if headers were already sent (e.g., by validation)
             res.status(500).json({ message: 'Failed to save session.', error: errorMessage });
        }
    }
});

// GET /api/sessions - Retrieve all session summaries
router.get('/sessions', (req: Request, res: Response) => {
    const sql = 'SELECT id, startTime, endTime, duration, tempo, timeSignature, createdAt FROM practice_sessions ORDER BY createdAt DESC';
    db.all(sql, [], (err: Error | null, rows: any[]) => {
        if (err) {
            console.error('Error fetching sessions:', err.message);
            return res.status(500).json({ message: 'Failed to retrieve sessions.', error: err.message });
        }
        res.status(200).json(rows);
    });
});

// GET /api/sessions/:id - Retrieve a specific session with all its events
router.get('/sessions/:id', async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.params.id;

    if (!sessionId) {
        res.status(400).json({ message: 'Session ID is required.' });
        return;
    }

    try {
        // Use Promises for cleaner async handling with db.get and db.all
        const getSession = new Promise<any>((resolve, reject) => {
            const sessionSql = 'SELECT * FROM practice_sessions WHERE id = ?';
            db.get(sessionSql, [sessionId], (err: Error | null, sessionRow: any) => {
                if (err) return reject(err);
                if (!sessionRow) return reject(new Error('Session not found'));
                resolve(sessionRow);
            });
        });

        const getPitchEvents = new Promise<PitchEventData[]>((resolve, reject) => {
            const pitchSql = 'SELECT timestamp, note, frequency, cents, confidence FROM pitch_events WHERE sessionId = ? ORDER BY timestamp ASC';
            db.all(pitchSql, [sessionId], (err: Error | null, pitchRows: PitchEventData[]) => {
                if (err) return reject(err);
                resolve(pitchRows || []);
            });
        });

        const getRhythmEvents = new Promise<RhythmEventData[]>((resolve, reject) => {
            const rhythmSql = 'SELECT timestamp, deviation, beatIndex, isOnBeat FROM rhythm_events WHERE sessionId = ? ORDER BY timestamp ASC';
             // Cast BOOLEAN (stored as 0 or 1) back to boolean for JSON consistency
            const rhythmSelectSql = 'SELECT timestamp, deviation, beatIndex, CASE isOnBeat WHEN 1 THEN \'true\' ELSE \'false\' END AS isOnBeat FROM rhythm_events WHERE sessionId = ? ORDER BY timestamp ASC';
            db.all(rhythmSelectSql, [sessionId], (err: Error | null, rhythmRows: any[]) => {
                if (err) return reject(err);
                // Manually parse isOnBeat back to boolean
                const formattedRhythmRows = rhythmRows.map(row => ({ ...row, isOnBeat: row.isOnBeat === 'true' }));
                resolve(formattedRhythmRows || []);
            });
        });

        // Execute all queries concurrently
        const [session, pitchEventsData, rhythmEventsData] = await Promise.all([
            getSession,
            getPitchEvents,
            getRhythmEvents
        ]);

        // Combine results
        const fullSessionData = {
            ...session,
            pitchEvents: pitchEventsData,
            rhythmEvents: rhythmEventsData
        };

        res.status(200).json(fullSessionData);

    } catch (error) {
        console.error(`Error fetching session ${sessionId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        const statusCode = errorMessage === 'Session not found' ? 404 : 500;
         if (!res.headersSent) {
             res.status(statusCode).json({ message: `Failed to retrieve session ${sessionId}.`, error: errorMessage });
         }
    }
});


// POST /api/sessions/:id/pitch-events - bulk insert additional pitch events for an existing session
router.post('/sessions/:id/pitch-events', (req: Request, res: Response) => {
    const sessionId = req.params.id;
    const events: PitchEventData[] = req.body;

    if (!sessionId || !Array.isArray(events)) {
        return res.status(400).json({ message: 'Invalid request. Expecting session id and an array of pitch events.' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');
        const stmt = db.prepare('INSERT INTO pitch_events (sessionId, timestamp, note, frequency, cents, confidence) VALUES (?, ?, ?, ?, ?, ?)');

        let error: Error | null = null;
        events.forEach(ev => {
            stmt.run(sessionId, ev.timestamp, ev.note, ev.frequency, ev.cents, ev.confidence, (err: Error | null) => {
                if (err && !error) error = err;
            });
        });
        stmt.finalize((finalErr: Error | null) => {
            if (finalErr && !error) error = finalErr;
            db.run(error ? 'ROLLBACK;' : 'COMMIT;', (commitErr: Error | null) => {
                if (error || commitErr) {
                    const e = error || commitErr;
                    console.error('Failed to save pitch events:', e?.message);
                    return res.status(500).json({ message: 'Failed to save pitch events.', error: e?.message });
                }
                res.status(201).json({ message: 'Pitch events saved successfully.' });
            });
        });
    });
});

// POST /api/sessions/:id/rhythm-events - bulk insert additional rhythm events for an existing session
router.post('/sessions/:id/rhythm-events', (req: Request, res: Response) => {
    const sessionId = req.params.id;
    const events: RhythmEventData[] = req.body;

    if (!sessionId || !Array.isArray(events)) {
        return res.status(400).json({ message: 'Invalid request. Expecting session id and an array of rhythm events.' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');
        const stmt = db.prepare('INSERT INTO rhythm_events (sessionId, timestamp, deviation, beatIndex, isOnBeat) VALUES (?, ?, ?, ?, ?)');

        let error: Error | null = null;
        events.forEach(ev => {
            // SQLite stores booleans as 0/1
            const onBeatVal = ev.isOnBeat ? 1 : 0;
            stmt.run(sessionId, ev.timestamp, ev.deviation, ev.beatIndex, onBeatVal, (err: Error | null) => {
                if (err && !error) error = err;
            });
        });
        stmt.finalize((finalErr: Error | null) => {
            if (finalErr && !error) error = finalErr;
            db.run(error ? 'ROLLBACK;' : 'COMMIT;', (commitErr: Error | null) => {
                if (error || commitErr) {
                    const e = error || commitErr;
                    console.error('Failed to save rhythm events:', e?.message);
                    return res.status(500).json({ message: 'Failed to save rhythm events.', error: e?.message });
                }
                res.status(201).json({ message: 'Rhythm events saved successfully.' });
            });
        });
    });
});

export default router;
