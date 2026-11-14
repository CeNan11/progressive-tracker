import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-tracker-surface border border-tracker-border rounded-2xl p-5 shadow-sm
        ${hoverable ? 'hover:border-tracker-accent/50 hover:bg-tracker-surfaceLight/50 transition-all cursor-pointer' : ''}
        ${className}
      `}
    >
      {(title || action || subtitle) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-tracker-border/60">
          <div>
            {title && (
              <h3 className="text-base font-bold text-tracker-text flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-tracker-textMuted mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
