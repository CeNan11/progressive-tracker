import { Router, Request, Response } from 'express';
import db from '../db/database';

const router = Router();

// GET all templates
router.get('/', (_req: Request, res: Response) => {
  try {
    const templates = db.prepare('SELECT * FROM workout_templates ORDER BY name ASC').all() as any[];

    const result = templates.map(t => {
      const exercises = db.prepare(`
        SELECT 
          e.*,
          te.exercise_order,
          te.default_sets
        FROM template_exercises te
        JOIN exercises e ON te.exercise_id = e.id
        WHERE te.template_id = ?
        ORDER BY te.exercise_order ASC
      `).all(t.id);

      return {
        ...t,
        exercises,
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single template by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const template = db.prepare('SELECT * FROM workout_templates WHERE id = ?').get(id) as any;

    if (!template) {
      return res.status(404).json({ error: 'Workout template not found.' });
    }

    const exercises = db.prepare(`
      SELECT 
        e.*,
        te.exercise_order,
        te.default_sets
      FROM template_exercises te
      JOIN exercises e ON te.exercise_id = e.id
      WHERE te.template_id = ?
      ORDER BY te.exercise_order ASC
    `).all(template.id);

    res.json({
      ...template,
      exercises,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create template
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, exercises } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Template name is required.' });
    }

    const transaction = db.transaction(() => {
      const info = db.prepare(
        'INSERT INTO workout_templates (name, description) VALUES (?, ?)'
      ).run(name.trim(), description ? description.trim() : null);

      const templateId = info.lastInsertRowid as number;

      if (Array.isArray(exercises)) {
        const insertTe = db.prepare(`
          INSERT INTO template_exercises (template_id, exercise_id, exercise_order, default_sets)
          VALUES (?, ?, ?, ?)
        `);

        exercises.forEach((ex: any, idx: number) => {
          insertTe.run(templateId, ex.exercise_id || ex.id, ex.exercise_order || idx + 1, ex.default_sets || 3);
        });
      }

      return templateId;
    });

    const newId = transaction();
    const created = db.prepare('SELECT * FROM workout_templates WHERE id = ?').get(newId);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update template
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { name, description, exercises } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Template name is required.' });
    }

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE workout_templates
        SET name = ?, description = ?
        WHERE id = ?
      `).run(name.trim(), description ? description.trim() : null, id);

      if (Array.isArray(exercises)) {
        db.prepare('DELETE FROM template_exercises WHERE template_id = ?').run(id);

        const insertTe = db.prepare(`
          INSERT INTO template_exercises (template_id, exercise_id, exercise_order, default_sets)
          VALUES (?, ?, ?, ?)
        `);

        exercises.forEach((ex: any, idx: number) => {
          insertTe.run(id, ex.exercise_id || ex.id, ex.exercise_order || idx + 1, ex.default_sets || 3);
        });
      }
    });

    transaction();
    const updated = db.prepare('SELECT * FROM workout_templates WHERE id = ?').get(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE template
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const info = db.prepare('DELETE FROM workout_templates WHERE id = ?').run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    res.json({ message: 'Template deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
