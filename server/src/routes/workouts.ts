import { Router, Request, Response } from 'express';
import db from '../db/database';
import { OverloadService } from '../services/overloadService';

const router = Router();

// GET all workouts with filtering and pagination
router.get('/', (req: Request, res: Response) => {
  try {
    const { type, status, limit, offset } = req.query;
    
    let query = `
      SELECT 
        ws.*,
        wt.name as template_name,
        COALESCE(SUM(sl.repetitions), 0) as total_reps,
        COUNT(DISTINCT el.id) as total_exercises,
        COUNT(sl.id) as total_sets
      FROM workout_sessions ws
      LEFT JOIN workout_templates wt ON ws.template_id = wt.id
      LEFT JOIN exercise_logs el ON el.session_id = ws.id
      LEFT JOIN set_logs sl ON sl.exercise_log_id = el.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type && typeof type === 'string' && type !== 'All') {
      query += ` AND ws.workout_type = ?`;
      params.push(type);
    }

    if (status && typeof status === 'string' && status !== 'All') {
      query += ` AND ws.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY ws.id ORDER BY ws.workout_date DESC, ws.id DESC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit as string, 10));
      if (offset) {
        query += ` OFFSET ?`;
        params.push(parseInt(offset as string, 10));
      }
    }

    const sessions = db.prepare(query).all(...params) as any[];
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single workout session with full breakdown & progressive overload comparisons
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const session = db.prepare(`
      SELECT ws.*, wt.name as template_name
      FROM workout_sessions ws
      LEFT JOIN workout_templates wt ON ws.template_id = wt.id
      WHERE ws.id = ?
    `).get(id) as any;

    if (!session) {
      return res.status(404).json({ error: 'Workout session not found.' });
    }

    const exerciseLogs = db.prepare(`
      SELECT 
        el.*,
        e.name as exercise_name,
        e.muscle_group,
        e.target_min_reps,
        e.target_max_reps
      FROM exercise_logs el
      JOIN exercises e ON el.exercise_id = e.id
      WHERE el.session_id = ?
      ORDER BY el.exercise_order ASC
    `).all(id) as any[];

    let sessionTotalReps = 0;
    let sessionTotalSets = 0;
    let improvedCount = 0;
    let maintainedCount = 0;
    let decreasedCount = 0;
    let prCount = 0;

    const enrichedLogs = exerciseLogs.map(log => {
      const sets = db.prepare(`
        SELECT set_number, repetitions 
        FROM set_logs 
        WHERE exercise_log_id = ? 
        ORDER BY set_number ASC
      `).all(log.id) as { set_number: number; repetitions: number }[];

      sessionTotalSets += sets.length;
      const totalReps = sets.reduce((sum, s) => sum + s.repetitions, 0);
      sessionTotalReps += totalReps;

      // Calculate overload comparison against sessions before this one
      const comparison = OverloadService.analyzeExercisePerformance(
        log.exercise_id,
        log.weight_used,
        sets,
        session.id
      );

      if (comparison.performance_state === 'improved') improvedCount++;
      else if (comparison.performance_state === 'maintained') maintainedCount++;
      else if (comparison.performance_state === 'decreased') decreasedCount++;

      if (comparison.is_personal_record) prCount++;

      return {
        ...log,
        sets,
        total_reps: totalReps,
        comparison,
      };
    });

    res.json({
      ...session,
      total_reps: sessionTotalReps,
      total_sets: sessionTotalSets,
      total_exercises: enrichedLogs.length,
      improvements: {
        improved_count: improvedCount,
        maintained_count: maintainedCount,
        decreased_count: decreasedCount,
        pr_count: prCount,
      },
      exercise_logs: enrichedLogs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST live comparison preview for set input during workout
router.post('/compare', (req: Request, res: Response) => {
  try {
    const { exercise_id, weight_used, sets, session_id } = req.body;
    if (!exercise_id) {
      return res.status(400).json({ error: 'exercise_id is required' });
    }

    const comparison = OverloadService.analyzeExercisePerformance(
      exercise_id,
      parseFloat(weight_used) || 10,
      sets || [],
      session_id
    );

    res.json(comparison);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST save workout session
router.post('/', (req: Request, res: Response) => {
  try {
    const { 
      template_id, 
      workout_type, 
      workout_date, 
      started_at, 
      completed_at, 
      duration_minutes, 
      status, 
      notes, 
      exercise_logs 
    } = req.body;

    if (!workout_type || !workout_date) {
      return res.status(400).json({ error: 'workout_type and workout_date are required.' });
    }

    const sessionStatus = status || 'completed';

    const transaction = db.transaction(() => {
      const insertSession = db.prepare(`
        INSERT INTO workout_sessions (
          template_id, workout_type, workout_date, started_at, completed_at, duration_minutes, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const sessionInfo = insertSession.run(
        template_id || null,
        workout_type,
        workout_date,
        started_at || null,
        completed_at || new Date().toISOString(),
        duration_minutes || 0,
        sessionStatus,
        notes || null
      );

      const sessionId = sessionInfo.lastInsertRowid as number;

      if (sessionStatus !== 'rest' && Array.isArray(exercise_logs)) {
        const insertExLog = db.prepare(`
          INSERT INTO exercise_logs (session_id, exercise_id, weight_used, exercise_order, notes)
          VALUES (?, ?, ?, ?, ?)
        `);

        const insertSetLog = db.prepare(`
          INSERT INTO set_logs (exercise_log_id, set_number, repetitions)
          VALUES (?, ?, ?)
        `);

        exercise_logs.forEach((elog: any, idx: number) => {
          const exLogInfo = insertExLog.run(
            sessionId,
            elog.exercise_id,
            parseFloat(elog.weight_used) || 10.0,
            elog.exercise_order || idx + 1,
            elog.notes || null
          );

          const exLogId = exLogInfo.lastInsertRowid as number;

          if (Array.isArray(elog.sets)) {
            elog.sets.forEach((set: any, sIdx: number) => {
              const reps = parseInt(set.repetitions, 10);
              insertSetLog.run(exLogId, set.set_number || sIdx + 1, isNaN(reps) ? 0 : Math.max(0, reps));
            });
          }
        });
      }

      return sessionId;
    });

    const newSessionId = transaction();
    
    // Fetch and return the newly saved session
    res.status(201).json({ id: newSessionId, message: 'Workout logged successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update workout session
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { 
      template_id, 
      workout_type, 
      workout_date, 
      started_at, 
      completed_at, 
      duration_minutes, 
      status, 
      notes, 
      exercise_logs 
    } = req.body;

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE workout_sessions
        SET template_id = ?, workout_type = ?, workout_date = ?, started_at = ?, completed_at = ?, duration_minutes = ?, status = ?, notes = ?
        WHERE id = ?
      `).run(
        template_id || null,
        workout_type,
        workout_date,
        started_at || null,
        completed_at || null,
        duration_minutes || 0,
        status || 'completed',
        notes || null,
        id
      );

      if (Array.isArray(exercise_logs)) {
        // Delete previous exercise logs and sets for this session
        db.prepare('DELETE FROM exercise_logs WHERE session_id = ?').run(id);

        const insertExLog = db.prepare(`
          INSERT INTO exercise_logs (session_id, exercise_id, weight_used, exercise_order, notes)
          VALUES (?, ?, ?, ?, ?)
        `);

        const insertSetLog = db.prepare(`
          INSERT INTO set_logs (exercise_log_id, set_number, repetitions)
          VALUES (?, ?, ?)
        `);

        exercise_logs.forEach((elog: any, idx: number) => {
          const exLogInfo = insertExLog.run(
            id,
            elog.exercise_id,
            parseFloat(elog.weight_used) || 10.0,
            elog.exercise_order || idx + 1,
            elog.notes || null
          );

          const exLogId = exLogInfo.lastInsertRowid as number;

          if (Array.isArray(elog.sets)) {
            elog.sets.forEach((set: any, sIdx: number) => {
              const reps = parseInt(set.repetitions, 10);
              insertSetLog.run(exLogId, set.set_number || sIdx + 1, isNaN(reps) ? 0 : Math.max(0, reps));
            });
          }
        });
      }
    });

    transaction();
    res.json({ id, message: 'Workout updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE workout session
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const info = db.prepare('DELETE FROM workout_sessions WHERE id = ?').run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Workout session not found.' });
    }

    res.json({ message: 'Workout session deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
