import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Trophy, 
  Calendar, 
  Dumbbell, 
  RotateCcw, 
  ChevronRight, 
  Sparkles,
  Minus,
  TrendingDown,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { Exercise, ExerciseStats } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

interface ProgressPageProps {
  initialExerciseId?: number;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ initialExerciseId }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(initialExerciseId || null);
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<number | null>(null); // null = all time, 7, 30, 90

  // Load all exercises list
  useEffect(() => {
    const fetchList = async () => {
      try {
        const list = await api.getExercises();
        setExercises(list);
        if (!selectedExerciseId && list.length > 0) {
          setSelectedExerciseId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load exercises:', err);
      }
    };
    fetchList();
  }, []);

  // Update selected if initialExerciseId prop changes
  useEffect(() => {
    if (initialExerciseId) {
      setSelectedExerciseId(initialExerciseId);
    }
  }, [initialExerciseId]);

  // Load exercise progress stats whenever selectedExerciseId or timeRange changes
  useEffect(() => {
    if (!selectedExerciseId) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.getExercise(selectedExerciseId, timeRange || undefined);
        setStats(data);
      } catch (err) {
        console.error('Failed to load exercise stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedExerciseId, timeRange]);

  const ranges = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '3 Months', value: 90 },
    { label: 'All Time', value: null },
  ];

  const latest = stats?.latest_performance;
  const previous = stats?.previous_performance;
  const repDelta = latest && previous ? latest.total_reps - previous.total_reps : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header & Exercise Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-tracker-text flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-tracker-accent" />
            Exercise Progress History
          </h2>
          <p className="text-xs text-tracker-textMuted mt-1">
            Analyze historical repetition overload and unlock personal bests with fixed dumbbells.
          </p>
        </div>

        {/* Exercise Picker Dropdown */}
        <div className="w-full sm:w-72">
          <label className="text-[10px] text-tracker-textDim uppercase font-bold block mb-1">
            Select Exercise
          </label>
          <select
            value={selectedExerciseId || ''}
            onChange={(e) => setSelectedExerciseId(parseInt(e.target.value, 10))}
            className="w-full bg-tracker-surface border border-tracker-border rounded-xl px-3 py-2 text-xs font-semibold text-tracker-text focus:outline-none focus:border-tracker-accent"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.muscle_group})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="animate-spin w-8 h-8 border-3 border-tracker-accent border-t-transparent rounded-full" />
          <p className="text-sm text-tracker-textMuted">Loading progressive history chart...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Key Metrics Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* PR Card */}
            <div className="bg-tracker-surface border border-tracker-border rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-tracker-textDim block mb-1">
                All-Time PR
              </span>
              <p className="text-2xl font-extrabold text-amber-300 font-mono-numbers flex items-center gap-1.5">
                <Trophy className="w-5 h-5 text-amber-400" />
                {stats.personal_record_total_reps} reps
              </p>
              <span className="text-[11px] text-tracker-textMuted mt-1 block">
                Highest session volume
              </span>
            </div>

            {/* Current Weight Card */}
            <div className="bg-tracker-surface border border-tracker-border rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-tracker-textDim block mb-1">
                Fixed Dumbbell Weight
              </span>
              <p className="text-2xl font-extrabold text-tracker-accent font-mono-numbers">
                {stats.exercise.default_weight} kg
              </p>
              <span className="text-[11px] text-tracker-textMuted mt-1 block">
                Target: {stats.exercise.target_min_reps}–{stats.exercise.target_max_reps} reps/set
              </span>
            </div>

            {/* Total Times Performed */}
            <div className="bg-tracker-surface border border-tracker-border rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-tracker-textDim block mb-1">
                Times Logged
              </span>
              <p className="text-2xl font-extrabold text-tracker-text font-mono-numbers">
                {stats.total_sessions_performed}
              </p>
              <span className="text-[11px] text-tracker-textMuted mt-1 block">
                Completed workout logs
              </span>
            </div>

            {/* Latest Overload Delta */}
            <div className="bg-tracker-surface border border-tracker-border rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-tracker-textDim block mb-1">
                Latest vs Previous
              </span>
              {repDelta !== null ? (
                <div>
                  <p className={`text-2xl font-extrabold font-mono-numbers flex items-center gap-1 ${
                    repDelta > 0 ? 'text-emerald-400' : repDelta === 0 ? 'text-tracker-textMuted' : 'text-stone-300'
                  }`}>
                    {repDelta > 0 ? `+${repDelta}` : repDelta} reps
                  </p>
                  <span className="text-[11px] text-tracker-textMuted mt-1 block">
                    {latest?.total_reps} vs {previous?.total_reps} reps
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-tracker-textDim mt-1">Baseline session</p>
                  <span className="text-[11px] text-tracker-textMuted block">Need 2+ sessions for delta</span>
                </div>
              )}
            </div>
          </div>

          {/* Range Selector & Historical Chart */}
          <Card
            title={`${stats.exercise.name} Repetition Progression`}
            subtitle="Historical total reps achieved over time with fixed weight dumbbells"
            action={
              <div className="flex items-center gap-1 bg-tracker-bg p-1 rounded-xl border border-tracker-border/60">
                {ranges.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setTimeRange(r.value)}
                    className={`
                      px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                      ${timeRange === r.value 
                        ? 'bg-tracker-accent text-tracker-bg font-bold shadow-sm' 
                        : 'text-tracker-textMuted hover:text-tracker-text'
                      }
                    `}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            }
          >
            {stats.history && stats.history.length > 0 ? (
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9A7E3B" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#9A7E3B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3D4A2E" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#7E7C58" 
                      tick={{ fill: '#AAA87D', fontSize: 11 }}
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
                      formatter={(val: any, _name: any, item: any) => [
                        `${val} total reps (${item.payload.weight_used} kg)`,
                        'Rep Volume'
                      ]}
                      labelFormatter={(lbl) => `Session Date: ${lbl}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total_reps" 
                      stroke="#9A7E3B" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#progressGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-tracker-textMuted">
                <Dumbbell className="w-8 h-8 text-tracker-accent/40 mb-2" />
                <p className="text-sm">No workout records found for this exercise in this timeframe.</p>
              </div>
            )}
          </Card>

          {/* Historical Workout Table */}
          <Card
            title="Workout Log History"
            subtitle="Complete breakdown of every date, weight used, and individual set repetitions"
          >
            {stats.history && stats.history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-tracker-border/70 text-tracker-textDim uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Weight</th>
                      <th className="py-2.5 px-3">Sets & Repetitions</th>
                      <th className="py-2.5 px-3 text-right">Total Reps</th>
                      <th className="py-2.5 px-3 text-right">PR Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tracker-border/40">
                    {[...stats.history].reverse().map((entry) => {
                      const isPr = entry.total_reps === stats.personal_record_total_reps && entry.total_reps > 0;

                      return (
                        <tr key={entry.session_id} className="hover:bg-tracker-surfaceLight/30 transition-colors">
                          <td className="py-3 px-3 font-semibold text-tracker-text">
                            {entry.date}
                          </td>
                          <td className="py-3 px-3 text-tracker-accent font-mono-numbers font-bold">
                            {entry.weight_used} kg
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {entry.sets.map((s) => (
                                <span
                                  key={s.set_number}
                                  className="px-2 py-0.5 rounded-md bg-tracker-bg border border-tracker-border/60 text-[11px] font-mono-numbers"
                                >
                                  {s.repetitions}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-tracker-text font-mono-numbers text-sm">
                            {entry.total_reps}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isPr ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                <Trophy className="w-3 h-3 text-amber-400" /> PR
                              </span>
                            ) : (
                              <span className="text-tracker-textDim">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-tracker-textMuted py-4 text-center">
                No logs recorded for this exercise yet.
              </p>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
};
