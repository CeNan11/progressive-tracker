import { Router, Request, Response } from 'express';
import db from '../db/database';
import { OverloadService } from '../services/overloadService';

const router = Router();

// GET all exercises with summary stats (PR, times performed)
router.get('/', (req: Request, res: Response) => {
  try {
    const { muscle_group } = req.query;
    let query = `
      SELECT 
        e.*,
        COUNT(DISTINCT el.id) as times_performed,
        MAX(ws.workout_date) as last_performed_date
      FROM exercises e
      LEFT JOIN exercise_logs el ON el.exercise_id = e.id
      LEFT JOIN workout_sessions ws ON el.session_id = ws.id AND ws.status = 'completed'
    `;
    const params: any[] = [];

    if (muscle_group && typeof muscle_group === 'string' && muscle_group !== 'All') {
      query += ` WHERE e.muscle_group = ?`;
      params.push(muscle_group);
    }

    query += ` GROUP BY e.id ORDER BY e.muscle_group ASC, e.name ASC`;

    const exercises = db.prepare(query).all(...params) as any[];

    // Add personal record for each exercise
    const result = exercises.map(ex => {
      const pr = OverloadService.getPersonalRecord(ex.id);
      return {
        ...ex,
        personal_record_reps: pr,
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single exercise with detailed stats and history
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const range = req.query.range ? parseInt(req.query.range as string, 10) : undefined;
    
    const stats = OverloadService.getExerciseStats(id, range);
    res.json(stats);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// GET previous performance for an exercise
router.get('/:id/previous', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const beforeSessionId = req.query.beforeSessionId 
      ? parseInt(req.query.beforeSessionId as string, 10) 
      : undefined;

    const previous = OverloadService.getPreviousPerformance(id, beforeSessionId);
    const pr = OverloadService.getPersonalRecord(id, beforeSessionId);
    res.json({ previous, personal_record: pr });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create exercise
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, muscle_group, default_weight, target_min_reps, target_max_reps, notes } = req.body;

    if (!name || !muscle_group) {
      return res.status(400).json({ error: 'Exercise name and muscle group are required.' });
    }

    const minReps = parseInt(target_min_reps, 10) || 8;
    const maxReps = parseInt(target_max_reps, 10) || 12;
    const weight = parseFloat(default_weight) || 10.0;

    if (minReps <= 0 || maxReps < minReps) {
      return res.status(400).json({ error: 'Target max reps must be greater than or equal to min reps.' });
    }

    const stmt = db.prepare(`
      INSERT INTO exercises (name, muscle_group, default_weight, target_min_reps, target_max_reps, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(name.trim(), muscle_group, weight, minReps, maxReps, notes ? notes.trim() : null);

    const created = db.prepare('SELECT * FROM exercises WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'An exercise with this name already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT update exercise
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { name, muscle_group, default_weight, target_min_reps, target_max_reps, notes } = req.body;

    if (!name || !muscle_group) {
      return res.status(400).json({ error: 'Exercise name and muscle group are required.' });
    }

    const minReps = parseInt(target_min_reps, 10) || 8;
    const maxReps = parseInt(target_max_reps, 10) || 12;
    const weight = parseFloat(default_weight) || 10.0;

    const stmt = db.prepare(`
      UPDATE exercises
      SET name = ?, muscle_group = ?, default_weight = ?, target_min_reps = ?, target_max_reps = ?, notes = ?
      WHERE id = ?
    `);

    const info = stmt.run(name.trim(), muscle_group, weight, minReps, maxReps, notes ? notes.trim() : null, id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Exercise not found.' });
    }

    const updated = db.prepare('SELECT * FROM exercises WHERE id = ?').get(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE exercise
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);

    // Check if exercise has logged workout history
    const usage = db.prepare('SELECT COUNT(*) as count FROM exercise_logs WHERE exercise_id = ?').get(id) as { count: number };
    if (usage.count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete this exercise because it has ${usage.count} logged workout entries. Preserving your historical data is important!` 
      });
    }

    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM template_exercises WHERE exercise_id = ?').run(id);
      return db.prepare('DELETE FROM exercises WHERE id = ?').run(id);
    });

    const info = transaction();

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Exercise not found.' });
    }

    res.json({ message: 'Exercise deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
