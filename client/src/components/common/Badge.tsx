import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'default' | 'success' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
}) => {
  const variants = {
    gold: 'bg-tracker-accent/20 text-tracker-accentLight border-tracker-accent/40',
    default: 'bg-tracker-surfaceLight text-tracker-textMuted border-tracker-border',
    success: 'bg-tracker-success/20 text-emerald-300 border-tracker-success/40',
    danger: 'bg-tracker-danger/20 text-red-300 border-tracker-danger/40',
    info: 'bg-sky-950/40 text-sky-300 border-sky-800/40',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-lg font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
