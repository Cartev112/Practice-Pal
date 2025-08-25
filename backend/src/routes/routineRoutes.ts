import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

const router = express.Router();

// Shared routine interface
interface ExerciseItem {
  id: string;
  duration?: string;
}
interface Routine {
  id: string;
  title: string;
  description?: string;
  exerciseIds: ExerciseItem[]; // array with optional duration per exercise
  createdAt?: string;
  updatedAt?: string;
}

// Helper to parse exerciseIds JSON
const parseRow = (row: any): Routine => ({
  ...row,
  exerciseIds: row.exerciseIds ? JSON.parse(row.exerciseIds) : [],
});

// GET all routines
router.get('/', (req: Request, res: Response) => {
  db.all('SELECT * FROM routines ORDER BY createdAt DESC', [], (err, rows: any[]) => {
    if (err) {
      console.error('Error fetching routines:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve routines' });
    }
    res.json(rows.map(parseRow));
  });
});

// GET single routine
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.get('SELECT * FROM routines WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching routine:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve routine' });
    }
    if (!row) return res.status(404).json({ error: 'Routine not found' });
    res.json(parseRow(row));
  });
});

// POST create routine
router.post('/', (req: Request, res: Response) => {
  const { title, description, exerciseIds } = req.body as Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const newRoutine: Routine = {
    id: uuidv4(),
    title,
    description,
    exerciseIds: exerciseIds || [],
  };

  const sql = 'INSERT INTO routines (id, title, description, exerciseIds, updatedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)';
  const params = [newRoutine.id, newRoutine.title, newRoutine.description, JSON.stringify(newRoutine.exerciseIds)];
  db.run(sql, params, function (err) {
    if (err) {
      console.error('Error creating routine:', err.message);
      return res.status(500).json({ error: 'Failed to create routine' });
    }
    db.get('SELECT * FROM routines WHERE id = ?', [newRoutine.id], (err, row) => {
      if (err) {
        console.error('Error fetching new routine:', err.message);
        return res.status(500).json({ error: 'Routine created, but failed to retrieve it' });
      }
      res.status(201).json(parseRow(row));
    });
  });
});

// PUT update routine
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, exerciseIds } = req.body as Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const sql = 'UPDATE routines SET title = ?, description = ?, exerciseIds = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
  const params = [title, description, JSON.stringify(exerciseIds || []), id];
  db.run(sql, params, function (err) {
    if (err) {
      console.error('Error updating routine:', err.message);
      return res.status(500).json({ error: 'Failed to update routine' });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Routine not found or no changes' });
    db.get('SELECT * FROM routines WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching updated routine:', err.message);
        return res.status(500).json({ error: 'Routine updated, but failed to retrieve it' });
      }
      res.json(parseRow(row));
    });
  });
});

// DELETE routine
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.run('DELETE FROM routines WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting routine:', err.message);
      return res.status(500).json({ error: 'Failed to delete routine' });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Routine not found' });
    res.status(204).send();
  });
});

export default router;
