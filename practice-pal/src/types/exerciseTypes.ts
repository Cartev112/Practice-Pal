// src/types/exerciseTypes.ts

export interface Exercise {
  id: string; 
  title: string;
  description: string;
  tempo: number;
  timeSignature: [number, number];
  notes: string[]; // Array of note names (e.g., "C4", "G#5")
  category: string;
  tags?: string[];
}
