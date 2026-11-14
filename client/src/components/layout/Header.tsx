import React from 'react';
import { Dumbbell, PlayCircle, Palette } from 'lucide-react';
import { NavItemKey } from './Sidebar';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme, setTheme } = useTheme();

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

  const toggleTheme = () => {
    setTheme(theme === 'olive' ? 'red-black' : 'olive');
  };

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
        {/* Quick Theme Switcher */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'olive' ? 'Red & Black' : 'Dark Olive-Green'}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tracker-surface border border-tracker-border text-xs font-semibold text-tracker-text hover:bg-tracker-surfaceLight transition-colors"
        >
          <span 
            className="w-3 h-3 rounded-full border border-white/20 inline-block shrink-0 shadow-inner"
            style={{ backgroundColor: theme === 'olive' ? '#9A7E3B' : '#E11D48' }}
          />
          <span className="hidden sm:inline">
            {theme === 'olive' ? 'Dark Olive' : 'Red & Black'}
          </span>
        </button>

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
