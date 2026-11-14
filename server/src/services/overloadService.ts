import db from '../db/database';
import { OverloadComparison, MuscleGroup, ExerciseStats } from '../types';

/**
 * Service handling all progressive overload calculations and history analytics.
 * Built specifically for fixed-weight dumbbells where rep progression is king.
 */
export class OverloadService {
  /**
   * Get the most recent prior performance for an exercise before a given session (or current time)
   */
  static getPreviousPerformance(exerciseId: number, beforeSessionId?: number) {
    let query = `
      SELECT 
        ws.id as session_id,
        ws.workout_date,
        el.id as exercise_log_id,
        el.weight_used
      FROM exercise_logs el
      JOIN workout_sessions ws ON el.session_id = ws.id
      WHERE el.exercise_id = ? 
        AND ws.status = 'completed'
    `;
    const params: any[] = [exerciseId];

    if (beforeSessionId) {
      query += ` AND ws.id < ?`;
      params.push(beforeSessionId);
    }

    query += ` ORDER BY ws.workout_date DESC, ws.id DESC LIMIT 1`;

    const latestLog = db.prepare(query).get(...params) as {
      session_id: number;
      workout_date: string;
      exercise_log_id: number;
      weight_used: number;
    } | undefined;

    if (!latestLog) return null;

    const sets = db.prepare(`
      SELECT set_number, repetitions 
      FROM set_logs 
      WHERE exercise_log_id = ? 
      ORDER BY set_number ASC
    `).all(latestLog.exercise_log_id) as { set_number: number; repetitions: number }[];

    const totalReps = sets.reduce((sum, s) => sum + s.repetitions, 0);

    return {
      session_id: latestLog.session_id,
      workout_date: latestLog.workout_date,
      weight_used: latestLog.weight_used,
      sets,
      total_reps: totalReps,
    };
  }

  /**
   * Get all-time personal record (PR) total reps for an exercise
   */
  static getPersonalRecord(exerciseId: number, beforeSessionId?: number): number {
    let query = `
      SELECT el.id as exercise_log_id, SUM(sl.repetitions) as total_reps
      FROM exercise_logs el
      JOIN workout_sessions ws ON el.session_id = ws.id
      JOIN set_logs sl ON sl.exercise_log_id = el.id
      WHERE el.exercise_id = ? AND ws.status = 'completed'
    `;
    const params: any[] = [exerciseId];

    if (beforeSessionId) {
      query += ` AND ws.id < ?`;
      params.push(beforeSessionId);
    }

    query += ` GROUP BY el.id ORDER BY total_reps DESC LIMIT 1`;

    const record = db.prepare(query).get(...params) as { total_reps: number } | undefined;
    return record?.total_reps || 0;
  }

