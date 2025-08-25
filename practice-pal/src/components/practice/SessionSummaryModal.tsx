import React from 'react';

interface Summary {
  duration: number; // ms
  avgPitchAcc: number; // 0-100
  avgRhythmDev: number; // ms (+/-)
  tempoStart: number;
  tempoEnd: number;
}

interface Props {
  open: boolean;
  summary: Summary | null;
  onClose: () => void;
}

const fmtMs = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

const SessionSummaryModal: React.FC<Props> = ({ open, summary, onClose }) => {
  if (!open || !summary) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="rounded-lg bg-gray-900 p-6 w-full max-w-md shadow-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-center">Session Summary</h2>
        <div className="space-y-2 text-sm text-gray-200">
          <div className="flex justify-between"><span>Duration:</span><span>{fmtMs(summary.duration)}</span></div>
          <div className="flex justify-between"><span>Avg Pitch Accuracy:</span><span>{summary.avgPitchAcc.toFixed(1)}%</span></div>
          <div className="flex justify-between"><span>Avg Timing Deviation:</span><span>{summary.avgRhythmDev.toFixed(1)} ms</span></div>
          <div className="flex justify-between"><span>Tempo:</span><span>{summary.tempoStart} → {summary.tempoEnd} BPM</span></div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-md bg-indigo-600 py-2 text-center hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export type { Summary };
export default SessionSummaryModal;
