import React, { useEffect, useState } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Trophy, 
  Calendar, 
  Check, 
  AlertCircle,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../services/api';
import { Exercise, MuscleGroup, WorkoutTemplate } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

interface ExercisesPageProps {
  onViewExerciseProgress: (exerciseId: number) => void;
}

export const ExercisesPage: React.FC<ExercisesPageProps> = ({ onViewExerciseProgress }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  
  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    muscle_group: 'Biceps' as MuscleGroup,
    default_weight: 10,
    target_min_reps: 8,
    target_max_reps: 12,
    notes: '',
  });

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const muscleGroups: (MuscleGroup | 'All')[] = [
    'All',
    'Biceps',
    'Triceps',
    'Shoulders',
    'Forearms',
    'Back',
    'Legs',
    'Chest',
    'Other',
  ];

  const loadExercises = async () => {
    try {
      setLoading(true);
      const [exData, tplData] = await Promise.all([
        api.getExercises(selectedMuscle !== 'All' ? selectedMuscle : undefined),
        api.getTemplates(),
      ]);
      setExercises(exData);
      setTemplates(tplData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, [selectedMuscle]);

  const openCreateModal = () => {
    setEditingExercise(null);
    setFormData({
      name: '',
      muscle_group: selectedMuscle !== 'All' ? (selectedMuscle as MuscleGroup) : 'Biceps',
      default_weight: 10,
      target_min_reps: 8,
      target_max_reps: 12,
      notes: '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ex: Exercise) => {
    setEditingExercise(ex);
    setFormData({
      name: ex.name,
      muscle_group: ex.muscle_group,
      default_weight: ex.default_weight,
      target_min_reps: ex.target_min_reps,
      target_max_reps: ex.target_max_reps,
      notes: ex.notes || '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim()) {
      setErrorMsg('Exercise name is required.');
      return;
    }

    try {
      if (editingExercise) {
        await api.updateExercise(editingExercise.id, formData);
        setSuccessMsg(`"${formData.name}" updated successfully.`);
      } else {
        await api.createExercise(formData);
        setSuccessMsg(`"${formData.name}" created successfully.`);
      }
      setIsModalOpen(false);
      loadExercises();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save exercise');
    }
  };

  const handleDeleteExercise = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteExercise(deleteTarget.id);
      setSuccessMsg(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      loadExercises();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message);
      setDeleteTarget(null);
    }
  };

  const filteredExercises = exercises.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === 'All' || e.muscle_group === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-tracker-text flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-tracker-accent" />
            Exercise Management
          </h2>
          <p className="text-xs text-tracker-textMuted mt-1">
            Customizable exercise database. Fixed-weight progression targets rep increases.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={openCreateModal}
        >
          Add New Exercise
        </Button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tracker-textDim" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-tracker-bg border border-tracker-border rounded-xl pl-9 pr-3 py-2 text-xs text-tracker-text placeholder:text-tracker-textDim focus:outline-none focus:border-tracker-accent"
            />
          </div>

          {/* Muscle Group Pill Filters */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {muscleGroups.map((group) => {
              const isSelected = selectedMuscle === group;
              return (
                <button
                  key={group}
                  onClick={() => setSelectedMuscle(group)}
                  className={`
                    px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                    ${isSelected 
                      ? 'bg-tracker-accent text-white font-bold shadow-sm' 
                      : 'bg-tracker-bg text-tracker-textMuted hover:text-tracker-text border border-tracker-border/60'
                    }
                  `}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Exercises Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
          <div className="animate-spin w-8 h-8 border-3 border-tracker-accent border-t-transparent rounded-full" />
          <p className="text-sm text-tracker-textMuted">Loading exercises...</p>
        </div>
      ) : filteredExercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((ex) => (
            <Card
              key={ex.id}
              className="hover:border-tracker-accent/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-tracker-text leading-snug">
                    {ex.name}
                  </h3>
                  <Badge variant="gold" size="sm">
                    {ex.muscle_group}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-tracker-textMuted my-3">
                  <div className="flex justify-between items-center py-1 border-b border-tracker-border/40">
                    <span className="text-tracker-textDim">Default Weight:</span>
                    <span className="font-semibold text-tracker-accent font-mono-numbers">{ex.default_weight} kg</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-tracker-border/40">
                    <span className="text-tracker-textDim">Target Rep Range:</span>
                    <span className="font-semibold text-tracker-text font-mono-numbers">{ex.target_min_reps}–{ex.target_max_reps} reps</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-tracker-border/40">
                    <span className="text-tracker-textDim">Personal Record:</span>
                    <span className="font-bold text-amber-300 font-mono-numbers flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      {ex.personal_record_reps ? `${ex.personal_record_reps} reps` : 'None yet'}
                    </span>
                  </div>
                </div>

                {ex.notes && (
                  <p className="text-[11px] text-tracker-textDim italic line-clamp-2 mb-3 bg-tracker-bg/40 p-2 rounded-lg">
                    "{ex.notes}"
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-tracker-border/60">
                <button
                  onClick={() => onViewExerciseProgress(ex.id)}
                  className="text-xs font-semibold text-tracker-accent hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Progress & History
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(ex)}
                    className="p-1.5 rounded-lg text-tracker-textMuted hover:text-tracker-text hover:bg-tracker-surfaceLight"
                    title="Edit exercise"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(ex)}
                    className="p-1.5 rounded-lg text-tracker-textMuted hover:text-red-300 hover:bg-tracker-danger/20"
                    title="Delete exercise"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Dumbbell className="w-10 h-10 text-tracker-textDim mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-tracker-text mb-1">No exercises found</h3>
          <p className="text-xs text-tracker-textMuted max-w-sm mx-auto mb-4">
            No exercises match your current search or muscle filter.
          </p>
          <Button variant="secondary" size="sm" onClick={openCreateModal}>
            Create New Exercise
          </Button>
        </Card>
      )}

      {/* Add / Edit Exercise Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExercise ? 'Edit Exercise' : 'Create New Exercise'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveExercise} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-700/50 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-tracker-textDim uppercase font-bold block mb-1">
              Exercise Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Incline Dumbbell Curl"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-tracker-bg border border-tracker-border rounded-xl px-3 py-2 text-sm text-tracker-text focus:outline-none focus:border-tracker-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-tracker-textDim uppercase font-bold block mb-1">
                Muscle Group
              </label>
              <select
                value={formData.muscle_group}
                onChange={(e) => setFormData({ ...formData, muscle_group: e.target.value as MuscleGroup })}
                className="w-full bg-tracker-bg border border-tracker-border rounded-xl px-3 py-2 text-xs text-tracker-text focus:outline-none focus:border-tracker-accent"
              >
                {muscleGroups.filter(g => g !== 'All').map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-tracker-textDim uppercase font-bold block mb-1">
                Default Weight (kg)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={formData.default_weight}
                onChange={(e) => setFormData({ ...formData, default_weight: parseFloat(e.target.value) || 0 })}
                className="w-full bg-tracker-bg border border-tracker-border rounded-xl px-3 py-2 text-xs text-tracker-text font-mono-numbers focus:outline-none focus:border-tracker-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-tracker-textDim uppercase font-bold block mb-1">
                Target Min Reps
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={formData.target_min_reps}
                onChange={(e) => setFormData({ ...formData, target_min_reps: parseInt(e.target.value, 10) || 1 })}
                className="w-full bg-tracker-bg border border-tracker-border rounded-xl px-3 py-2 text-xs text-tracker-text font-mono-numbers focus:outline-none focus:border-tracker-accent"
              />
            </div>

            <div>
              <label className="text-tracker-textDim uppercase font-bold block mb-1">
                Target Max Reps
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={formData.target_max_reps}
                onChange={(e) => setFormData({ ...formData, target_max_reps: parseInt(e.target.value, 10) || 1 })}
                className="w-full bg-tracker-bg border border-tracker-border rounded-xl px-3 py-2 text-xs text-tracker-text font-mono-numbers focus:outline-none focus:border-tracker-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-tracker-textDim uppercase font-bold block mb-1">
              Technique / Cue Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Strict tempo, full stretch at bottom, squeeze at peak"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-tracker-bg border border-tracker-border rounded-xl p-2.5 text-xs text-tracker-text placeholder:text-tracker-textDim focus:outline-none focus:border-tracker-accent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-tracker-border/60">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingExercise ? 'Save Changes' : 'Create Exercise'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-tracker-textMuted">
            Are you sure you want to delete <strong className="text-tracker-text">"{deleteTarget?.name}"</strong>?
          </p>
          <p className="text-xs text-tracker-textDim">
            Exercises with recorded workout history cannot be deleted to preserve your historical progressive overload records.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteExercise}>
              Delete Exercise
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
