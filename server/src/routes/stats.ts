import { Router, Request, Response } from 'express';
import db from '../db/database';
import { OverloadService } from '../services/overloadService';

const router = Router();

// GET full dashboard payload
router.get('/dashboard', (_req: Request, res: Response) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

    // 1. User
    const user = db.prepare('SELECT username FROM users LIMIT 1').get() as { username: string } || { username: 'Athlete' };

    // 2. Schedule cycle
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

    // Check today's workout
    const todaySession = db.prepare(`
      SELECT * FROM workout_sessions 
      WHERE workout_date = ? 
      ORDER BY id DESC LIMIT 1
    `).get(todayStr) as any;

    const lastCompletedSession = db.prepare(`
      SELECT * FROM workout_sessions 
      WHERE status IN ('completed', 'rest')
      ORDER BY workout_date DESC, id DESC LIMIT 1
    `).get() as any;

    let targetIndex = 0;
    if (lastCompletedSession && schedule.length > 0) {
      const idx = schedule.findIndex(s => s.workout_type.toLowerCase() === lastCompletedSession.workout_type.toLowerCase());
      if (idx !== -1) {
        targetIndex = (idx + 1) % schedule.length;
      }
    }

    const currentCycleItem = schedule.length > 0 ? schedule[targetIndex] : null;

    const scheduleWithState = schedule.map((item, idx) => ({
      ...item,
      is_current_day: idx === targetIndex,
      is_completed_today: todaySession ? todaySession.workout_type.toLowerCase() === item.workout_type.toLowerCase() : false,
    }));

    // 3. Stats cards
    const totalWorkouts = (db.prepare(`
      SELECT COUNT(*) as count FROM workout_sessions WHERE status IN ('completed', 'rest')
    `).get() as { count: number }).count;

    const monthWorkouts = (db.prepare(`
      SELECT COUNT(*) as count FROM workout_sessions 
      WHERE status IN ('completed', 'rest') AND workout_date LIKE ?
    `).get(`${currentMonthPrefix}%`) as { count: number }).count;

    const totalRepsAllTime = (db.prepare(`
      SELECT COALESCE(SUM(sl.repetitions), 0) as total
      FROM set_logs sl
      JOIN exercise_logs el ON sl.exercise_log_id = el.id
      JOIN workout_sessions ws ON el.session_id = ws.id
      WHERE ws.status = 'completed'
    `).get() as { total: number }).total;

    // Streak calculation (consecutive active/logged days counting backwards from today)
    const distinctDates = db.prepare(`
      SELECT DISTINCT workout_date 
      FROM workout_sessions 
      WHERE status IN ('completed', 'rest')
      ORDER BY workout_date DESC
    `).all() as { workout_date: string }[];

    let currentStreak = 0;
    if (distinctDates.length > 0) {
      const datesSet = new Set(distinctDates.map(d => d.workout_date));
      let checkDate = new Date(today);
      
      // If no workout today, check if streak from yesterday is active
      const checkStr = checkDate.toISOString().split('T')[0];
      if (!datesSet.has(checkStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (datesSet.has(dStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Personal records count (number of exercises with a PR > 0)
    const exercises = db.prepare('SELECT id FROM exercises').all() as { id: number }[];
    let totalPersonalRecords = 0;
    for (const ex of exercises) {
      const pr = OverloadService.getPersonalRecord(ex.id);
      if (pr > 0) {
        totalPersonalRecords++;
      }
    }

    // 4. Recent Activity (last 5 sessions)
    const recentSessionsRaw = db.prepare(`
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
      GROUP BY ws.id
      ORDER BY ws.workout_date DESC, ws.id DESC
      LIMIT 5
    `).all() as any[];

    // 5. Weekly consistency (past 7 days)
    const past7Days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      
      const sessionForDay = db.prepare(`
        SELECT workout_type, status 
        FROM workout_sessions 
        WHERE workout_date = ? 
        ORDER BY id DESC LIMIT 1
      `).get(dStr) as any;

      past7Days.push({
        day: dayNames[d.getDay()],
        date: dStr,
        has_workout: !!sessionForDay,
        workout_type: sessionForDay ? sessionForDay.workout_type : undefined,
        status: sessionForDay ? sessionForDay.status : undefined,
      });
    }

    // 6. Monthly workout volume (last 6 months)
    const monthlyVolume = db.prepare(`
      SELECT 
        substr(ws.workout_date, 1, 7) as month,
        COUNT(DISTINCT ws.id) as workouts_count,
        COALESCE(SUM(sl.repetitions), 0) as total_reps
      FROM workout_sessions ws
      LEFT JOIN exercise_logs el ON el.session_id = ws.id
      LEFT JOIN set_logs sl ON sl.exercise_log_id = el.id
      WHERE ws.status = 'completed' AND ws.workout_date >= date('now', '-6 months')
      GROUP BY substr(ws.workout_date, 1, 7)
      ORDER BY month ASC
    `).all() as any[];

    // 7. Recent rep trends (last 10 completed workouts)
    const recentRepTrends = db.prepare(`
      SELECT 
        ws.id,
        ws.workout_date,
        ws.workout_type,
        COALESCE(SUM(sl.repetitions), 0) as total_reps
      FROM workout_sessions ws
      JOIN exercise_logs el ON el.session_id = ws.id
      JOIN set_logs sl ON sl.exercise_log_id = el.id
      WHERE ws.status = 'completed'
      GROUP BY ws.id
      ORDER BY ws.workout_date ASC, ws.id ASC
      LIMIT 15
    `).all() as any[];

    res.json({
      user,
      today_schedule: currentCycleItem ? {
        cycle_order: currentCycleItem.cycle_order,
        workout_type: currentCycleItem.workout_type,
        template_id: currentCycleItem.template_id,
        template_name: currentCycleItem.template_name,
        is_rest: currentCycleItem.workout_type.toLowerCase() === 'rest',
        is_completed_today: !!todaySession,
      } : {
        cycle_order: 1,
        workout_type: 'Arms',
        template_id: 1,
        template_name: 'Arms',
        is_rest: false,
        is_completed_today: false,
      },
      schedule_cycle: scheduleWithState,
      stats: {
        total_workouts: totalWorkouts,
        workouts_this_month: monthWorkouts,
        current_streak: currentStreak,
        total_repetitions: totalRepsAllTime,
        total_personal_records: totalPersonalRecords,
      },
      recent_sessions: recentSessionsRaw,
      weekly_consistency: past7Days,
      monthly_volume: monthlyVolume,
      recent_rep_trends: recentRepTrends,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
