import React, { useEffect, useState } from 'react';
import { 
  PlayCircle, 
  Trophy, 
  Flame, 
  RotateCcw, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Dumbbell, 
  ArrowRight,
  TrendingUp,
  Moon,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api } from '../services/api';
import { DashboardSummary, WorkoutSession } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';

interface DashboardPageProps {
  onStartWorkout: (templateId?: number, workoutType?: string) => void;
  onNavigateToProgress: (exerciseId?: number) => void;
  onNavigateToHistory: () => void;
  onNavigateToSchedule: () => void;
  onViewSessionDetail: (session: WorkoutSession) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onStartWorkout,
  onNavigateToProgress,
  onNavigateToHistory,
  onNavigateToSchedule,
  onViewSessionDetail,
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await api.getDashboard();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin w-8 h-8 border-3 border-tracker-accent border-t-transparent rounded-full" />
        <p className="text-sm text-tracker-textMuted">Loading progressive dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <Card className="border-red-900/50 bg-red-950/20">
          <p className="text-red-300 font-semibold mb-3">{error || 'Something went wrong'}</p>
          <Button onClick={fetchDashboard} variant="secondary" size="sm">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const { today_schedule, schedule_cycle, stats, recent_sessions, weekly_consistency, recent_rep_trends } = data;

