import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import './database'; // Import to initialize database connection
import sessionRoutes from './routes/sessionRoutes'; // Import the session routes
import exerciseRoutes from './routes/exerciseRoutes'; // Import the exercise routes
import importRoutes from './routes/importRoutes';
import routineRoutes from './routes/routineRoutes';

const app: Express = express();
const port = process.env.PORT || 3001; // Use port 3001 to avoid conflict with frontend

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing for requests from the frontend
app.use(express.json()); // Parse JSON request bodies

// API Routes - mount specific before generic
app.use('/api/exercises', exerciseRoutes); // Expose exercises under /api
app.use('/api/routines', routineRoutes);
app.use('/api', sessionRoutes); // other /api endpoints
app.use('/import', importRoutes);

// Simple test route (can be kept or removed)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

// Start the server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app; // Export for potential testing
