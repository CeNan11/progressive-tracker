import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Download, 
  FileText, 
  Database, 
  RotateCcw, 
  AlertTriangle, 
  Check, 
  Dumbbell, 
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { WorkoutTemplate } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useTheme, AppTheme } from '../context/ThemeContext';
import { Palette } from 'lucide-react';

interface SettingsPageProps {
  onNavigateToSchedule: () => void;
  onNavigateToExercises: () => void;
  onDataReset: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onNavigateToSchedule,
  onNavigateToExercises,
  onDataReset,
}) => {
  const { theme, setTheme } = useTheme();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Reset confirmation modals
  const [resetModalMode, setResetModalMode] = useState<'history_only' | 'factory_reset' | null>(null);
  const [resetting, setResetting] = useState(false);

  const loadTemplates = async () => {
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleExportJson = () => {
    window.open(api.getExportJsonUrl(), '_blank');
  };

  const handleExportCsv = () => {
    window.open(api.getExportCsvUrl(), '_blank');
  };

  const handleSeedDemoData = async () => {
    try {
      setLoading(true);
      const res = await api.seedDemo();
      setMessage({ type: 'success', text: res.message });
      onDataReset();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to seed sample data' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!resetModalMode) return;
    try {
      setResetting(true);
      const res = await api.resetData(resetModalMode);
      setMessage({ type: 'success', text: res.message });
      setResetModalMode(null);
      onDataReset();
      loadTemplates();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reset data' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-tracker-text flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-tracker-accent" />
          Application Settings & Data
        </h2>
        <p className="text-xs text-tracker-textMuted mt-1">
          Manage routines, export persistent workout logs, and configure progressive targets.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
          message.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300' 
            : 'bg-red-950/40 border-red-700/50 text-red-300'
        }`}>
          <Check className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Visual Identity & Theme Appearance */}
      <Card
        title="Visual Theme & Color Palette"
        subtitle="Switch between the Dark Olive-Green aesthetic or Crimson Red & Black style"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dark Olive-Green (Master Prompt Default) */}
          <button
            onClick={() => setTheme('olive')}
            className={`
              p-4 rounded-xl border text-left transition-all relative
              ${theme === 'olive' 
                ? 'bg-tracker-surfaceLight border-tracker-accent shadow-md ring-1 ring-tracker-accent/40' 
                : 'bg-tracker-bg border-tracker-border hover:border-tracker-border/80'
              }
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-tracker-text">
                🌿 Dark Olive-Green & Gold
              </span>
              {theme === 'olive' && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-tracker-accent text-tracker-accentText">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-tracker-textMuted mb-3">
              Official Master Prompt theme: Dark olive canvas with muted gold progressive accents.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg border border-black/30 shadow-inner" style={{ backgroundColor: '#28301C' }} title="#28301C Main background" />
              <span className="w-6 h-6 rounded-lg border border-black/30 shadow-inner" style={{ backgroundColor: '#323D25' }} title="#323D25 Surface card" />
              <span className="w-6 h-6 rounded-lg border border-black/30 shadow-inner" style={{ backgroundColor: '#9A7E3B' }} title="#9A7E3B Accent gold" />
              <span className="w-6 h-6 rounded-lg border border-black/30 shadow-inner" style={{ backgroundColor: '#D2CF9A' }} title="#D2CF9A Text label" />
            </div>
          </button>

          {/* Crimson Red & Black */}
          <button
            onClick={() => setTheme('red-black')}
            className={`
              p-4 rounded-xl border text-left transition-all relative
              ${theme === 'red-black' 
                ? 'bg-tracker-surfaceLight border-tracker-accent shadow-md ring-1 ring-tracker-accent/40' 
                : 'bg-tracker-bg border-tracker-border hover:border-tracker-border/80'
              }
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-tracker-text">
                🔴 Crimson Red & Black
              </span>
              {theme === 'red-black' && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-tracker-accent text-tracker-accentText">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-tracker-textMuted mb-3">
              Athletic performance theme: Pitch-black obsidian with energetic crimson red highlights.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg border border-white/20 shadow-inner" style={{ backgroundColor: '#0C0C0E' }} title="#0C0C0E Main background" />
              <span className="w-6 h-6 rounded-lg border border-white/20 shadow-inner" style={{ backgroundColor: '#151518' }} title="#151518 Surface card" />
              <span className="w-6 h-6 rounded-lg border border-white/20 shadow-inner" style={{ backgroundColor: '#E11D48' }} title="#E11D48 Crimson red" />
              <span className="w-6 h-6 rounded-lg border border-white/20 shadow-inner" style={{ backgroundColor: '#F4F4F6' }} title="#F4F4F6 Text label" />
            </div>
          </button>
        </div>
      </Card>

      {/* Routine & Exercise Shortcuts */}
      <Card
        title="Workout Configuration"
        subtitle="Quick links to customize your training splits and dumbbell exercises"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-tracker-bg border border-tracker-border/70 flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-tracker-text flex items-center gap-2">
                <Calendar className="w-4 h-4 text-tracker-accent" />
                Workout Routine Schedule
              </h4>
              <p className="text-xs text-tracker-textMuted mt-1">
                Customize your repeating 6-day split (Arms, Back, Legs, Rest, Arms, Back).
              </p>
              <div className="mt-3">
                <Button variant="secondary" size="sm" onClick={onNavigateToSchedule}>
                  Configure Schedule
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-tracker-bg border border-tracker-border/70 flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-tracker-text flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-tracker-accent" />
                Exercise Database
              </h4>
              <p className="text-xs text-tracker-textMuted mt-1">
                Update default dumbbell weights, rep targets (e.g. 8–12 reps), and cues.
              </p>
              <div className="mt-3">
                <Button variant="secondary" size="sm" onClick={onNavigateToExercises}>
                  Manage Exercises
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Workout Templates */}
      <Card
        title="Workout Templates"
        subtitle="Reusable exercise templates linked to your routine days"
      >
        <div className="space-y-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-3.5 rounded-xl bg-tracker-bg border border-tracker-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <h4 className="text-sm font-bold text-tracker-text flex items-center gap-2">
                  {tpl.name}
                </h4>
                <p className="text-xs text-tracker-textMuted mt-0.5">
                  {tpl.description || 'Standard workout template'}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {tpl.exercises?.map((e) => (
                    <span
                      key={e.id}
                      className="px-2 py-0.5 rounded-md bg-tracker-surface text-[10px] text-tracker-textMuted border border-tracker-border/50"
                    >
                      {e.name} ({e.default_sets} sets)
                    </span>
                  ))}
                </div>
              </div>

              <span className="text-xs text-tracker-accent font-semibold shrink-0">
                {tpl.exercises?.length || 0} exercises
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Data Export & Backup */}
      <Card
        title="Data Backup & Export"
        subtitle="Download complete persistent workout history in open formats"
      >
        <div className="space-y-3 text-xs text-tracker-textMuted">
          <p>
            Your workout records are persistently stored in SQLite. You can export your data at any time for offline archiving or spreadsheet analysis.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4 text-tracker-accent" />}
              onClick={handleExportJson}
            >
              Export Full Database (JSON)
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={<FileText className="w-4 h-4 text-emerald-400" />}
              onClick={handleExportCsv}
            >
              Export Workout Logs (CSV)
            </Button>
          </div>
        </div>
      </Card>

      {/* Sample Demo Generator (for easy testing & visual demonstration) */}
      <Card
        title="Demo Progressive Overload Data"
        subtitle="Instantly populate realistic progressive repetition records"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-tracker-textMuted">
            Generates realistic dumbbell sessions showing rep increases (e.g. Bicep Curl 25 reps → 31 reps, +6 reps PR) across Arms, Back, Legs, and Rest cycles.
          </p>

          <Button
            variant="outline"
            size="sm"
            icon={<Sparkles className="w-4 h-4 text-amber-400" />}
            onClick={handleSeedDemoData}
            loading={loading}
            className="shrink-0"
          >
            Load Sample Data
          </Button>
        </div>
      </Card>

      {/* Danger Zone: Reset Data */}
      <Card
        title="Danger Zone"
        subtitle="Irreversible operations on your database"
        className="border-red-900/40 bg-red-950/10"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-red-900/20">
            <div>
              <h4 className="text-sm font-bold text-red-200">Clear Workout History</h4>
              <p className="text-xs text-tracker-textMuted mt-0.5">
                Deletes all completed sessions and set logs while keeping exercises and templates.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setResetModalMode('history_only')}
            >
              Clear History
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-red-200">Factory Reset</h4>
              <p className="text-xs text-tracker-textMuted mt-0.5">
                Completely resets everything to initial fresh state and default 6-day split.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setResetModalMode('factory_reset')}
            >
              Factory Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Modal
        isOpen={!!resetModalMode}
        onClose={() => setResetModalMode(null)}
        title="Confirm Reset Operation"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs text-tracker-textMuted">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              {resetModalMode === 'history_only'
                ? 'This will delete all completed workout sessions and set records permanently.'
                : 'This will reset the entire database to the factory initial configuration.'}
            </p>
          </div>

          <p className="text-tracker-text">
            Are you sure you wish to proceed? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setResetModalMode(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmReset} loading={resetting}>
              Yes, Reset Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