  /**
   * Compare an exercise's current session performance with its previous session
   */
  static analyzeExercisePerformance(
    exerciseId: number,
    currentWeight: number,
    currentSets: { set_number: number; repetitions: number }[],
    currentSessionId?: number
  ): OverloadComparison {
    const exercise = db.prepare(`
      SELECT id, name, muscle_group, target_min_reps, target_max_reps 
      FROM exercises 
      WHERE id = ?
    `).get(exerciseId) as {
      id: number;
      name: string;
      muscle_group: MuscleGroup;
      target_min_reps: number;
      target_max_reps: number;
    };

    if (!exercise) {
      throw new Error(`Exercise with ID ${exerciseId} not found`);
    }

    const currentTotalReps = currentSets.reduce((sum, s) => sum + (Number(s.repetitions) || 0), 0);
    const previous = this.getPreviousPerformance(exerciseId, currentSessionId);
    const previousBestReps = this.getPersonalRecord(exerciseId, currentSessionId);

    let performanceState: 'improved' | 'maintained' | 'decreased' | 'first_time' = 'first_time';
    let repDiff: number | undefined = undefined;
    let percentageChange: number | undefined = undefined;

    if (previous) {
      repDiff = currentTotalReps - previous.total_reps;
      if (previous.total_reps > 0) {
        percentageChange = Math.round(((repDiff) / previous.total_reps) * 100 * 10) / 10;
      } else {
        percentageChange = 0;
      }

      if (repDiff > 0) {
        performanceState = 'improved';
      } else if (repDiff === 0) {
        performanceState = 'maintained';
      } else {
        performanceState = 'decreased';
      }
    }

    // Determine target progress based on average reps per set
    const numSets = currentSets.length || 1;
    const avgRepsPerSet = currentTotalReps / numSets;
    let targetState: 'progressing' | 'approaching' | 'target_achieved' | 'exceeded' = 'progressing';

    if (avgRepsPerSet >= exercise.target_max_reps) {
      targetState = avgRepsPerSet > exercise.target_max_reps ? 'exceeded' : 'target_achieved';
    } else if (avgRepsPerSet >= exercise.target_min_reps + (exercise.target_max_reps - exercise.target_min_reps) * 0.5) {
      targetState = 'approaching';
    } else {
      targetState = 'progressing';
    }

    // Is personal record?
    // If currentTotalReps > previousBestReps (and currentTotalReps > 0)
    const isPr = currentTotalReps > previousBestReps && currentTotalReps > 0;
    const prReps = Math.max(previousBestReps, currentTotalReps);

    return {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      muscle_group: exercise.muscle_group,
      target_min_reps: exercise.target_min_reps,
      target_max_reps: exercise.target_max_reps,
      current_weight: currentWeight,
      current_sets: currentSets,
      current_total_reps: currentTotalReps,
      previous_weight: previous?.weight_used,
      previous_date: previous?.workout_date,
      previous_sets: previous?.sets,
      previous_total_reps: previous?.total_reps,
      rep_difference: repDiff,
      rep_percentage_change: percentageChange,
      performance_state: performanceState,
      target_state: targetState,
      is_personal_record: isPr,
      personal_record_reps: prReps,
    };
  }

  /**
   * Get full historical statistics and chart data for an exercise
   */
  static getExerciseStats(exerciseId: number, rangeDays?: number): ExerciseStats {
    const exercise = db.prepare(`
      SELECT * FROM exercises WHERE id = ?
    `).get(exerciseId) as any;

    if (!exercise) {
      throw new Error(`Exercise not found`);
    }

    let query = `
      SELECT 
        ws.id as session_id,
        ws.workout_date,
        el.id as exercise_log_id,
        el.weight_used
      FROM exercise_logs el
      JOIN workout_sessions ws ON el.session_id = ws.id
      WHERE el.exercise_id = ? AND ws.status = 'completed'
    `;
    const params: any[] = [exerciseId];

    if (rangeDays && rangeDays > 0) {
      query += ` AND ws.workout_date >= date('now', '-' || ? || ' days')`;
      params.push(rangeDays);
    }

    query += ` ORDER BY ws.workout_date ASC, ws.id ASC`;

    const logs = db.prepare(query).all(...params) as {
      session_id: number;
      workout_date: string;
      exercise_log_id: number;
      weight_used: number;
    }[];

    const history = logs.map(log => {
      const sets = db.prepare(`
        SELECT set_number, repetitions 
        FROM set_logs 
        WHERE exercise_log_id = ? 
        ORDER BY set_number ASC
      `).all(log.exercise_log_id) as { set_number: number; repetitions: number }[];

      const totalReps = sets.reduce((sum, s) => sum + s.repetitions, 0);

      return {
        session_id: log.session_id,
        date: log.workout_date,
        weight_used: log.weight_used,
        sets,
        total_reps: totalReps,
      };
    });

    // All time PR
    const prTotalReps = this.getPersonalRecord(exerciseId);

    // Latest and previous performance
    const totalSessions = history.length;
    const latest = totalSessions > 0 ? history[totalSessions - 1] : undefined;
    const previous = totalSessions > 1 ? history[totalSessions - 2] : undefined;

    return {
      exercise,
      total_sessions_performed: totalSessions,
      personal_record_total_reps: prTotalReps,
      latest_performance: latest ? {
        date: latest.date,
        weight: latest.weight_used,
        total_reps: latest.total_reps,
        sets: latest.sets,
      } : undefined,
      previous_performance: previous ? {
        date: previous.date,
        weight: previous.weight_used,
        total_reps: previous.total_reps,
        sets: previous.sets,
      } : undefined,
      history,
    };
  }
}
