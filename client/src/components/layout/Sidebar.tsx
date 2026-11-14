import React from 'react';
import { 
  LayoutDashboard, 
  PlayCircle, 
  CalendarDays, 
  Dumbbell, 
  LineChart, 
  History, 
  Settings,
  ChevronRight
} from 'lucide-react';

export type NavItemKey = 
  | 'dashboard' 
  | 'workout-session' 
  | 'schedule' 
  | 'exercises' 
  | 'progress' 
  | 'history' 
  | 'settings';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isWorkoutInProgress?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isWorkoutInProgress,
}) => {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'workout-session', label: 'Start Workout', icon: PlayCircle, highlight: true },
    { key: 'schedule', label: 'Workout Schedule', icon: CalendarDays },
    { key: 'exercises', label: 'Exercises', icon: Dumbbell },
    { key: 'progress', label: 'Progress History', icon: LineChart },
    { key: 'history', label: 'Workout History', icon: History },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-tracker-surface border-r border-tracker-border h-screen sticky top-0">
      {/* Brand Logo & Name */}
      <div className="p-6 border-b border-tracker-border/70 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-tracker-bg border border-tracker-accent/40 flex items-center justify-center text-tracker-accent shadow-inner">
          <Dumbbell className="w-5 h-5 text-tracker-accent" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-tracker-text leading-tight tracking-tight">
            OVERLOAD
          </h1>
          <p className="text-[11px] font-medium text-tracker-textMuted tracking-wider uppercase">
            Progressive Tracker
          </p>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.key;
          const isStartWorkout = item.key === 'workout-session';

          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key as NavItemKey)}
              className={`
                w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all
                ${isActive 
                  ? 'bg-tracker-accent text-tracker-bg font-bold shadow-md shadow-tracker-accent/20' 
                  : isStartWorkout && isWorkoutInProgress
                    ? 'bg-amber-950/40 text-amber-300 border border-amber-600/40 hover:bg-amber-950/60'
                    : 'text-tracker-textMuted hover:text-tracker-text hover:bg-tracker-surfaceLight'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-tracker-bg' : 'text-tracker-accent'}`} />
                <span>{item.label}</span>
              </div>
              {isStartWorkout && isWorkoutInProgress ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              ) : isActive ? (
                <ChevronRight className="w-4 h-4 text-tracker-bg" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 m-3 rounded-xl bg-tracker-bg border border-tracker-border/70 text-xs">
        <p className="font-semibold text-tracker-text flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Fixed-Weight Mode
        </p>
        <p className="text-[11px] text-tracker-textMuted mt-1 leading-relaxed">
          Progression focus: Repetition volume & personal records.
        </p>
      </div>
    </aside>
  );
};
