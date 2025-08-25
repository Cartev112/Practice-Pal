// src/types/routineTypes.ts
export interface ExerciseItem {
  id: string;
  duration?: string;
}

export interface Routine {
  id: string;
  title: string;
  description?: string;
  exerciseIds: ExerciseItem[];
}
