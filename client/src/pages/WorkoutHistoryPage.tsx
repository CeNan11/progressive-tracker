import React, { useEffect, useState } from 'react';
import { 
  History, 
  Search, 
  Calendar, 
  Clock, 
  Dumbbell, 
  Moon, 
  ChevronRight, 
  Filter,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { api } from '../services/api';
import { WorkoutSession } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { WorkoutDetailModal } from '../components/history/WorkoutDetailModal';

interface WorkoutHistoryPageProps {
  onStartWorkout: () => void;
}

export const WorkoutHistoryPage: React.FC<WorkoutHistoryPageProps> = ({ onStartWorkout }) => {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const workoutTypes = ['All', 'Arms', 'Back', 'Legs', 'Rest'];

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getWorkouts({
        type: selectedType !== 'All' ? selectedType : undefined,
      });
      setSessions(data);
    } catch (err) {
      console.error('Failed to load workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedType]);

  const totalRepsVolume = sessions.reduce((sum, s) => sum + (s.total_reps || 0), 0);
  const totalWorkoutsCount = sessions.filter(s => s.workout_type.toLowerCase() !== 'rest').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-tracker-text flex items-center gap-2">
            <History className="w-5 h-5 text-tracker-accent" />
            Workout History
          </h2>
          <p className="text-xs text-tracker-textMuted mt-1">
            Complete persistent log of all completed training sessions and progressive overload deltas.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Dumbbell className="w-4 h-4" />}
          onClick={onStartWorkout}
        >
          Log New Workout
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-tracker-textDim mr-1" />
            <span className="text-xs text-tracker-textDim font-bold uppercase mr-1">Filter Type:</span>
            {workoutTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                  ${selectedType === type
                    ? 'bg-tracker-accent text-white font-bold shadow-sm'
                    : 'bg-tracker-bg text-tracker-textMuted hover:text-tracker-text border border-tracker-border/60'
                  }
                `}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="text-xs text-tracker-textMuted">
            Showing <strong className="text-tracker-text">{sessions.length}</strong> sessions
          </div>
        </div>
      </Card>

      {/* Sessions List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
          <div className="animate-spin w-8 h-8 border-3 border-tracker-accent border-t-transparent rounded-full" />
          <p className="text-sm text-tracker-textMuted">Loading workout history...</p>
        </div>
      ) : sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isRest = session.workout_type.toLowerCase() === 'rest';

            return (
              <Card
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                hoverable
                className="transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-tracker-bg border border-tracker-border flex items-center justify-center shrink-0">
                      {isRest ? (
                        <Moon className="w-5 h-5 text-purple-300" />
                      ) : (
                        <Dumbbell className="w-5 h-5 text-tracker-accent" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-tracker-text">
                          {session.workout_type} Session
                        </h3>
                        <Badge variant={isRest ? 'default' : 'gold'} size="sm">
                          {session.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-tracker-textMuted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-tracker-textDim" />
                          {session.workout_date}
                        </span>
                        {session.duration_minutes ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-tracker-textDim" />
                            {session.duration_minutes} min
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-tracker-border/50">
                    {!isRest ? (
                      <div className="text-left sm:text-right">
                        <p className="text-base font-extrabold text-tracker-text font-mono-numbers">
                          {session.total_reps || 0} reps
                        </p>
                        <p className="text-xs text-tracker-textMuted">
                          {session.total_exercises || 0} exercises • {session.total_sets || 0} sets
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-tracker-textMuted italic">Rest logged</span>
                    )}

                    <div className="p-1 rounded-lg bg-tracker-surfaceLight border border-tracker-border/70 text-tracker-textMuted">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-16">
          <History className="w-10 h-10 text-tracker-textDim mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-tracker-text mb-1">No workout sessions recorded yet</h3>
          <p className="text-xs text-tracker-textMuted max-w-sm mx-auto mb-5">
            Log your first workout to start tracking progressive overload with fixed dumbbells.
          </p>
          <Button variant="primary" size="md" onClick={onStartWorkout}>
            Start First Workout
          </Button>
        </Card>
      )}

      {/* Detail Modal */}
      {selectedSessionId && (
        <WorkoutDetailModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
          onSessionDeleted={() => {
            setSelectedSessionId(null);
            loadHistory();
          }}
        />
      )}
    </div>
  );
};
