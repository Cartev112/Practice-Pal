import axios from 'axios';
import { PracticeSession } from '../types/session';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export async function fetchSessions(): Promise<PracticeSession[]> {
  const res = await axios.get<PracticeSession[]>(`${API_BASE}/sessions`);
  return res.data;
}

export async function saveSession(session: PracticeSession, signal?: AbortSignal) {
  const res = await axios.post(`${API_BASE}/sessions`, session, { signal });
  return res.data;
}

export async function savePitchEvents(sessionId: string, events: any[], signal?: AbortSignal) {
  await axios.post(`${API_BASE}/sessions/${sessionId}/pitch-events`, events, { signal });
}

export async function saveRhythmEvents(sessionId: string, events: any[], signal?: AbortSignal) {
  await axios.post(`${API_BASE}/sessions/${sessionId}/rhythm-events`, events, { signal });
}
