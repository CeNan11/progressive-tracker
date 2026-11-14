import React from 'react';
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Sparkles } from 'lucide-react';
import { OverloadComparison } from '../../types';

interface OverloadBadgeProps {
  comparison?: OverloadComparison | null;
  compact?: boolean;
}

export const OverloadBadge: React.FC<OverloadBadgeProps> = ({ comparison, compact = false }) => {
  if (!comparison) return null;

  const { performance_state, rep_difference, rep_percentage_change, is_personal_record, target_state } = comparison;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Personal Record Badge */}
      {is_personal_record && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>New PR!</span>
        </span>
      )}

      {/* Rep Progression State */}
      {performance_state === 'improved' && rep_difference !== undefined && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-600/50">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>+{rep_difference} reps</span>
          {!compact && rep_percentage_change !== undefined && (
            <span className="text-[10px] text-emerald-400/80 font-normal">
              (+{rep_percentage_change}%)
            </span>
          )}
        </span>
      )}

      {performance_state === 'maintained' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-tracker-surfaceLight text-tracker-textMuted border border-tracker-border">
          <Minus className="w-3.5 h-3.5 text-tracker-accent" />
          <span>Maintained</span>
        </span>
      )}

      {performance_state === 'decreased' && rep_difference !== undefined && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-stone-900/60 text-stone-300 border border-stone-600/40">
          <TrendingDown className="w-3.5 h-3.5 text-stone-400" />
          <span>{rep_difference} reps</span>
        </span>
      )}

      {performance_state === 'first_time' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-tracker-surfaceLight/80 text-tracker-textMuted border border-tracker-border">
          <Sparkles className="w-3 h-3 text-tracker-accent" />
          <span>Baseline set</span>
        </span>
      )}

      {/* Target Status indicator */}
      {!compact && target_state === 'target_achieved' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-tracker-accent/20 text-tracker-accentLight border border-tracker-accent/40">
          <Target className="w-3 h-3 text-tracker-accent" />
          <span>Target Achieved</span>
        </span>
      )}

      {!compact && target_state === 'approaching' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-950/40 text-amber-200 border border-amber-700/30">
          <Target className="w-3 h-3 text-amber-400" />
          <span>Approaching Target</span>
        </span>
      )}
    </div>
  );
};
