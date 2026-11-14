-- Database Schema for Personal Progressive Overload Tracker

PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Workout Templates (e.g. Arms, Back, Legs)
CREATE TABLE IF NOT EXISTS workout_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Scheduled Workouts (e.g. 6-day cycle: 1. Arms, 2. Back, 3. Legs, 4. Rest, 5. Arms, 6. Back)
CREATE TABLE IF NOT EXISTS scheduled_workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER REFERENCES workout_templates(id) ON DELETE SET NULL,
  cycle_order INTEGER NOT NULL UNIQUE,
  workout_type TEXT NOT NULL
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  muscle_group TEXT NOT NULL,
  default_weight REAL NOT NULL DEFAULT 10.0,
  target_min_reps INTEGER NOT NULL DEFAULT 8,
  target_max_reps INTEGER NOT NULL DEFAULT 12,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Template Exercises (many-to-many link between templates and exercises)
CREATE TABLE IF NOT EXISTS template_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  exercise_order INTEGER NOT NULL,
  default_sets INTEGER NOT NULL DEFAULT 3,
  UNIQUE(template_id, exercise_id),
  UNIQUE(template_id, exercise_order)
);

-- Workout Sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER REFERENCES workout_templates(id) ON DELETE SET NULL,
  workout_type TEXT NOT NULL,
  workout_date TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  duration_minutes INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('in_progress', 'completed', 'skipped', 'rest')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Exercise Logs within a session
CREATE TABLE IF NOT EXISTS exercise_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  weight_used REAL NOT NULL,
  exercise_order INTEGER NOT NULL,
  notes TEXT
);

-- Set Logs for individual sets within an exercise log
CREATE TABLE IF NOT EXISTS set_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_log_id INTEGER NOT NULL REFERENCES exercise_logs(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  repetitions INTEGER NOT NULL CHECK(repetitions >= 0),
  UNIQUE(exercise_log_id, set_number)
);

-- Indexes for fast querying of historical performance and trends
CREATE INDEX IF NOT EXISTS idx_sessions_date ON workout_sessions(workout_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON workout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_session ON exercise_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise ON exercise_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_exercise_log ON set_logs(exercise_log_id);