  const getWorkoutTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'arms': return 'text-amber-300 bg-amber-950/40 border-amber-800/40';
      case 'back': return 'text-sky-300 bg-sky-950/40 border-sky-800/40';
      case 'legs': return 'text-emerald-300 bg-emerald-950/40 border-emerald-800/40';
      case 'rest': return 'text-purple-300 bg-purple-950/40 border-purple-800/40';
      default: return 'text-tracker-textMuted bg-tracker-surfaceLight border-tracker-border';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* A. Welcome Banner Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-tracker-surface to-[#2e3922] border border-tracker-border p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-tracker-accent">
                {formattedDate}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-tracker-accent/60" />
              <span className="text-xs text-tracker-textMuted">Cycle Day {today_schedule.cycle_order}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-tracker-text tracking-tight">
              {getGreeting()}, <span className="text-tracker-accent">{data.user.username}</span>
            </h1>

            <div className="flex items-center gap-2 pt-1 text-sm text-tracker-textMuted">
              <span>Scheduled Today:</span>
              <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs border ${getWorkoutTypeColor(today_schedule.workout_type)}`}>
                {today_schedule.workout_type}
                {today_schedule.is_rest ? ' (Rest & Recover)' : ' Routine'}
              </span>
              {today_schedule.is_completed_today && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold ml-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done today
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {today_schedule.is_rest ? (
              <Button
                variant="secondary"
                size="lg"
                icon={<Moon className="w-5 h-5 text-purple-300" />}
                onClick={() => onStartWorkout(undefined, 'Rest')}
                className="w-full sm:w-auto"
              >
                Log Rest Day
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                icon={<PlayCircle className="w-5 h-5" />}
                onClick={() => onStartWorkout(today_schedule.template_id || undefined, today_schedule.workout_type)}
                className="w-full sm:w-auto"
              >
                {today_schedule.is_completed_today ? 'Start Another Workout' : `Start ${today_schedule.workout_type} Workout`}
              </Button>
            )}
            
            <Button
              variant="outline"
              size="lg"
              onClick={onNavigateToSchedule}
              className="w-full sm:w-auto text-xs"
            >
              View Schedule
            </Button>
          </div>
        </div>

        {/* Ambient subtle background decorative glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-tracker-accent/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* B. Workout Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          label="Total Workouts"
          value={stats.total_workouts}
          subtext="All-time sessions"
          icon={<Dumbbell className="w-5 h-5" />}
        />
        <StatCard
          label="This Month"
          value={stats.workouts_this_month}
          subtext="Sessions logged"
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          label="Current Streak"
          value={`${stats.current_streak} ${stats.current_streak === 1 ? 'day' : 'days'}`}
          subtext={stats.current_streak > 0 ? "Consistency on fire!" : "Start today"}
          icon={<Flame className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          label="Total Repetitions"
          value={stats.total_repetitions.toLocaleString()}
          subtext="Volume performed"
          icon={<RotateCcw className="w-5 h-5" />}
        />
        <StatCard
          label="Personal Records"
          value={stats.total_personal_records}
          subtext="Rep PRs unlocked"
          icon={<Trophy className="w-5 h-5 text-amber-400" />}
        />
      </div>

      {/* C. Workout Routine Schedule (6-Day Cycle Overview) */}
      <Card
        title="Workout Split Cycle (6-Day Routine)"
        subtitle="Consistent muscle-group repetition progression with fixed-weight dumbbells"
        action={
          <button 
            onClick={onNavigateToSchedule}
            className="text-xs font-semibold text-tracker-accent hover:underline flex items-center gap-1"
          >
            Edit Schedule <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {schedule_cycle.map((item) => {
            const isToday = item.is_current_day;
            const isRest = item.workout_type.toLowerCase() === 'rest';

            return (
              <div
                key={item.cycle_order}
                className={`
                  relative rounded-xl p-3.5 border transition-all text-center
                  ${isToday 
                    ? 'bg-tracker-accent/15 border-tracker-accent shadow-sm ring-1 ring-tracker-accent/30' 
                    : 'bg-tracker-bg/60 border-tracker-border/70 hover:border-tracker-border'
                  }
                `}
              >
                {isToday && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-tracker-accent text-tracker-bg text-[10px] font-extrabold uppercase tracking-wider">
                    Today
                  </span>
                )}

                <p className="text-[11px] font-semibold text-tracker-textDim uppercase tracking-wider mb-1">
                  Day {item.cycle_order}
                </p>

                <div className="flex items-center justify-center gap-1.5 my-1">
                  {isRest ? (
                    <Moon className="w-4 h-4 text-purple-300" />
                  ) : (
                    <Dumbbell className="w-4 h-4 text-tracker-accent" />
                  )}
                  <span className="text-sm font-bold text-tracker-text">
                    {item.workout_type}
                  </span>
                </div>

                <p className="text-[11px] text-tracker-textMuted mt-1">
                  {isRest ? 'Active Recovery' : 'Standard Routine'}
                </p>

                {isToday && !item.is_completed_today && (
                  <button
                    onClick={() => onStartWorkout(item.template_id || undefined, item.workout_type)}
                    className="mt-2 text-[11px] font-bold text-tracker-accent hover:underline block w-full"
                  >
                    Start Session →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Progress Charts & Weekly Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repetitions Over Time Chart */}
        <div className="lg:col-span-2">
          <Card
            title="Total Repetitions Over Time"
            subtitle="Tracking volume progression across recent workouts"
            action={
              <button
                onClick={() => onNavigateToProgress()}
                className="text-xs text-tracker-accent font-semibold hover:underline flex items-center gap-1"
              >
                Detailed Progress <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            {recent_rep_trends.length > 0 ? (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recent_rep_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="repGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9A7E3B" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#9A7E3B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#7E7C58" 
                      tick={{ fill: '#AAA87D', fontSize: 11 }}
                      tickFormatter={(d) => d.slice(5)} // MM-DD
                    />
                    <YAxis 
                      stroke="#7E7C58" 
                      tick={{ fill: '#AAA87D', fontSize: 11 }} 
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#323D25',
                        borderColor: '#485736',
                        borderRadius: '12px',
                        color: '#D2CF9A',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      }}
                      labelStyle={{ color: '#D2CF9A', fontWeight: 'bold' }}
                      formatter={(value: any, _name: any, item: any) => [
                        `${value} total reps (${item.payload.workout_type})`,
                        'Workout Volume',
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total_reps" 
                      stroke="#9A7E3B" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#repGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-tracker-textMuted">
                <TrendingUp className="w-8 h-8 text-tracker-accent/40 mb-2" />
                <p className="text-sm">No workout sessions logged yet.</p>
                <p className="text-xs text-tracker-textDim">Complete your first workout to see your rep trend line!</p>
              </div>
            )}
          </Card>
        </div>

        {/* Weekly Consistency (Past 7 Days) */}
        <div>
          <Card
            title="Weekly Consistency"
            subtitle="Activity over the past 7 days"
          >
            <div className="space-y-2.5 mt-2">
              {weekly_consistency.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-tracker-bg/70 border border-tracker-border/50 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-tracker-text w-8">{day.day}</span>
                    <span className="text-tracker-textDim">{day.date.slice(5)}</span>
                  </div>

                  {day.has_workout ? (
                    <div className="flex items-center gap-1.5 font-semibold text-tracker-accent">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{day.workout_type}</span>
                    </div>
                  ) : (
                    <span className="text-tracker-textDim italic">No session</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* D. Recent Activity Section */}
      <Card
        title="Recent Activity"
        subtitle="Latest completed workout sessions"
        action={
          <button
            onClick={onNavigateToHistory}
            className="text-xs font-semibold text-tracker-accent hover:underline flex items-center gap-1"
          >
            All Workouts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        {recent_sessions.length > 0 ? (
          <div className="divide-y divide-tracker-border/60">
            {recent_sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onViewSessionDetail(session)}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-tracker-surfaceLight/40 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-tracker-surfaceLight border border-tracker-border text-tracker-accent shrink-0">
                    {session.workout_type.toLowerCase() === 'rest' ? (
                      <Moon className="w-4 h-4 text-purple-300" />
                    ) : (
                      <Dumbbell className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-tracker-text">
                        {session.workout_type} Workout
                      </h4>
                      <Badge variant={session.status === 'completed' ? 'gold' : 'default'} size="sm">
                        {session.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-tracker-textMuted">
                      <span>{session.workout_date}</span>
                      {session.duration_minutes ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-tracker-textDim" />
                          {session.duration_minutes} min
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                  {session.workout_type.toLowerCase() !== 'rest' ? (
                    <div>
                      <p className="text-sm font-extrabold text-tracker-text font-mono-numbers">
                        {session.total_reps || 0} reps
                      </p>
                      <p className="text-[11px] text-tracker-textMuted">
                        {session.total_exercises || 0} exercises • {session.total_sets || 0} sets
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-tracker-textMuted italic">Rest logged</span>
                  )}
                  <ChevronRightIcon className="w-4 h-4 text-tracker-textMuted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-tracker-textMuted">
            <p className="text-sm font-medium">No recent workouts recorded yet.</p>
            <p className="text-xs text-tracker-textDim mt-1">
              Click "Start Workout" above to begin your progressive overload journey.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
