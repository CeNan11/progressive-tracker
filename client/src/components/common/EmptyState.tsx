import React from 'react';
import { Dumbbell } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-tracker-border/70 rounded-2xl bg-tracker-surface/40">
      <div className="p-4 rounded-2xl bg-tracker-surfaceLight/80 text-tracker-accent mb-4 border border-tracker-border/50">
        {icon || <Dumbbell className="w-8 h-8 opacity-80" />}
      </div>
      <h3 className="text-lg font-bold text-tracker-text mb-1">{title}</h3>
      <p className="text-sm text-tracker-textMuted max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} size="md">
          {actionText}
        </Button>
      )}
    </div>
  );
};
