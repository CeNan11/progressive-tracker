import React, { useEffect, useState } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  MoveUp, 
  MoveDown, 
  Check, 
  AlertCircle,
  Dumbbell,
  Moon
} from 'lucide-react';
import { api } from '../services/api';
import { ScheduledWorkoutItem, WorkoutTemplate } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const SchedulePage: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduledWorkoutItem[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scheduleData, templatesData] = await Promise.all([
        api.getSchedule(),
        api.getTemplates(),
      ]);
      setSchedule(scheduleData);
      setTemplates(templatesData);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load schedule' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTypeChange = (index: number, newType: string) => {
    const updated = [...schedule];
    const isRest = newType.toLowerCase() === 'rest';
    
    // Find matching template if available
    let matchingTemplate = templates.find(t => t.name.toLowerCase() === newType.toLowerCase());
    
    updated[index] = {
      ...updated[index],
      workout_type: newType,
      template_id: isRest ? null : (matchingTemplate?.id || updated[index].template_id || null),
      template_name: isRest ? null : (matchingTemplate?.name || null),
    };
    setSchedule(updated);
  };

  const handleTemplateChange = (index: number, templateIdStr: string) => {
    const updated = [...schedule];
    const tId = templateIdStr ? parseInt(templateIdStr, 10) : null;
    const found = templates.find(t => t.id === tId);

    updated[index] = {
      ...updated[index],
      template_id: tId,
      template_name: found ? found.name : null,
      workout_type: found ? found.name : updated[index].workout_type,
    };
    setSchedule(updated);
  };

  const moveDay = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= schedule.length) return;

    const updated = [...schedule];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate cycle orders
    const reordered = updated.map((item, idx) => ({
      ...item,
      cycle_order: idx + 1,
    }));
    setSchedule(reordered);
  };

  const addCycleDay = () => {
    const nextOrder = schedule.length + 1;
    const defaultTemplate = templates[0];
    const newDay: ScheduledWorkoutItem = {
      id: Date.now(),
      cycle_order: nextOrder,
      workout_type: defaultTemplate ? defaultTemplate.name : 'Workout',
      template_id: defaultTemplate ? defaultTemplate.id : null,
      template_name: defaultTemplate ? defaultTemplate.name : null,
    };
    setSchedule([...schedule, newDay]);
  };

  const removeCycleDay = (index: number) => {
    if (schedule.length <= 1) {
      setMessage({ type: 'error', text: 'Schedule must contain at least one day.' });
      return;
    }
    const filtered = schedule.filter((_, idx) => idx !== index);
    const reordered = filtered.map((item, idx) => ({
      ...item,
      cycle_order: idx + 1,
    }));
    setSchedule(reordered);
  };

  const resetToDefaultSplit = () => {
    const armsTemplate = templates.find(t => t.name.toLowerCase() === 'arms') || templates[0];
    const backTemplate = templates.find(t => t.name.toLowerCase() === 'back') || templates[1] || templates[0];
    const legsTemplate = templates.find(t => t.name.toLowerCase() === 'legs') || templates[2] || templates[0];

    const defaultCycle: ScheduledWorkoutItem[] = [
      { id: 1, cycle_order: 1, workout_type: 'Arms', template_id: armsTemplate?.id || null, template_name: 'Arms' },
      { id: 2, cycle_order: 2, workout_type: 'Back', template_id: backTemplate?.id || null, template_name: 'Back' },
      { id: 3, cycle_order: 3, workout_type: 'Legs', template_id: legsTemplate?.id || null, template_name: 'Legs' },
      { id: 4, cycle_order: 4, workout_type: 'Rest', template_id: null, template_name: null },
      { id: 5, cycle_order: 5, workout_type: 'Arms', template_id: armsTemplate?.id || null, template_name: 'Arms' },
      { id: 6, cycle_order: 6, workout_type: 'Back', template_id: backTemplate?.id || null, template_name: 'Back' },
    ];
    setSchedule(defaultCycle);
    setMessage({ type: 'success', text: 'Reset to standard 6-day split: Arms, Back, Legs, Rest, Arms, Back. Click "Save Schedule" to commit.' });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const payload = schedule.map((item, idx) => ({
        cycle_order: idx + 1,
        workout_type: item.workout_type,
        template_id: item.template_id,
      }));

      const updated = await api.updateSchedule(payload);
      setSchedule(updated);
      setMessage({ type: 'success', text: 'Workout schedule updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save schedule' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="animate-spin w-8 h-8 border-3 border-tracker-accent border-t-transparent rounded-full" />
        <p className="text-sm text-tracker-textMuted">Loading workout routine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-tracker-text flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-tracker-accent" />
            Configurable Workout Schedule
          </h2>
          <p className="text-xs text-tracker-textMuted mt-1">
            Configure your repeating training split. Repeated days automatically reuse their respective exercise templates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={resetToDefaultSplit}
          >
            Reset Default 6-Day Split
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSave}
            loading={saving}
          >
            Save Schedule
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300' 
            : 'bg-red-950/40 border-red-700/50 text-red-300'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Routine Cards List */}
      <div className="space-y-3">
        {schedule.map((day, idx) => {
          const isRest = day.workout_type.toLowerCase() === 'rest';

          return (
            <Card
              key={`${day.id}-${idx}`}
              className="transition-all border-tracker-border hover:border-tracker-accent/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Day Badge & Order Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveDay(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-tracker-surfaceLight hover:bg-tracker-surfaceHover disabled:opacity-30 text-tracker-textMuted hover:text-tracker-text"
                      title="Move up in cycle"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveDay(idx, 'down')}
                      disabled={idx === schedule.length - 1}
                      className="p-1 rounded bg-tracker-surfaceLight hover:bg-tracker-surfaceHover disabled:opacity-30 text-tracker-textMuted hover:text-tracker-text"
                      title="Move down in cycle"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-tracker-bg border border-tracker-border flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-tracker-textDim">Day</span>
                    <span className="text-base font-extrabold text-tracker-accent">{idx + 1}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-tracker-text flex items-center gap-2">
                      {isRest ? (
                        <Moon className="w-4 h-4 text-purple-300" />
                      ) : (
                        <Dumbbell className="w-4 h-4 text-tracker-accent" />
                      )}
                      Day {idx + 1}: {day.workout_type}
                    </h3>
                    <p className="text-xs text-tracker-textMuted">
                      {isRest ? 'Rest and muscle recovery day' : `Linked template: ${day.template_name || 'No template selected'}`}
                    </p>
                  </div>
                </div>

                {/* Workout Type & Template selectors */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                  <div className="w-32">
                    <label className="text-[10px] text-tracker-textDim uppercase font-semibold block mb-1">
                      Type
                    </label>
                    <select
                      value={day.workout_type}
                      onChange={(e) => handleTypeChange(idx, e.target.value)}
                      className="w-full bg-tracker-bg border border-tracker-border rounded-xl px-3 py-1.5 text-xs text-tracker-text focus:outline-none focus:border-tracker-accent"
                    >
                      <option value="Arms">Arms</option>
                      <option value="Back">Back</option>
                      <option value="Legs">Legs</option>
                      <option value="Rest">Rest</option>
                      <option value="Chest">Chest</option>
                      <option value="Full Body">Full Body</option>
                      <option value="Shoulders">Shoulders</option>
                    </select>
                  </div>

                  {!isRest && (
                    <div className="w-44">
                      <label className="text-[10px] text-tracker-textDim uppercase font-semibold block mb-1">
                        Exercise Template
                      </label>
                      <select
                        value={day.template_id || ''}
                        onChange={(e) => handleTemplateChange(idx, e.target.value)}
                        className="w-full bg-tracker-bg border border-tracker-border rounded-xl px-3 py-1.5 text-xs text-tracker-text focus:outline-none focus:border-tracker-accent"
                      >
                        <option value="">-- Select Template --</option>
                        {templates.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name} ({tpl.exercises?.length || 0} exercises)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="pt-4 sm:pt-4">
                    <button
                      onClick={() => removeCycleDay(idx)}
                      disabled={schedule.length <= 1}
                      className="p-2 rounded-xl text-tracker-textMuted hover:text-red-300 hover:bg-tracker-danger/20 disabled:opacity-20 transition-colors"
                      title="Remove day"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={addCycleDay}
        >
          Add Cycle Day
        </Button>

        <Button
          variant="primary"
          size="md"
          icon={<Save className="w-4 h-4" />}
          onClick={handleSave}
          loading={saving}
        >
          Save Schedule Changes
        </Button>
      </div>
    </div>
  );
};
