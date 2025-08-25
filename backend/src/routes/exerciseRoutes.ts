import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database'; // Adjusted path to access the db instance

const router = express.Router();

// Define the Exercise type based on your frontend and database schema
interface Exercise {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  content?: string; // For detailed exercise content (e.g., VexFlow data, instructions)
  createdAt?: string; // Will be set by DB
  updatedAt?: string; // Will be set by DB
}

// GET all exercises
router.get('/', (req: Request, res: Response) => {
  db.all('SELECT * FROM exercises ORDER BY category, title', [], (err, rows: any[]) => {
    if (err) {
      console.error('Error fetching exercises:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve exercises' });
    }
    const parsed = (rows || []).map((r: any) => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] }));
    res.json(parsed);
  });
});

// GET a single exercise by ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.get('SELECT * FROM exercises WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(`Error fetching exercise ${id}:`, err.message);
      return res.status(500).json({ error: 'Failed to retrieve exercise' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    // exerciseRoutes.ts – at the 3 spots that parse tags
    if (row) {
          const rAny = row as any;
          rAny.tags = rAny.tags ? JSON.parse(rAny.tags) : [];
        }
    res.json(row);
  });
});

// POST a new exercise
router.post('/', (req: Request, res: Response) => {
  const { title, description, category, content, tags } = req.body as Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>;

  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required' });
  }

  const newExercise: Exercise = {
    id: uuidv4(),
    title,
    description,
    category,
    tags,
    content,
  };

  const sql = 'INSERT INTO exercises (id, title, description, category, tags, content, updatedAt) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)';
  const params = [newExercise.id, newExercise.title, newExercise.description, newExercise.category, JSON.stringify(tags || []), newExercise.content];

  db.run(sql, params, function (err) {
    if (err) {
      console.error('Error creating exercise:', err.message);
      return res.status(500).json({ error: 'Failed to create exercise' });
    }
    // Return the newly created exercise, including the ID and timestamps
    db.get('SELECT * FROM exercises WHERE id = ?', [newExercise.id], (err, row) => {
      if (err) {
        console.error('Error fetching newly created exercise:', err.message);
        return res.status(500).json({ error: 'Exercise created, but failed to retrieve it.' });
      }
      if (row) {
          const rAny = row as any;
          rAny.tags = rAny.tags ? JSON.parse(rAny.tags) : [];
        }
      res.status(201).json(row);
    });
  });
});

// PUT to update an existing exercise
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, category, content, tags } = req.body as Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>;

  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required' });
  }

  const sql = 'UPDATE exercises SET title = ?, description = ?, category = ?, tags = ?, content = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
  const params = [title, description, category, JSON.stringify(tags || []), content, id];

  db.run(sql, params, function (err) {
    if (err) {
      console.error(`Error updating exercise ${id}:`, err.message);
      return res.status(500).json({ error: 'Failed to update exercise' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Exercise not found or no changes made' });
    }
    // Return the updated exercise
    db.get('SELECT * FROM exercises WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching updated exercise:', err.message);
        return res.status(500).json({ error: 'Exercise updated, but failed to retrieve it.' });
      }
      if (row) {
          const rAny = row as any;
          rAny.tags = rAny.tags ? JSON.parse(rAny.tags) : [];
        }
      res.json(row);
    });
  });
});

// DELETE an exercise
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.run('DELETE FROM exercises WHERE id = ?', [id], function (err) {
    if (err) {
      console.error(`Error deleting exercise ${id}:`, err.message);
      return res.status(500).json({ error: 'Failed to delete exercise' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    res.status(204).send(); // No content on successful deletion
  });
});

export default router;
