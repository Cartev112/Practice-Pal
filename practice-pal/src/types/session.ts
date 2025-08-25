import { PitchEvent, RhythmEvent } from './events';

export interface PracticeSession {
  id: string;
  startTime: number;
  endTime: number | null;
  duration: number;
  pitchEvents: PitchEvent[];
  rhythmEvents: RhythmEvent[];
  tempo: number;
  timeSignature: string;
  exercises: string[];
}
