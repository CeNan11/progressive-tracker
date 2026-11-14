import React, { useState } from 'react';
import { Sidebar, NavItemKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { DashboardPage } from './pages/DashboardPage';
import { SchedulePage } from './pages/SchedulePage';
import { WorkoutSessionPage } from './pages/WorkoutSessionPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { ProgressPage } from './pages/ProgressPage';
import { WorkoutHistoryPage } from './pages/WorkoutHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { WorkoutDetailModal } from './components/history/WorkoutDetailModal';
import { WorkoutSession } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');
  const [selectedProgressExerciseId, setSelectedProgressExerciseId] = useState<number | undefined>();
  const [activeWorkoutTemplateId, setActiveWorkoutTemplateId] = useState<number | undefined>();
  const [activeWorkoutType, setActiveWorkoutType] = useState<string | undefined>();
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(false);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<WorkoutSession | null>(null);

  // Trigger starting a workout
  const handleStartWorkout = (templateId?: number, workoutType?: string) => {
    setActiveWorkoutTemplateId(templateId);
    setActiveWorkoutType(workoutType);
    setIsWorkoutActive(true);
    setCurrentTab('workout-session');
  };

  const handleFinishWorkout = () => {
    setIsWorkoutActive(false);
    setActiveWorkoutTemplateId(undefined);
    setActiveWorkoutType(undefined);
    setCurrentTab('dashboard');
  };

  const handleCancelWorkout = () => {
    setIsWorkoutActive(false);
    setActiveWorkoutTemplateId(undefined);
    setActiveWorkoutType(undefined);
    setCurrentTab('dashboard');
  };

  const handleViewExerciseProgress = (exerciseId?: number) => {
    setSelectedProgressExerciseId(exerciseId);
    setCurrentTab('progress');
  };

  return (
    <div className="min-h-screen bg-tracker-bg text-tracker-text flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation (Desktop) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isWorkoutInProgress={isWorkoutActive}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onStartWorkout={() => handleStartWorkout()}
          isWorkoutInProgress={isWorkoutActive}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onStartWorkout={handleStartWorkout}
              onNavigateToProgress={handleViewExerciseProgress}
              onNavigateToHistory={() => setCurrentTab('history')}
              onNavigateToSchedule={() => setCurrentTab('schedule')}
              onViewSessionDetail={(session) => setSelectedSessionForModal(session)}
            />
          )}

          {currentTab === 'workout-session' && (
            <WorkoutSessionPage
              initialTemplateId={activeWorkoutTemplateId}
              initialWorkoutType={activeWorkoutType}
              onFinishWorkout={handleFinishWorkout}
              onCancel={handleCancelWorkout}
            />
          )}

          {currentTab === 'schedule' && (
            <SchedulePage />
          )}

          {currentTab === 'exercises' && (
            <ExercisesPage
              onViewExerciseProgress={handleViewExerciseProgress}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressPage
              initialExerciseId={selectedProgressExerciseId}
            />
          )}

          {currentTab === 'history' && (
            <WorkoutHistoryPage
              onStartWorkout={() => handleStartWorkout()}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              onNavigateToSchedule={() => setCurrentTab('schedule')}
              onNavigateToExercises={() => setCurrentTab('exercises')}
              onDataReset={() => {
                // If resetting, refresh dashboard or state
                setCurrentTab('dashboard');
              }}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isWorkoutInProgress={isWorkoutActive}
        />
      </div>

      {/* Global Workout Detail Modal */}
      {selectedSessionForModal && (
        <WorkoutDetailModal
          sessionId={selectedSessionForModal.id}
          onClose={() => setSelectedSessionForModal(null)}
          onSessionDeleted={() => {
            setSelectedSessionForModal(null);
          }}
        />
      )}
    </div>
  );
}
