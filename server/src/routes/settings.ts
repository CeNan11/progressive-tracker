import { Router, Request, Response } from 'express';
import db from '../db/database';
import { seedDatabase } from '../db/seed';

const router = Router();

// GET export full data as JSON
router.get('/export', (_req: Request, res: Response) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    const templates = db.prepare('SELECT * FROM workout_templates').all();
    const scheduledWorkouts = db.prepare('SELECT * FROM scheduled_workouts').all();
    const exercises = db.prepare('SELECT * FROM exercises').all();
    const templateExercises = db.prepare('SELECT * FROM template_exercises').all();
    const sessions = db.prepare('SELECT * FROM workout_sessions').all();
    const exerciseLogs = db.prepare('SELECT * FROM exercise_logs').all();
    const setLogs = db.prepare('SELECT * FROM set_logs').all();

    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      data: {
        users,
        templates,
        scheduled_workouts: scheduledWorkouts,
        exercises,
        template_exercises: templateExercises,
        workout_sessions: sessions,
        exercise_logs: exerciseLogs,
        set_logs: setLogs,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=progressive_tracker_export_${new Date().toISOString().split('T')[0]}.json`);
    res.json(exportData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET export workout history as CSV
router.get('/export-csv', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT 
        ws.workout_date,
        ws.workout_type,
        ws.duration_minutes,
        ws.status,
        e.name as exercise_name,
        e.muscle_group,
        el.weight_used,
        sl.set_number,
        sl.repetitions
      FROM workout_sessions ws
      LEFT JOIN exercise_logs el ON el.session_id = ws.id
      LEFT JOIN exercises e ON el.exercise_id = e.id
      LEFT JOIN set_logs sl ON sl.exercise_log_id = el.id
      ORDER BY ws.workout_date DESC, ws.id DESC, el.exercise_order ASC, sl.set_number ASC
    `).all() as any[];

    const headers = ['Date', 'Workout Type', 'Duration (min)', 'Status', 'Exercise', 'Muscle Group', 'Weight (kg)', 'Set', 'Reps'];
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      const line = [
        `"${r.workout_date || ''}"`,
        `"${r.workout_type || ''}"`,
        r.duration_minutes || 0,
        `"${r.status || ''}"`,
        `"${(r.exercise_name || '').replace(/"/g, '""')}"`,
        `"${r.muscle_group || ''}"`,
        r.weight_used || '',
        r.set_number || '',
        r.repetitions !== null && r.repetitions !== undefined ? r.repetitions : '',
      ];
      csvLines.push(line.join(','));
    });

    const csvContent = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=workout_history_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST reset workout data
