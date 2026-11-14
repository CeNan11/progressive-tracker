import { Router, Request, Response } from 'express';
import db from '../db/database';

const router = Router();

// GET current schedule cycle
router.get('/', (_req: Request, res: Response) => {
  try {
    const schedule = db.prepare(`
      SELECT 
        sw.id,
        sw.cycle_order,
        sw.workout_type,
        sw.template_id,
        wt.name as template_name,
        wt.description as template_description
      FROM scheduled_workouts sw
      LEFT JOIN workout_templates wt ON sw.template_id = wt.id
      ORDER BY sw.cycle_order ASC
    `).all();

    res.json(schedule);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET today's scheduled workout
router.get('/today', (_req: Request, res: Response) => {
  try {
    const schedule = db.prepare(`
      SELECT 
        sw.id,
        sw.cycle_order,
        sw.workout_type,
        sw.template_id,
        wt.name as template_name
      FROM scheduled_workouts sw
      LEFT JOIN workout_templates wt ON sw.template_id = wt.id
      ORDER BY sw.cycle_order ASC
    `).all() as any[];

    if (schedule.length === 0) {
      return res.json(null);
    }

    const todayDate = new Date().toISOString().split('T')[0];

    // Check if there is an existing workout or rest session logged today
    const todaySession = db.prepare(`
      SELECT * FROM workout_sessions 
      WHERE workout_date = ? 
      ORDER BY id DESC LIMIT 1
    `).get(todayDate) as any;

    // Find the last completed session before today to determine cycle position
    const lastSession = db.prepare(`
      SELECT * FROM workout_sessions 
      WHERE status IN ('completed', 'rest')
      ORDER BY workout_date DESC, id DESC LIMIT 1
    `).get() as any;

    let targetIndex = 0; // Default to cycle index 0 (cycle_order 1)

    if (lastSession) {
      // Find matching index in schedule
      const lastIndex = schedule.findIndex(s => s.workout_type.toLowerCase() === lastSession.workout_type.toLowerCase());
      if (lastIndex !== -1) {
        // Next in cycle
        targetIndex = (lastIndex + 1) % schedule.length;
      }
    }

    const scheduledItem = schedule[targetIndex];

    res.json({
      scheduled_item: scheduledItem,
      cycle_order: scheduledItem.cycle_order,
      workout_type: scheduledItem.workout_type,
      template_id: scheduledItem.template_id,
      template_name: scheduledItem.template_name,
      is_rest: scheduledItem.workout_type.toLowerCase() === 'rest',
      completed_today: !!todaySession,
      today_session: todaySession,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update schedule cycle
router.put('/', (req: Request, res: Response) => {
  try {
    const { items } = req.body; // Array of { cycle_order, workout_type, template_id }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Valid schedule cycle items array is required.' });
    }

    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM scheduled_workouts').run();

      const insertStmt = db.prepare(`
        INSERT INTO scheduled_workouts (cycle_order, workout_type, template_id)
        VALUES (?, ?, ?)
      `);

      items.forEach((item: any, idx: number) => {
        const cycleOrder = item.cycle_order || idx + 1;
        const templateId = item.template_id || null;
        const workoutType = item.workout_type || (templateId ? 'Workout' : 'Rest');

        insertStmt.run(cycleOrder, workoutType, templateId);
      });
    });

    transaction();

    const updated = db.prepare(`
      SELECT 
        sw.id,
        sw.cycle_order,
        sw.workout_type,
        sw.template_id,
        wt.name as template_name
      FROM scheduled_workouts sw
      LEFT JOIN workout_templates wt ON sw.template_id = wt.id
      ORDER BY sw.cycle_order ASC
    `).all();

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
