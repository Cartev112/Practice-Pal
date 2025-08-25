import React, { useState } from 'react';
import { Routine } from '../../types/routineTypes';

export interface ExerciseOption {
  id: string;
  title: string;
}

export interface SessionSetupData {
  mode: 'routine' | 'custom' | 'single';
  routineId?: string;
  exerciseId?: string;
  adaptiveTempo: boolean;
  startTempo: number;
  accuracyThreshold: number;
  metronomeTempo: number;
  metronomeVolume: number;
  metronomeScheme: string;
  countIn: boolean;
  countInBeats: number;
}

interface Props {
  routines: Routine[];
  exercises: ExerciseOption[];
  onStart: (data: SessionSetupData) => void;
  onCancel: () => void;
}

const schemes = ['Click', 'HH Kick', 'Subdivided'];

const SessionSetupPanel: React.FC<Props> = ({ routines, exercises, onStart, onCancel }) => {
  const [mode, setMode] = useState<SessionSetupData['mode']>('routine');
  const [routineId, setRoutineId] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [adaptive, setAdaptive] = useState(false);
  const [startTempo, setStartTempo] = useState(80);
  const [threshold, setThreshold] = useState(90);
  const [tempo, setTempo] = useState(80);
  const [volume, setVolume] = useState(0.8);
  const [scheme, setScheme] = useState(schemes[0]);
  const [countIn, setCountIn] = useState(false);
  const [countBeats, setCountBeats] = useState(4);

  // Determine if the start button should be enabled (boolean)
  const canStart: boolean =
    (mode === 'routine' && routineId !== '') ||
    (mode === 'single' && exerciseId !== '') ||
    mode === 'custom';

  const handleStart = () => {
    if (!canStart) return;
    onStart({
      mode,
      routineId,
      exerciseId,
      adaptiveTempo: adaptive,
      startTempo,
      accuracyThreshold: threshold,
      metronomeTempo: tempo,
      metronomeVolume: volume,
      metronomeScheme: scheme,
      countIn,
      countInBeats: countBeats,
    });
  };

  return (
    <div className="flex h-full flex-col space-y-10 overflow-y-auto p-8 text-xl">
      {/* Picker */}
      <div>
        <h3 className="mb-5 text-4xl font-bold text-center">Session Type</h3>
        <div className="flex space-x-6 justify-center">
          {['routine', 'custom', 'single'].map((opt) => (
            <button
              key={opt}
              onClick={() => setMode(opt as any)}
              className={`rounded-xl px-7 py-4 text-xl ${
                mode === opt ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
        {mode === 'routine' && (
          <select
            value={routineId}
            onChange={(e) => setRoutineId(e.target.value)}
            className="mt-5 w-full rounded-xl bg-gray-800 p-5 text-white text-xl"
          >
            <option value="">Select routine</option>
            {routines.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        )}
        {mode === 'single' && (
          <select
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            className="mt-5 w-full rounded-xl bg-gray-800 p-5 text-white text-xl"
          >
            <option value="">Select exercise</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
        )}
        {mode === 'custom' && <p className="mt-5 text-gray-200 text-xl text-center">Will open routine builder later.</p>}
      </div>

      {/* Metronome section removed as per new design */}
      {/* Adaptive tempo */}
      <div>
        <h3 className="mb-5 text-4xl font-bold text-center">Adaptive Tempo</h3>
        <div className="flex items-center space-x-5 justify-center">
          <input type="checkbox" checked={adaptive} onChange={(e) => setAdaptive(e.target.checked)} />
          <span>Enable adaptive tempo</span>
        </div>
        {adaptive && (
          <div className="mt-5 space-y-5">
            <div>
              <label>Start tempo:</label>
              <input
                type="number"
                min={30}
                max={240}
                value={startTempo}
                onChange={(e) => setStartTempo(Number(e.target.value))}
                className="ml-3 w-32 rounded-xl bg-gray-800 p-4 text-white text-xl"
              />
            </div>
            <div>
              <label>Accuracy threshold (%):</label>
              <input
                type="number"
                min={50}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="ml-3 w-32 rounded-xl bg-gray-800 p-4 text-white text-xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* actions */}
      <div className="mt-auto w-full flex justify-between space-x-6">
        <button type="button" onClick={onCancel} className="rounded-xl bg-gray-600 px-7 py-5 text-white hover:bg-gray-700">
          Cancel
        </button>
        <button
          type="button"
          disabled={!canStart}
          onClick={handleStart}
          className={`rounded-xl px-7 py-5 ${canStart ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500'} text-white disabled:cursor-not-allowed`}
        >
          Start Session
        </button>
      </div>
    </div>
  );
};

export default SessionSetupPanel;
