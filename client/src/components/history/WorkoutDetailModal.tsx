import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Dumbbell, 
  Trophy, 
  TrendingUp, 
  Minus, 
  TrendingDown, 
  Check, 
  Flame, 
  Moon,
  Trash2
} from 'lucide-react';
import { api } from '../../services/api';
import { WorkoutSession } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface WorkoutDetailModalProps {
  sessionId: number | null;
  onClose: () => void;
  onSessionDeleted?: () => void;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  sessionId,
  onClose,
  onSessionDeleted,
}) => {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      try {
        setLoading(true);
        const data = await api.getWorkout(sessionId);
        setSession(data);
      } catch (err) {
        console.error('Failed to load session details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  const handleDelete = async () => {
    if (!sessionId) return;
    try {
      setDeleting(true);
      await api.deleteWorkout(sessionId);
      if (onSessionDeleted) onSessionDeleted();
      onClose();
    } catch (err: any) {
      alert(`Error deleting workout: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (!sessionId) return null;

  return (
    <Modal
      isOpen={!!sessionId}
      onClose={onClose}
      title={session ? `${session.workout_type} Workout Details` : 'Workout Details'}
      maxWidth="lg"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="animate-spin w-6 h-6 border-2 border-tracker-accent border-t-transparent rounded-full" />
          <p className="text-xs text-tracker-textMuted">Loading performance records...</p>
        </div>
      ) : session ? (
        <div className="space-y-5">
          {/* Top Session Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-3 rounded-xl bg-tracker-bg border border-tracker-border">
              <span className="text-[10px] text-tracker-textDim uppercase font-bold block mb-1">Date</span>
              <span className="text-xs font-semibold text-tracker-text">{session.workout_date}</span>
            </div>

            <div className="p-3 rounded-xl bg-tracker-bg border border-tracker-border">
              <span className="text-[10px] text-tracker-textDim uppercase font-bold block mb-1">Duration</span>
              <span className="text-xs font-semibold text-tracker-text">
                {session.duration_minutes ? `${session.duration_minutes} min` : 'Untimed'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-tracker-bg border border-tracker-border">
              <span className="text-[10px] text-tracker-textDim uppercase font-bold block mb-1">Total Reps</span>
              <span className="text-sm font-extrabold text-tracker-text font-mono-numbers">
                {session.total_reps || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-tracker-bg border border-tracker-border">
              <span className="text-[10px] text-tracker-textDim uppercase font-bold block mb-1">PRs Achieved</span>
              <span className="text-sm font-extrabold text-amber-300 font-mono-numbers">
                {session.improvements?.pr_count || 0} 🏆
              </span>
            </div>
          </div>

          {/* Exercise Logs Breakdown */}
          {session.exercise_logs && session.exercise_logs.length > 0 ? (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {session.exercise_logs.map((elog, idx) => {
                const comparison = elog.comparison;
                const totalReps = elog.sets?.reduce((sum, s) => sum + s.repetitions, 0) || 0;

                return (
                  <div
                    key={elog.id || idx}
                    className="p-4 rounded-xl bg-tracker-bg/80 border border-tracker-border space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-tracker-surface text-[11px] font-bold text-tracker-accent flex items-center justify-center border border-tracker-border">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-tracker-text">
                          {elog.exercise_name}
                        </h4>
                        <Badge variant="default" size="sm">
                          {elog.muscle_group}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-tracker-textDim">Weight:</span>
                        <span className="font-bold text-tracker-accent font-mono-numbers">{elog.weight_used} kg</span>
                        <span className="text-tracker-textDim">•</span>
                        <span className="text-tracker-textDim">Total:</span>
                        <span className="font-extrabold text-tracker-text font-mono-numbers">{totalReps} reps</span>
                      </div>
                    </div>

                    {/* Sets representation */}
                    <div className="flex flex-wrap items-center gap-2">
                      {elog.sets?.map((s) => (
                        <div
                          key={s.set_number}
                          className="px-3 py-1 rounded-lg bg-tracker-surface border border-tracker-border/70 text-xs"
                        >
                          <span className="text-tracker-textDim text-[10px] mr-1">#{s.set_number}</span>
                          <span className="font-extrabold text-tracker-text font-mono-numbers">{s.repetitions}</span>
                          <span className="text-tracker-textDim text-[10px] ml-0.5">r</span>
                        </div>
                      ))}
                    </div>

                    {/* Progressive Overload Comparison Tag */}
                    {comparison && (
                      <div className="pt-2 border-t border-tracker-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          {comparison.is_personal_record && (
                            <span className="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md text-[11px]">
                              <Trophy className="w-3 h-3 text-amber-400" /> New Rep Record!
                            </span>
                          )}

                          {comparison.performance_state === 'improved' && comparison.rep_difference !== undefined && (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-700/40 px-2 py-0.5 rounded-md text-[11px]">
                              <TrendingUp className="w-3 h-3" /> +{comparison.rep_difference} reps vs prior session
                            </span>
                          )}

                          {comparison.performance_state === 'maintained' && (
                            <span className="inline-flex items-center gap-1 text-tracker-textMuted bg-tracker-surfaceLight border border-tracker-border px-2 py-0.5 rounded-md text-[11px]">
                              <Minus className="w-3 h-3 text-tracker-accent" /> Rep volume maintained
                            </span>
                          )}

                          {comparison.performance_state === 'decreased' && comparison.rep_difference !== undefined && (
                            <span className="inline-flex items-center gap-1 text-stone-300 bg-stone-900/60 border border-stone-700/40 px-2 py-0.5 rounded-md text-[11px]">
                              <TrendingDown className="w-3 h-3 text-stone-400" /> {comparison.rep_difference} reps vs prior session
                            </span>
                          )}
                        </div>

                        {comparison.previous_total_reps !== undefined && (
                          <span className="text-[11px] text-tracker-textDim">
                            Prior: {comparison.previous_total_reps} reps ({comparison.previous_date})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : session.workout_type.toLowerCase() === 'rest' ? (
            <div className="text-center py-8 text-tracker-textMuted">
              <Moon className="w-8 h-8 text-purple-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-tracker-text">Rest & Recovery Logged</p>
              <p className="text-xs text-tracker-textDim">Scheduled rest day taken.</p>
            </div>
          ) : (
            <p className="text-xs text-tracker-textMuted text-center py-6">No exercises recorded in this session.</p>
          )}

          {session.notes && (
            <div className="p-3 rounded-xl bg-tracker-bg border border-tracker-border text-xs">
              <span className="text-tracker-textDim font-bold block mb-1">Notes:</span>
              <p className="text-tracker-text">{session.notes}</p>
            </div>
          )}

          {/* Delete action */}
          <div className="flex items-center justify-between pt-3 border-t border-tracker-border/70">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-300">Delete this record?</span>
                <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
                  Yes, Delete
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-tracker-textDim hover:text-red-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete session
              </button>
            )}

            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
