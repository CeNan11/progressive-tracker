import React from 'react';
import { 
  LayoutDashboard, 
  PlayCircle, 
  Dumbbell, 
  LineChart, 
  History, 
  CalendarDays,
  Settings 
} from 'lucide-react';
import { NavItemKey } from './Sidebar';

interface MobileNavProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isWorkoutInProgress?: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  isWorkoutInProgress,
}) => {
  const items = [
    { key: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { key: 'schedule', label: 'Routine', icon: CalendarDays },
    { key: 'workout-session', label: 'Workout', icon: PlayCircle, highlight: true },
    { key: 'exercises', label: 'Exercises', icon: Dumbbell },
    { key: 'progress', label: 'Progress', icon: LineChart },
    { key: 'history', label: 'History', icon: History },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-tracker-surface border-t border-tracker-border/80 px-2 py-2 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.key;
        const isWorkout = item.key === 'workout-session';

        return (
          <button
            key={item.key}
            onClick={() => onSelectTab(item.key as NavItemKey)}
            className={`
              flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all relative
              ${isActive ? 'text-tracker-accent font-bold' : 'text-tracker-textMuted hover:text-tracker-text'}
            `}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-tracker-accent/20' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            {isWorkout && isWorkoutInProgress && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
