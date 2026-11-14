import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database';
import { seedDatabase } from './db/seed';
import exerciseRoutes from './routes/exercises';
import templateRoutes from './routes/templates';
import scheduleRoutes from './routes/schedule';
import workoutRoutes from './routes/workouts';
import statsRoutes from './routes/stats';
import settingsRoutes from './routes/settings';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize Database Schema and seed defaults
initDatabase();
seedDatabase();

// Mount API routes
app.use('/api/exercises', exerciseRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server process terminated');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server process terminated');
    process.exit(0);
  });
});
