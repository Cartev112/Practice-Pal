import sqlite3 from 'sqlite3';
import path from 'path';

// Use verbose mode for more detailed logs during development
const verboseSqlite3 = sqlite3.verbose();

// Define the path for the SQLite database file
// Store it in the backend directory for simplicity
const dbPath = path.resolve(__dirname, '../practice_pal.sqlite');

// Initialize the database connection
const db = new verboseSqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Create tables if they don't exist
    createTables();
  }
});

// Function to create necessary tables
function createTables() {
  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id TEXT PRIMARY KEY,            -- Use UUID generated on frontend or backend
      startTime INTEGER NOT NULL,     -- Unix timestamp (ms)
      endTime INTEGER,                -- Unix timestamp (ms)
      duration INTEGER NOT NULL,      -- Duration in ms
      tempo INTEGER NOT NULL,
      timeSignature TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP -- Track when the record was created
    );
  `;

  const createPitchEventsTable = `
    CREATE TABLE IF NOT EXISTS pitch_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      timestamp INTEGER NOT NULL,     -- Relative timestamp within session (ms)
      note TEXT,
      frequency REAL,               -- Use REAL for floating point numbers
      cents REAL,
      confidence REAL,
      FOREIGN KEY (sessionId) REFERENCES practice_sessions (id) ON DELETE CASCADE
    );
  `;

  const createRhythmEventsTable = `
    CREATE TABLE IF NOT EXISTS rhythm_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      timestamp INTEGER NOT NULL,     -- Relative timestamp within session (ms)
      deviation REAL,
      beatIndex INTEGER,
      isOnBeat BOOLEAN,
      FOREIGN KEY (sessionId) REFERENCES practice_sessions (id) ON DELETE CASCADE
    );
  `;

  const createExercisesTable = `
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,              -- UUID generated on frontend or backend
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      tags TEXT,
      content TEXT,                     -- For detailed exercise content (e.g., VexFlow data, instructions)
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP -- To track updates
    );
  `;

  const createRoutinesTable = `
    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      exerciseIds TEXT, -- JSON array of exercise UUIDs
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.serialize(() => {
    db.run(createSessionsTable, (err) => {
      if (err) console.error('Error creating sessions table:', err.message);
      else console.log('Practice sessions table ready.');
    });

    db.run(createPitchEventsTable, (err) => {
      if (err) console.error('Error creating pitch events table:', err.message);
      else console.log('Pitch events table ready.');
    });

    db.run(createRhythmEventsTable, (err) => {
      if (err) console.error('Error creating rhythm events table:', err.message);
      else console.log('Rhythm events table ready.');
    });

    db.run(createExercisesTable, (err) => {
      if (err) console.error('Error creating exercises table:', err.message);
      else console.log('Exercises table ready.');
    });

    db.run(createRoutinesTable, (err) => {
      if (err) console.error('Error creating routines table:', err.message);
      else console.log('Routines table ready.');
    });
  });
}

// Export the database connection instance
export default db;