router.post('/reset', (req: Request, res: Response) => {
  try {
    const { mode } = req.body; // 'history_only' or 'factory_reset'

    if (mode === 'history_only') {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM set_logs').run();
        db.prepare('DELETE FROM exercise_logs').run();
        db.prepare('DELETE FROM workout_sessions').run();
      });
      transaction();
      return res.json({ message: 'All workout session history has been cleared.' });
    }

    if (mode === 'factory_reset') {
      seedDatabase(true);
      return res.json({ message: 'Database reset to default settings and fresh templates.' });
    }

    res.status(400).json({ error: "Invalid reset mode. Must be 'history_only' or 'factory_reset'." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST seed sample demo workouts (for users to see realistic progressive overload trends immediately if desired)
router.post('/seed-demo', (_req: Request, res: Response) => {
  try {
    const sampleWorkouts = [
      {
        offsetDays: 14,
        type: 'Arms',
        template_id: 1,
        exercises: [
          { id: 1, weight: 10, sets: [10, 8, 7] }, // Bicep curl total: 25
          { id: 2, weight: 10, sets: [10, 9, 8] }, // Hammer curl total: 27
          { id: 3, weight: 10, sets: [10, 8, 8] }, // Overhead ext total: 26
          { id: 4, weight: 10, sets: [8, 8, 7] },  // Skull crushers total: 23
          { id: 5, weight: 10, sets: [12, 12, 11] }, // Wrist curls total: 35
        ]
      },
      {
        offsetDays: 12,
        type: 'Back',
        template_id: 2,
        exercises: [
          { id: 6, weight: 10, sets: [10, 9, 8] }, // One-Arm Row total: 27
          { id: 7, weight: 10, sets: [9, 8, 8] },  // Bent-over Row total: 25
          { id: 8, weight: 10, sets: [12, 12, 12] }, // Shrugs total: 36
          { id: 9, weight: 10, sets: [10, 10, 9] }, // Reverse Fly total: 29
          { id: 10, weight: 10, sets: [9, 8, 8] }, // Pullover total: 25
        ]
      },
      {
        offsetDays: 10,
        type: 'Legs',
        template_id: 3,
        exercises: [
          { id: 11, weight: 10, sets: [10, 10, 9] }, // Goblet squat total: 29
          { id: 12, weight: 10, sets: [10, 9, 9] },  // RDL total: 28
          { id: 13, weight: 10, sets: [8, 8, 8] },   // Lunges total: 24
          { id: 14, weight: 10, sets: [14, 14, 13] }, // Calf raises total: 41
        ]
      },
      {
        offsetDays: 8,
        type: 'Rest',
        template_id: null,
        exercises: []
      },
      {
        offsetDays: 6,
        type: 'Arms',
        template_id: 1,
        // Demonstrating progressive overload: +6 reps on bicep curls (12, 10, 9) = 31 reps!
        exercises: [
          { id: 1, weight: 10, sets: [12, 10, 9] }, // Bicep curl: +6 reps! (PR)
          { id: 2, weight: 10, sets: [11, 10, 9] }, // Hammer curl: +3 reps! (PR)
          { id: 3, weight: 10, sets: [11, 9, 9] },  // Overhead ext: +3 reps! (PR)
          { id: 4, weight: 10, sets: [9, 9, 8] },   // Skull crushers: +3 reps! (PR)
          { id: 5, weight: 10, sets: [14, 13, 12] }, // Wrist curls: +4 reps! (PR)
        ]
      },
      {
        offsetDays: 4,
        type: 'Back',
        template_id: 2,
        exercises: [
          { id: 6, weight: 10, sets: [11, 10, 9] }, // One-Arm Row: +3 reps! (PR)
          { id: 7, weight: 10, sets: [10, 9, 8] },  // Bent-over Row: +2 reps! (PR)
          { id: 8, weight: 10, sets: [14, 13, 12] }, // Shrugs: +3 reps! (PR)
          { id: 9, weight: 10, sets: [11, 10, 10] }, // Reverse Fly: +2 reps! (PR)
          { id: 10, weight: 10, sets: [10, 9, 9] }, // Pullover: +3 reps! (PR)
        ]
      },
      {
        offsetDays: 1,
        type: 'Legs',
        template_id: 3,
        exercises: [
          { id: 11, weight: 10, sets: [11, 11, 10] }, // Goblet squat: +3 reps! (PR)
          { id: 12, weight: 10, sets: [11, 10, 10] }, // RDL: +3 reps! (PR)
          { id: 13, weight: 10, sets: [9, 9, 8] },    // Lunges: +2 reps! (PR)
          { id: 14, weight: 10, sets: [15, 15, 14] }, // Calf raises: +3 reps! (PR)
        ]
      }
    ];

    const transaction = db.transaction(() => {
      // Clear previous history
      db.prepare('DELETE FROM set_logs').run();
      db.prepare('DELETE FROM exercise_logs').run();
      db.prepare('DELETE FROM workout_sessions').run();

      const insertSession = db.prepare(`
        INSERT INTO workout_sessions (template_id, workout_type, workout_date, duration_minutes, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insertExLog = db.prepare(`
        INSERT INTO exercise_logs (session_id, exercise_id, weight_used, exercise_order)
        VALUES (?, ?, ?, ?)
      `);

      const insertSetLog = db.prepare(`
        INSERT INTO set_logs (exercise_log_id, set_number, repetitions)
        VALUES (?, ?, ?)
      `);

      sampleWorkouts.forEach(sw => {
        const d = new Date();
        d.setDate(d.getDate() - sw.offsetDays);
        const dateStr = d.toISOString().split('T')[0];

        const sessionInfo = insertSession.run(
          sw.template_id,
          sw.type,
          dateStr,
          sw.type === 'Rest' ? 0 : 42,
          sw.type === 'Rest' ? 'rest' : 'completed'
        );

        const sessionId = sessionInfo.lastInsertRowid as number;

        sw.exercises.forEach((ex, exIdx) => {
          const exInfo = insertExLog.run(sessionId, ex.id, ex.weight, exIdx + 1);
          const exLogId = exInfo.lastInsertRowid as number;

          ex.sets.forEach((reps, sIdx) => {
            insertSetLog.run(exLogId, sIdx + 1, reps);
          });
        });
      });
    });

    transaction();
    res.json({ message: 'Sample workout data with progressive overload history generated successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
