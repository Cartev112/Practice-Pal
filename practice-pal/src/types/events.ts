export interface PitchEvent {
  timestamp: number; // ms from session start
  note: string | null;
  frequency: number | null;
  cents: number | null;
  confidence?: number;
}

export interface RhythmEvent {
  timestamp: number;
  deviation: number | null;
  beatIndex: number | null;
  isOnBeat?: boolean;
}
