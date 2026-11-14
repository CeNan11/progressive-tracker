import React, { useEffect, useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Trophy, 
  Flame, 
  ArrowLeft, 
  Info, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Dumbbell
} from 'lucide-react';
import { api } from '../services/api';
import { 
  Exercise, 
  WorkoutTemplate, 
  WorkoutSession, 
  OverloadComparison 
} from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { OverloadBadge } from '../components/common/OverloadBadge';
import { Modal } from '../components/common/Modal';

interface ActiveSet {
  set_number: number;
  repetitions: number | '';
  previous_reps?: number;
}

interface ActiveExercise {
  exercise_id: number;
  name: string;
  muscle_group: string;
  weight_used: number;
  target_min_reps: number;
  target_max_reps: number;
  notes?: string;
  skipped: boolean;
  sets: ActiveSet[];
  previous_total?: number;
  previous_date?: string;
  personal_record?: number;
}

interface WorkoutSessionPageProps {
  initialTemplateId?: number;
  initialWorkoutType?: string;
  onFinishWorkout: () => void;
  onCancel: () => void;
}

export const WorkoutSessionPage: React.FC<WorkoutSessionPageProps> = ({
  initialTemplateId,
  initialWorkoutType,
  onFinishWorkout,
  onCancel,
}) => {
  const [workoutType, setWorkoutType] = useState<string>(initialWorkoutType || 'Arms');
  const [templateId, setTemplateId] = useState<number | null>(initialTemplateId || null);
  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [workoutDate, setWorkoutDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Workout timer
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  
  // Loading & Saving states
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<boolean>(false);
  const [saveSuccessSummary, setSaveSuccessSummary] = useState<any | null>(null);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Load template, exercises and historical data
  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        const allExercises = await api.getExercises();
        setAvailableExercises(allExercises);

        let targetTplId = initialTemplateId;
        let targetType = initialWorkoutType;

        // If no template passed, get today's scheduled workout
        if (!targetTplId) {
          const today = await api.getTodaySchedule();
          if (today?.scheduled_item) {
            targetTplId = today.scheduled_item.template_id;
            targetType = today.scheduled_item.workout_type;
          }
        }

        if (targetType) setWorkoutType(targetType);
        if (targetTplId) setTemplateId(targetTplId);

        // If rest day selected
        if (targetType?.toLowerCase() === 'rest') {
          setLoading(false);
          return;
        }

        // Fetch template details if available
        let templateData: WorkoutTemplate | null = null;
        if (targetTplId) {
          try {
            templateData = await api.getTemplate(targetTplId);
          } catch {
            templateData = null;
          }
        }

        let initialList: ActiveExercise[] = [];

        if (templateData && templateData.exercises && templateData.exercises.length > 0) {
          initialList = await Promise.all(
            templateData.exercises.map(async (te) => {
              const prev = await api.getExercisePrevious(te.id).catch(() => ({ previous: null, personal_record: 0 }));
              const prevSets = prev.previous?.sets || [];
              const defaultSetsCount = te.default_sets || 3;

              const sets: ActiveSet[] = [];
              for (let i = 1; i <= defaultSetsCount; i++) {
                const prevSet = prevSets.find((ps: any) => ps.set_number === i);
                sets.push({
                  set_number: i,
                  repetitions: '',
                  previous_reps: prevSet ? prevSet.repetitions : undefined,
                });
              }

              return {
                exercise_id: te.id,
                name: te.name,
                muscle_group: te.muscle_group,
                weight_used: te.default_weight || 10,
                target_min_reps: te.target_min_reps || 8,
                target_max_reps: te.target_max_reps || 12,
                notes: te.notes || undefined,
                skipped: false,
                sets,
                previous_total: prev.previous?.total_reps,
                previous_date: prev.previous?.workout_date,
                personal_record: prev.personal_record,
              };
            })
          );
        } else {
          // Fallback: pick exercises for this muscle group
          const matched = allExercises.filter(e => 
            targetType ? e.muscle_group.toLowerCase() === targetType.toLowerCase() : true
          ).slice(0, 4);

          initialList = await Promise.all(
            matched.map(async (ex) => {
              const prev = await api.getExercisePrevious(ex.id).catch(() => ({ previous: null, personal_record: 0 }));
              const prevSets = prev.previous?.sets || [];
              const sets: ActiveSet[] = [1, 2, 3].map(setNum => {
                const prevSet = prevSets.find((ps: any) => ps.set_number === setNum);
                return {
                  set_number: setNum,
                  repetitions: '',
                  previous_reps: prevSet ? prevSet.repetitions : undefined,
                };
              });

              return {
                exercise_id: ex.id,
                name: ex.name,
                muscle_group: ex.muscle_group,
                weight_used: ex.default_weight || 10,
                target_min_reps: ex.target_min_reps || 8,
                target_max_reps: ex.target_max_reps || 12,
                notes: ex.notes || undefined,
                skipped: false,
                sets,
                previous_total: prev.previous?.total_reps,
                previous_date: prev.previous?.workout_date,
                personal_record: prev.personal_record,
              };
            })
          );
        }

        setExercises(initialList);
      } catch (err) {
        console.error('Failed to init session:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [initialTemplateId, initialWorkoutType]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRepChange = (exerciseIdx: number, setIdx: number, val: string) => {
    const updated = [...exercises];
    const parsed = val === '' ? '' : Math.max(0, parseInt(val, 10));
    updated[exerciseIdx].sets[setIdx].repetitions = parsed;
    setExercises(updated);
  };

  const handleWeightChange = (exerciseIdx: number, val: string) => {
    const updated = [...exercises];
    const parsed = parseFloat(val) || 0;
    updated[exerciseIdx].weight_used = parsed;
    setExercises(updated);
  };

  const addSet = (exerciseIdx: number) => {
    const updated = [...exercises];
    const currentSets = updated[exerciseIdx].sets;
    const newSetNum = currentSets.length + 1;
    currentSets.push({
      set_number: newSetNum,
      repetitions: '',
      previous_reps: undefined,
    });
    setExercises(updated);
  };

  const removeSet = (exerciseIdx: number, setIdx: number) => {
    const updated = [...exercises];
    if (updated[exerciseIdx].sets.length <= 1) return;
    updated[exerciseIdx].sets.splice(setIdx, 1);
    // Renumber remaining sets
    updated[exerciseIdx].sets.forEach((s, idx) => {
      s.set_number = idx + 1;
    });
    setExercises(updated);
  };

  const toggleSkip = (exerciseIdx: number) => {
    const updated = [...exercises];
    updated[exerciseIdx].skipped = !updated[exerciseIdx].skipped;
    setExercises(updated);
  };

  const addExerciseToSession = async (exercise: Exercise) => {
    const prev = await api.getExercisePrevious(exercise.id).catch(() => ({ previous: null, personal_record: 0 }));
    const prevSets = prev.previous?.sets || [];
    const sets: ActiveSet[] = [1, 2, 3].map(setNum => {
      const prevSet = prevSets.find((ps: any) => ps.set_number === setNum);
      return {
        set_number: setNum,
        repetitions: '',
        previous_reps: prevSet ? prevSet.repetitions : undefined,
      };
    });

    const newActiveEx: ActiveExercise = {
      exercise_id: exercise.id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      weight_used: exercise.default_weight || 10,
      target_min_reps: exercise.target_min_reps || 8,
      target_max_reps: exercise.target_max_reps || 12,
      notes: exercise.notes || undefined,
      skipped: false,
      sets,
      previous_total: prev.previous?.total_reps,
      previous_date: prev.previous?.workout_date,
      personal_record: prev.personal_record,
    };

    setExercises([...exercises, newActiveEx]);
    setShowAddExerciseModal(false);
  };

  const calculateExerciseStats = (ex: ActiveExercise) => {
    const validSets = ex.sets.filter(s => typeof s.repetitions === 'number' && s.repetitions >= 0);
    const currentTotal = validSets.reduce((sum, s) => sum + (s.repetitions as number), 0);
    const prevTotal = ex.previous_total;

    let delta: number | null = null;
    let percent: number | null = null;
    let state: 'improved' | 'maintained' | 'decreased' | 'first_time' = 'first_time';

    if (prevTotal !== undefined && prevTotal !== null) {
      delta = currentTotal - prevTotal;
      percent = prevTotal > 0 ? Math.round((delta / prevTotal) * 100 * 10) / 10 : 0;
      if (delta > 0) state = 'improved';
      else if (delta === 0) state = 'maintained';
      else state = 'decreased';
    }

    const isPR = currentTotal > 0 && (ex.personal_record === undefined || currentTotal > ex.personal_record);

    return {
      currentTotal,
      prevTotal,
      delta,
      percent,
      state,
      isPR,
      hasInput: validSets.length > 0,
    };
  };

  // Workout-wide summary calculations
  const totalWorkoutReps = exercises
    .filter(e => !e.skipped)
    .reduce((sum, e) => {
      const eStats = calculateExerciseStats(e);
      return sum + eStats.currentTotal;
    }, 0);

  const completedSetsCount = exercises
    .filter(e => !e.skipped)
    .reduce((sum, e) => {
      return sum + e.sets.filter(s => typeof s.repetitions === 'number' && s.repetitions > 0).length;
    }, 0);

  // Save workout
  const handleSaveWorkout = async () => {
    try {
      setSaving(true);
      const isRest = workoutType.toLowerCase() === 'rest';

      const payloadExerciseLogs = isRest ? [] : exercises
        .filter(e => !e.skipped)
        .map((e, idx) => ({
          exercise_id: e.exercise_id,
          weight_used: e.weight_used,
          exercise_order: idx + 1,
          notes: e.notes || null,
          sets: e.sets.map(s => ({
            set_number: s.set_number,
            repetitions: typeof s.repetitions === 'number' ? s.repetitions : 0,
          })),
        }));

      const payload = {
        template_id: templateId,
        workout_type: workoutType,
        workout_date: workoutDate,
        duration_minutes: Math.max(1, Math.round(durationSeconds / 60)),
        status: isRest ? 'rest' : 'completed',
        notes: workoutNotes,
        exercise_logs: payloadExerciseLogs,
      };

      const result = await api.saveWorkout(payload);
      
      // Calculate summary for congratulatory modal
      let prs = 0;
      let improvements = 0;
      exercises.forEach(e => {
        if (!e.skipped) {
          const stats = calculateExerciseStats(e);
          if (stats.isPR) prs++;
          if (stats.state === 'improved') improvements++;
        }
      });

      setSaveSuccessSummary({
        sessionId: result.id,
        workoutType,
        totalReps: totalWorkoutReps,
        duration: Math.round(durationSeconds / 60),
        prs,
        improvements,
      });
    } catch (err: any) {
      alert(`Error saving workout: ${err.message}`);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin w-8 h-8 border-3 border-tracker-accent border-t-transparent rounded-full" />
        <p className="text-sm text-tracker-textMuted">Loading workout session template...</p>
      </div>
    );
  }

  // Rest Day Logging Interface
  if (workoutType.toLowerCase() === 'rest') {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card className="text-center p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/40 border border-purple-800/40 text-purple-300 mx-auto flex items-center justify-center">
            <Flame className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-tracker-text">Rest & Recovery Day</h2>
          <p className="text-sm text-tracker-textMuted max-w-md mx-auto leading-relaxed">
            Rest is essential for progressive overload. Muscles recover and rebuild stronger during rest periods.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Button variant="secondary" onClick={onCancel}>
              Back
            </Button>
            <Button variant="primary" onClick={handleSaveWorkout} loading={saving}>
              Record Rest Day
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Session Top Bar: Timer & Actions */}
      <div className="sticky top-16 z-20 bg-tracker-bg/95 backdrop-blur-md py-3 border-b border-tracker-border/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (completedSetsCount > 0) setShowExitConfirm(true);
              else onCancel();
            }}
            className="p-2 rounded-xl bg-tracker-surface border border-tracker-border hover:bg-tracker-surfaceLight text-tracker-textMuted hover:text-tracker-text transition-colors"
            title="Leave workout"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-tracker-text">{workoutType} Workout</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 text-xs text-tracker-textMuted">
              <span className="font-mono-numbers font-semibold text-tracker-accent">
                {formatTimer(durationSeconds)}
              </span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="hover:text-tracker-text"
              >
                {isTimerRunning ? <Pause className="w-3 h-3 inline" /> : <Play className="w-3 h-3 inline" />}
              </button>
              <span>•</span>
              <span className="font-mono-numbers">{totalWorkoutReps} reps logged</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddExerciseModal(true)}
          >
            Add Exercise
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<CheckCircle2 className="w-4 h-4" />}
            onClick={handleSaveWorkout}
            loading={saving}
          >
            Finish Workout
          </Button>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-5">
        {exercises.map((ex, exIdx) => {
          const exStats = calculateExerciseStats(ex);

          return (
            <div
              key={`${ex.exercise_id}-${exIdx}`}
              className={`
                rounded-2xl border transition-all p-5 
                ${ex.skipped 
                  ? 'bg-tracker-surface/40 border-tracker-border/40 opacity-60' 
                  : 'bg-tracker-surface border-tracker-border shadow-sm'
                }
              `}
            >
              {/* Exercise Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-tracker-border/70">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-tracker-bg border border-tracker-border flex items-center justify-center text-tracker-accent font-bold text-xs shrink-0 mt-0.5">
                    {exIdx + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-base font-bold ${ex.skipped ? 'line-through text-tracker-textDim' : 'text-tracker-text'}`}>
                        {ex.name}
                      </h3>
                      <Badge variant="default" size="sm">{ex.muscle_group}</Badge>
                      {ex.personal_record !== undefined && ex.personal_record > 0 && (
                        <Badge variant="gold" size="sm" icon={<Trophy className="w-3 h-3 text-amber-400" />}>
                          PR: {ex.personal_record} reps
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-tracker-textMuted mt-0.5">
                      Target: {ex.target_min_reps}–{ex.target_max_reps} reps • Fixed weight
                    </p>
                  </div>
                </div>

                {/* Exercise Controls & Weight Setting */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-tracker-bg border border-tracker-border rounded-xl px-3 py-1.5 text-xs">
                    <span className="text-tracker-textDim font-medium">Weight:</span>
                    <input
                      type="number"
                      step="0.5"
                      value={ex.weight_used}
                      onChange={(e) => handleWeightChange(exIdx, e.target.value)}
                      disabled={ex.skipped}
                      className="w-14 bg-transparent font-bold text-tracker-accent font-mono-numbers focus:outline-none text-right"
                    />
                    <span className="text-tracker-textMuted font-semibold">kg</span>
                  </div>

                  <button
                    onClick={() => toggleSkip(exIdx)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-tracker-border/70 text-tracker-textMuted hover:text-tracker-text hover:bg-tracker-surfaceLight"
                  >
                    {ex.skipped ? 'Restore' : 'Skip'}
                  </button>
                </div>
              </div>

              {!ex.skipped && (
                <>
                  {/* Sets Input Grid */}
                  <div className="space-y-2.5 mb-4">
                    <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-tracker-textDim uppercase tracking-wider px-2">
                      <div className="col-span-2 sm:col-span-1 text-center">Set</div>
                      <div className="col-span-4 sm:col-span-3 text-center">Previous Reps</div>
                      <div className="col-span-5 sm:col-span-4 text-center">Current Reps</div>
                      <div className="col-span-1 sm:col-span-4 text-center sm:text-left">Delta</div>
                    </div>

                    {ex.sets.map((set, setIdx) => {
                      const curReps = typeof set.repetitions === 'number' ? set.repetitions : 0;
                      const hasCurrentInput = typeof set.repetitions === 'number';
                      const prevReps = set.previous_reps;
                      const setDelta = hasCurrentInput && prevReps !== undefined ? curReps - prevReps : null;

                      return (
                        <div
                          key={`${set.set_number}-${setIdx}`}
                          className="grid grid-cols-12 gap-2 items-center bg-tracker-bg/50 border border-tracker-border/60 rounded-xl p-2 sm:p-2.5"
                        >
                          {/* Set Number */}
                          <div className="col-span-2 sm:col-span-1 text-center font-bold text-xs text-tracker-textMuted">
                            #{set.set_number}
                          </div>

                          {/* Previous Reps Display */}
                          <div className="col-span-4 sm:col-span-3 text-center">
                            {prevReps !== undefined ? (
                              <span className="inline-block px-2.5 py-1 rounded-lg bg-tracker-surfaceLight text-tracker-textMuted text-xs font-semibold font-mono-numbers border border-tracker-border/50">
                                {prevReps} reps
                              </span>
                            ) : (
                              <span className="text-xs text-tracker-textDim italic">--</span>
                            )}
                          </div>

                          {/* Current Reps Input (Large, touch-friendly) */}
                          <div className="col-span-5 sm:col-span-4 flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              placeholder="0"
                              value={set.repetitions}
                              onChange={(e) => handleRepChange(exIdx, setIdx, e.target.value)}
                              className="w-20 sm:w-24 h-11 text-center font-extrabold text-base sm:text-lg rounded-xl bg-tracker-surface border-2 border-tracker-border focus:border-tracker-accent focus:bg-tracker-surfaceLight text-tracker-text font-mono-numbers transition-colors shadow-inner"
                            />
                            <span className="text-xs text-tracker-textDim font-medium">reps</span>
                          </div>

                          {/* Live Delta & Set Actions */}
                          <div className="col-span-1 sm:col-span-4 flex items-center justify-between">
                            <div className="hidden sm:block">
                              {setDelta !== null && hasCurrentInput ? (
                                setDelta > 0 ? (
                                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-700/40 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> +{setDelta}
                                  </span>
                                ) : setDelta === 0 ? (
                                  <span className="text-xs font-semibold text-tracker-textMuted bg-tracker-surfaceLight px-2 py-0.5 rounded-md">
                                    =
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold text-stone-400 bg-stone-900/60 border border-stone-700/40 px-2 py-0.5 rounded-md">
                                    {setDelta}
                                  </span>
                                )
                              ) : null}
                            </div>

                            <button
                              onClick={() => removeSet(exIdx, setIdx)}
                              disabled={ex.sets.length <= 1}
                              className="p-1 rounded text-tracker-textDim hover:text-red-300 disabled:opacity-0 transition-colors ml-auto"
                              title="Delete set"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progressive Overload Summary for this exercise */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-tracker-border/60 text-xs">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => addSet(exIdx)}
                      >
                        Add Set
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="font-mono-numbers">
                        <span className="text-tracker-textDim">Total Reps: </span>
                        <span className="font-bold text-tracker-text text-sm">{exStats.currentTotal}</span>
                        {exStats.prevTotal !== undefined && (
                          <span className="text-tracker-textMuted text-[11px] ml-1">
                            (Prev: {exStats.prevTotal})
                          </span>
                        )}
                      </div>

                      {/* Overload badge indicator */}
                      {exStats.hasInput && (
                        <div>
                          {exStats.isPR && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 mr-1.5 animate-pulse">
                              <Trophy className="w-3.5 h-3.5 text-amber-400" />
                              New PR!
                            </span>
                          )}

                          {exStats.state === 'improved' && exStats.delta !== null && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-600/50">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                              +{exStats.delta} reps (+{exStats.percent}%)
                            </span>
                          )}

                          {exStats.state === 'maintained' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-tracker-surfaceLight text-tracker-textMuted border border-tracker-border">
                              Maintained
                            </span>
                          )}

                          {exStats.state === 'decreased' && exStats.delta !== null && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-stone-900/60 text-stone-300 border border-stone-600/40">
                              {exStats.delta} reps
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Workout Notes */}
      <Card title="Workout Notes" subtitle="Optional reflections, energy levels, dumbbell feel">
        <textarea
          rows={3}
          value={workoutNotes}
          onChange={(e) => setWorkoutNotes(e.target.value)}
          placeholder="How did this workout feel? Form notes, fatigue, tempo..."
          className="w-full bg-tracker-bg border border-tracker-border rounded-xl p-3 text-xs text-tracker-text placeholder:text-tracker-textDim focus:outline-none focus:border-tracker-accent resize-none"
        />
      </Card>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          size="md"
          onClick={() => {
            if (completedSetsCount > 0) setShowExitConfirm(true);
            else onCancel();
          }}
        >
          Cancel Workout
        </Button>

        <Button
          variant="primary"
          size="lg"
          icon={<CheckCircle2 className="w-5 h-5" />}
          onClick={handleSaveWorkout}
          loading={saving}
          className="px-8 shadow-lg shadow-tracker-accent/30"
        >
          Finish & Save Workout
        </Button>
      </div>

      {/* Modal: Add Exercise during workout */}
      <Modal
        isOpen={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        title="Add Exercise to Workout"
        maxWidth="lg"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {availableExercises.map((ae) => {
            const alreadyAdded = exercises.some(e => e.exercise_id === ae.id && !e.skipped);

            return (
              <div
                key={ae.id}
                className="flex items-center justify-between p-3 rounded-xl bg-tracker-bg border border-tracker-border hover:border-tracker-accent/50 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-tracker-text">{ae.name}</h4>
                  <p className="text-xs text-tracker-textMuted">
                    {ae.muscle_group} • Default {ae.default_weight} kg • Target: {ae.target_min_reps}–{ae.target_max_reps} reps
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={alreadyAdded ? "secondary" : "primary"}
                  disabled={alreadyAdded}
                  onClick={() => addExerciseToSession(ae)}
                >
                  {alreadyAdded ? 'Added' : 'Add to Workout'}
                </Button>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Confirmation Modal for Exit */}
      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Discard Workout Session?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-tracker-textMuted">
            You have active sets logged. Exiting without finishing will discard this workout session.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowExitConfirm(false)}>
              Keep Working Out
            </Button>
            <Button variant="danger" size="sm" onClick={onCancel}>
              Discard Workout
            </Button>
          </div>
        </div>
      </Modal>

      {/* Workout Complete Congratulatory Modal */}
      {saveSuccessSummary && (
        <Modal
          isOpen={true}
          onClose={onFinishWorkout}
          title="Workout Completed!"
          maxWidth="md"
        >
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-tracker-accent/20 border border-tracker-accent/40 text-tracker-accent mx-auto flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <h3 className="text-xl font-extrabold text-tracker-text">
              Great Session, Athlete!
            </h3>

            <p className="text-xs text-tracker-textMuted max-w-sm mx-auto">
              Your repetition performance has been persistently saved. Progressive overload recorded!
            </p>

            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="p-3 rounded-xl bg-tracker-bg border border-tracker-border">
                <p className="text-[10px] text-tracker-textDim uppercase font-bold">Total Reps</p>
                <p className="text-lg font-extrabold text-tracker-text font-mono-numbers">
                  {saveSuccessSummary.totalReps}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-tracker-bg border border-tracker-border">
                <p className="text-[10px] text-tracker-textDim uppercase font-bold">Duration</p>
                <p className="text-lg font-extrabold text-tracker-text font-mono-numbers">
                  {saveSuccessSummary.duration} min
                </p>
              </div>

              <div className="p-3 rounded-xl bg-tracker-bg border border-tracker-border">
                <p className="text-[10px] text-tracker-textDim uppercase font-bold">New PRs</p>
                <p className="text-lg font-extrabold text-amber-400 font-mono-numbers">
                  {saveSuccessSummary.prs} 🏆
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="primary" size="lg" className="w-full" onClick={onFinishWorkout}>
                View Dashboard & Progress
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
