export type MuscleGroup = 
  | 'Biceps'
  | 'Triceps'
  | 'Shoulders'
  | 'Forearms'
  | 'Back'
  | 'Legs'
  | 'Chest'
  | 'Other';

export type SessionStatus = 'in_progress' | 'completed' | 'skipped' | 'rest';

export interface Exercise {
  id: number;
  name: string;
  muscle_group: MuscleGroup;
  default_weight: number;
  target_min_reps: number;
  target_max_reps: number;
  notes?: string | null;
  created_at?: string;
  times_performed?: number;
  last_performed_date?: string | null;
  personal_record_reps?: number;
}

export interface TemplateExerciseItem extends Exercise {
  exercise_order: number;
  default_sets: number;
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
  exercises?: TemplateExerciseItem[];
}

export interface ScheduledWorkoutItem {
  id: number;
  cycle_order: number;
  workout_type: string;
  template_id: number | null;
  template_name?: string | null;
  template_description?: string | null;
  is_current_day?: boolean;
  is_completed_today?: boolean;
}

export interface SetLog {
  id?: number;
  exercise_log_id?: number;
  set_number: number;
  repetitions: number;
}

export interface ExerciseLog {
  id?: number;
  session_id?: number;
  exercise_id: number;
  exercise_name?: string;
  muscle_group?: MuscleGroup;
  weight_used: number;
  exercise_order: number;
  notes?: string | null;
  sets: SetLog[];
  total_reps?: number;
  comparison?: OverloadComparison;
}

export interface WorkoutSession {
  id: number;
  template_id?: number | null;
  template_name?: string | null;
  workout_type: string;
  workout_date: string;
  started_at?: string | null;
  completed_at?: string | null;
  duration_minutes?: number | null;
  status: SessionStatus;
  notes?: string | null;
  total_reps?: number;
  total_exercises?: number;
  total_sets?: number;
  improvements?: {
    improved_count: number;
    maintained_count: number;
    decreased_count: number;
    pr_count: number;
  };
  exercise_logs?: ExerciseLog[];
}

export interface OverloadComparison {
  exercise_id: number;
  exercise_name: string;
  muscle_group: MuscleGroup;
  target_min_reps: number;
  target_max_reps: number;
  current_weight: number;
  current_sets: { set_number: number; repetitions: number }[];
  current_total_reps: number;
  previous_weight?: number;
  previous_date?: string;
  previous_sets?: { set_number: number; repetitions: number }[];
  previous_total_reps?: number;
  rep_difference?: number;
  rep_percentage_change?: number;
  performance_state: 'improved' | 'maintained' | 'decreased' | 'first_time';
  target_state: 'progressing' | 'approaching' | 'target_achieved' | 'exceeded';
  is_personal_record: boolean;
  personal_record_reps: number;
}

export interface ExerciseStats {
  exercise: Exercise;
  total_sessions_performed: number;
  personal_record_total_reps: number;
  latest_performance?: {
    date: string;
    weight: number;
    total_reps: number;
    sets: { set_number: number; repetitions: number }[];
  };
  previous_performance?: {
    date: string;
    weight: number;
    total_reps: number;
    sets: { set_number: number; repetitions: number }[];
  };
  history: {
    session_id: number;
    date: string;
    weight_used: number;
    sets: { set_number: number; repetitions: number }[];
    total_reps: number;
  }[];
}

export interface DashboardSummary {
  user: { username: string };
  today_schedule: {
    cycle_order: number;
    workout_type: string;
    template_id: number | null;
    template_name?: string;
    is_rest: boolean;
    is_completed_today?: boolean;
  };
  schedule_cycle: ScheduledWorkoutItem[];
  stats: {
    total_workouts: number;
    workouts_this_month: number;
    current_streak: number;
    total_repetitions: number;
    total_personal_records: number;
  };
  recent_sessions: WorkoutSession[];
  weekly_consistency: {
    day: string;
    date: string;
    has_workout: boolean;
    workout_type?: string;
    status?: string;
  }[];
  monthly_volume: {
    month: string;
    total_reps: number;
    workouts_count: number;
  }[];
  recent_rep_trends: {
    id: number;
    date: string;
    workout_type: string;
    total_reps: number;
  }[];
}
