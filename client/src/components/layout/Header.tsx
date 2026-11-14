import React from 'react';
import { Dumbbell, PlayCircle } from 'lucide-react';
import { NavItemKey } from './Sidebar';
import { Button } from '../common/Button';

interface HeaderProps {
  currentTab: NavItemKey;
  onStartWorkout: () => void;
  isWorkoutInProgress?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onStartWorkout,
  isWorkoutInProgress,
}) => {
  const getTabTitle = (tab: NavItemKey) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'workout-session': return 'Active Workout Session';
      case 'schedule': return 'Workout Routine Schedule';
      case 'exercises': return 'Exercise Management';
      case 'progress': return 'Progress & Overload History';
      case 'history': return 'Workout Log History';
      case 'settings': return 'Preferences & Settings';
      default: return 'Progressive Tracker';
    }
  };

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-tracker-bg/90 backdrop-blur-md border-b border-tracker-border/70 px-4 sm:px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="md:hidden w-8 h-8 rounded-lg bg-tracker-surface border border-tracker-accent/40 flex items-center justify-center text-tracker-accent">
          <Dumbbell className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-tracker-text">
            {getTabTitle(currentTab)}
          </h2>
          <p className="text-xs text-tracker-textMuted hidden sm:block">
            {todayStr} • Fixed-Weight Dumbbells Progressive Overload
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {currentTab !== 'workout-session' && (
          <Button 
            onClick={onStartWorkout} 
            size="sm"
            icon={<PlayCircle className="w-4 h-4" />}
            className="shadow-sm"
          >
            {isWorkoutInProgress ? 'Resume Workout' : 'Start Workout'}
          </Button>
        )}
      </div>
    </header>
  );
};
