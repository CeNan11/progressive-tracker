import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  trend?: {
    positive?: boolean;
    text: string;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
}) => {
  return (
    <div className="bg-tracker-surface border border-tracker-border rounded-2xl p-4 sm:p-5 flex items-start justify-between shadow-sm hover:border-tracker-accent/40 transition-colors">
      <div>
        <p className="text-xs font-medium text-tracker-textMuted uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-tracker-text font-mono-numbers">
          {value}
        </p>
        {(subtext || trend) && (
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            {trend && (
              <span className={trend.positive ? 'text-emerald-400 font-semibold' : 'text-tracker-textMuted'}>
                {trend.text}
              </span>
            )}
            {subtext && <span className="text-tracker-textDim">{subtext}</span>}
          </div>
        )}
      </div>
      <div className="p-2.5 rounded-xl bg-tracker-surfaceLight border border-tracker-border/80 text-tracker-accent shrink-0">
        {icon}
      </div>
    </div>
  );
};
