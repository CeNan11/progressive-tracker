import db from './database';

/**
 * STRICT INITIAL EXERCISE WHITELIST:
 * Only the following 9 exercises are seeded.
 * Arms: Preacher Curls, Skull Crushers, Front Raise, Lateral Raise
 * Back: Wide Dumbell Row, Close Dumbell row, Shrugs
 * Legs: RDL, Squats
 */
export function seedDatabase(force: boolean = false) {
  const existingTemplates = db.prepare('SELECT COUNT(*) as count FROM workout_templates').get() as { count: number };
  
  if (existingTemplates.count > 0 && !force) {
    return; // Already seeded
  }

  const transaction = db.transaction(() => {
    if (force) {
      db.prepare('DELETE FROM set_logs').run();
      db.prepare('DELETE FROM exercise_logs').run();
      db.prepare('DELETE FROM workout_sessions').run();
      db.prepare('DELETE FROM template_exercises').run();
      db.prepare('DELETE FROM scheduled_workouts').run();
      db.prepare('DELETE FROM exercises').run();
      db.prepare('DELETE FROM workout_templates').run();
      db.prepare('DELETE FROM users').run();
    }

    // 1. User
    db.prepare('INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)').run(1, 'Athlete');

    // 2. Workout Templates
    const insertTemplate = db.prepare(
      'INSERT INTO workout_templates (id, name, description) VALUES (?, ?, ?)'
    );
    insertTemplate.run(1, 'Arms', 'Preacher Curls, Skull Crushers, Front Raise, Lateral Raise');
    insertTemplate.run(2, 'Back', 'Wide Dumbell Row, Close Dumbell row, Shrugs');
    insertTemplate.run(3, 'Legs', 'RDL, Squats');

    // 3. Configurable 6-Day Workout Schedule:
    // 1: Arms, 2: Back, 3: Legs, 4: Rest, 5: Arms, 6: Back
    const insertSchedule = db.prepare(
      'INSERT INTO scheduled_workouts (cycle_order, workout_type, template_id) VALUES (?, ?, ?)'
    );
    insertSchedule.run(1, 'Arms', 1);
    insertSchedule.run(2, 'Back', 2);
    insertSchedule.run(3, 'Legs', 3);
    insertSchedule.run(4, 'Rest', null);
    insertSchedule.run(5, 'Arms', 1);
    insertSchedule.run(6, 'Back', 2);

    // 4. Strict 9 Exercises (Preserving exact requested names)
    const insertExercise = db.prepare(`
      INSERT INTO exercises (id, name, muscle_group, default_weight, target_min_reps, target_max_reps, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Arms Workout
    insertExercise.run(1, 'Preacher Curls', 'Biceps', 10.0, 8, 12, 'Arms workout exercise 1');
    insertExercise.run(2, 'Skull Crushers', 'Triceps', 10.0, 8, 12, 'Arms workout exercise 2');
    insertExercise.run(3, 'Front Raise', 'Shoulders', 10.0, 8, 12, 'Arms workout exercise 3');
    insertExercise.run(4, 'Lateral Raise', 'Shoulders', 10.0, 8, 12, 'Arms workout exercise 4');

    // Back Workout
    insertExercise.run(5, 'Wide Dumbell Row', 'Back', 10.0, 8, 12, 'Back workout exercise 1');
    insertExercise.run(6, 'Close Dumbell row', 'Back', 10.0, 8, 12, 'Back workout exercise 2');
    insertExercise.run(7, 'Shrugs', 'Back', 10.0, 8, 12, 'Back workout exercise 3');

    // Legs Workout
    insertExercise.run(8, 'RDL', 'Legs', 10.0, 8, 12, 'Legs workout exercise 1');
    insertExercise.run(9, 'Squats', 'Legs', 10.0, 8, 12, 'Legs workout exercise 2');

    // 5. Template Exercises mapping
    const insertTemplateEx = db.prepare(`
      INSERT INTO template_exercises (template_id, exercise_id, exercise_order, default_sets)
      VALUES (?, ?, ?, ?)
    `);

    // Arms template (Template 1)
    insertTemplateEx.run(1, 1, 1, 3); // Preacher Curls
    insertTemplateEx.run(1, 2, 2, 3); // Skull Crushers
    insertTemplateEx.run(1, 3, 3, 3); // Front Raise
    insertTemplateEx.run(1, 4, 4, 3); // Lateral Raise

    // Back template (Template 2)
    insertTemplateEx.run(2, 5, 1, 3); // Wide Dumbell Row
    insertTemplateEx.run(2, 6, 2, 3); // Close Dumbell row
    insertTemplateEx.run(2, 7, 3, 3); // Shrugs

    // Legs template (Template 3)
    insertTemplateEx.run(3, 8, 1, 3); // RDL
    insertTemplateEx.run(3, 9, 2, 3); // Squats
  });

  transaction();
  console.log('Database seeded with STRICT 9-exercise whitelist.');
}
