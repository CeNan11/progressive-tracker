import db from './database';

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
    insertTemplate.run(1, 'Arms', 'Targeting Biceps, Triceps, and Forearms with progressive rep overload');
    insertTemplate.run(2, 'Back', 'Targeting Lats, Upper Back, Rear Delts, and Traps with fixed dumbbells');
    insertTemplate.run(3, 'Legs', 'Targeting Quads, Hamstrings, Glutes, and Calves');

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

    // 4. Exercise Bank
    const insertExercise = db.prepare(`
      INSERT INTO exercises (id, name, muscle_group, default_weight, target_min_reps, target_max_reps, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Arms exercises
    insertExercise.run(1, 'Dumbbell Bicep Curl', 'Biceps', 10.0, 8, 12, 'Strict form, full extension at the bottom');
    insertExercise.run(2, 'Hammer Curl', 'Forearms', 10.0, 8, 12, 'Neutral grip, pause at contraction');
    insertExercise.run(3, 'Overhead Tricep Extension', 'Triceps', 10.0, 8, 12, 'Keep elbows tucked, full stretch at bottom');
    insertExercise.run(4, 'Dumbbell Skull Crushers', 'Triceps', 10.0, 8, 12, 'Controlled descent to ears, squeeze triceps');
    insertExercise.run(5, 'Dumbbell Wrist Curls', 'Forearms', 10.0, 10, 15, 'Forearms rested on bench/knees');

    // Back exercises
    insertExercise.run(6, 'One-Arm Dumbbell Row', 'Back', 10.0, 8, 12, 'Pull towards hip, squeeze lat at peak');
    insertExercise.run(7, 'Bent-Over Dumbbell Row', 'Back', 10.0, 8, 12, '45-degree hinge, pull elbows back');
    insertExercise.run(8, 'Dumbbell Shrugs', 'Back', 10.0, 10, 15, 'Straight up elevation, 1s hold at peak');
    insertExercise.run(9, 'Dumbbell Reverse Fly', 'Shoulders', 10.0, 10, 14, 'Rear delt contraction, slight bend in elbows');
    insertExercise.run(10, 'Dumbbell Pullover', 'Back', 10.0, 8, 12, 'Deep stretch across ribcage');

    // Legs exercises
    insertExercise.run(11, 'Dumbbell Goblet Squat', 'Legs', 10.0, 8, 12, 'Hold dumbbell at chest, break parallel');
    insertExercise.run(12, 'Dumbbell Romanian Deadlift', 'Legs', 10.0, 8, 12, 'Hinge at hips, keep spine neutral, deep hamstring stretch');
    insertExercise.run(13, 'Dumbbell Walking Lunges', 'Legs', 10.0, 8, 12, 'Controlled step, knee hovering above floor');
    insertExercise.run(14, 'Dumbbell Standing Calf Raises', 'Legs', 10.0, 12, 16, 'Full extension on toes with pause at top');

    // Other exercises
    insertExercise.run(15, 'Dumbbell Lateral Raise', 'Shoulders', 10.0, 10, 15, 'Raise to shoulder level, lead with elbows');
    insertExercise.run(16, 'Dumbbell Floor Press', 'Chest', 10.0, 8, 12, 'Upper arms touch floor gently before pressing up');

    // 5. Template Exercises mapping
    const insertTemplateEx = db.prepare(`
      INSERT INTO template_exercises (template_id, exercise_id, exercise_order, default_sets)
      VALUES (?, ?, ?, ?)
    `);

    // Arms template (Template 1)
    insertTemplateEx.run(1, 1, 1, 3); // Bicep Curl
    insertTemplateEx.run(1, 2, 2, 3); // Hammer Curl
    insertTemplateEx.run(1, 3, 3, 3); // Overhead Tricep Ext
    insertTemplateEx.run(1, 4, 4, 3); // Skull Crushers
    insertTemplateEx.run(1, 5, 5, 3); // Wrist Curls

    // Back template (Template 2)
    insertTemplateEx.run(2, 6, 1, 3); // One-Arm Row
    insertTemplateEx.run(2, 7, 2, 3); // Bent-Over Row
    insertTemplateEx.run(2, 8, 3, 3); // Shrugs
    insertTemplateEx.run(2, 9, 4, 3); // Reverse Fly
    insertTemplateEx.run(2, 10, 5, 3); // Pullover

    // Legs template (Template 3)
    insertTemplateEx.run(3, 11, 1, 3); // Goblet Squat
    insertTemplateEx.run(3, 12, 2, 3); // RDL
    insertTemplateEx.run(3, 13, 3, 3); // Walking Lunges
    insertTemplateEx.run(3, 14, 4, 3); // Calf Raises
  });

  transaction();
  console.log('Database initialized and seeded successfully.');
}
