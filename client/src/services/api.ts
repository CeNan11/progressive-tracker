import { 
  DashboardSummary, 
  Exercise, 
  ExerciseStats, 
  OverloadComparison, 
  ScheduledWorkoutItem, 
  WorkoutSession, 
  WorkoutTemplate 
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Dashboard
  async getDashboard(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/stats/dashboard`);
    return handleResponse<DashboardSummary>(res);
  },

  // Schedule
  async getSchedule(): Promise<ScheduledWorkoutItem[]> {
    const res = await fetch(`${API_BASE}/schedule`);
    return handleResponse<ScheduledWorkoutItem[]>(res);
  },

  async getTodaySchedule(): Promise<any> {
    const res = await fetch(`${API_BASE}/schedule/today`);
    return handleResponse<any>(res);
  },

  async updateSchedule(items: { cycle_order: number; workout_type: string; template_id: number | null }[]): Promise<ScheduledWorkoutItem[]> {
    const res = await fetch(`${API_BASE}/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    return handleResponse<ScheduledWorkoutItem[]>(res);
  },

  // Templates
  async getTemplates(): Promise<WorkoutTemplate[]> {
    const res = await fetch(`${API_BASE}/templates`);
    return handleResponse<WorkoutTemplate[]>(res);
  },

  async getTemplate(id: number): Promise<WorkoutTemplate> {
    const res = await fetch(`${API_BASE}/templates/${id}`);
    return handleResponse<WorkoutTemplate>(res);
  },

  async createTemplate(data: Partial<WorkoutTemplate>): Promise<WorkoutTemplate> {
    const res = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<WorkoutTemplate>(res);
  },

  async updateTemplate(id: number, data: Partial<WorkoutTemplate>): Promise<WorkoutTemplate> {
    const res = await fetch(`${API_BASE}/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<WorkoutTemplate>(res);
  },

  async deleteTemplate(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/templates/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res);
  },

  // Exercises
  async getExercises(muscleGroup?: string): Promise<Exercise[]> {
    const url = muscleGroup && muscleGroup !== 'All' 
      ? `${API_BASE}/exercises?muscle_group=${encodeURIComponent(muscleGroup)}`
      : `${API_BASE}/exercises`;
    const res = await fetch(url);
    return handleResponse<Exercise[]>(res);
  },

  async getExercise(id: number, rangeDays?: number): Promise<ExerciseStats> {
    const url = rangeDays ? `${API_BASE}/exercises/${id}?range=${rangeDays}` : `${API_BASE}/exercises/${id}`;
    const res = await fetch(url);
    return handleResponse<ExerciseStats>(res);
  },

  async getExercisePrevious(id: number, beforeSessionId?: number): Promise<{ previous: any; personal_record: number }> {
    const url = beforeSessionId 
      ? `${API_BASE}/exercises/${id}/previous?beforeSessionId=${beforeSessionId}`
      : `${API_BASE}/exercises/${id}/previous`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async createExercise(data: Partial<Exercise>): Promise<Exercise> {
    const res = await fetch(`${API_BASE}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Exercise>(res);
  },

  async updateExercise(id: number, data: Partial<Exercise>): Promise<Exercise> {
    const res = await fetch(`${API_BASE}/exercises/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Exercise>(res);
  },

  async deleteExercise(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/exercises/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res);
  },

  // Workouts
  async getWorkouts(filters?: { type?: string; status?: string; limit?: number; offset?: number }): Promise<WorkoutSession[]> {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== 'All') params.set('type', filters.type);
    if (filters?.status && filters.status !== 'All') params.set('status', filters.status);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());

    const res = await fetch(`${API_BASE}/workouts?${params.toString()}`);
    return handleResponse<WorkoutSession[]>(res);
  },

  async getWorkout(id: number): Promise<WorkoutSession> {
    const res = await fetch(`${API_BASE}/workouts/${id}`);
    return handleResponse<WorkoutSession>(res);
  },

  async saveWorkout(data: any): Promise<{ id: number; message: string }> {
    const res = await fetch(`${API_BASE}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ id: number; message: string }>(res);
  },

  async updateWorkout(id: number, data: any): Promise<{ id: number; message: string }> {
    const res = await fetch(`${API_BASE}/workouts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ id: number; message: string }>(res);
  },

  async deleteWorkout(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/workouts/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res);
  },

  async compareWorkout(data: { exercise_id: number; weight_used: number; sets: any[]; session_id?: number }): Promise<OverloadComparison> {
    const res = await fetch(`${API_BASE}/workouts/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<OverloadComparison>(res);
  },

  // Settings & Exports
  getExportJsonUrl(): string {
    return `${API_BASE}/settings/export`;
  },

  getExportCsvUrl(): string {
    return `${API_BASE}/settings/export-csv`;
  },

  async resetData(mode: 'history_only' | 'factory_reset'): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/settings/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    return handleResponse<{ message: string }>(res);
  },

  async seedDemo(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/settings/seed-demo`, {
      method: 'POST',
    });
    return handleResponse<{ message: string }>(res);
  },
};
