import React from 'react';

interface Props {
  elapsed: number; // seconds
  tempo: number;
  isPaused: boolean;
  metronomePlaying: boolean;
  onPauseToggle: () => void;
  onFinish: () => void;
  onDiscard: () => void;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const LiveControlsBar: React.FC<Props> = ({ elapsed, tempo, isPaused, metronomePlaying, onPauseToggle, onFinish, onDiscard }) => {
  return (
    <div className="relative flex items-center rounded-md bg-gradient-to-r from-gray-800 to-gray-700 shadow-lg px-4 py-3">
      {/* Left status (inline) */}
      <div className="flex items-center gap-4 text-sm">
        <div className="text-lg text-gray-200">{tempo} BPM</div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${metronomePlaying ? 'bg-green-700/70 text-green-100' : 'bg-gray-600 text-gray-200'}`}
          aria-label={metronomePlaying ? 'Metronome is playing' : 'Metronome is stopped'}
        >
          Metronome {metronomePlaying ? 'On' : 'Off'}
        </span>
      </div>

      {/* Centered clock */}
      <div className="absolute left-1/2 -translate-x-1/2 text-2xl font-semibold tabular-nums">
        {formatTime(elapsed)}
      </div>

      {/* Right status + Transport */}
      <div className="ml-auto flex items-center gap-3 text-sm">
        {!isPaused ? (
          <span className="text-xs px-2 py-1 rounded-full bg-red-700/80 text-red-100" aria-label="Recording active">
            ● REC
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-600 text-gray-200" aria-label="Recording paused">
            REC Paused
          </span>
        )}
        <button
          onClick={onPauseToggle}
          aria-label={isPaused ? 'Resume practice session' : 'Pause practice session'}
          className="rounded-md bg-yellow-600 px-4 py-2 hover:bg-yellow-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-400"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={onFinish} aria-label="Finish session" className="rounded-md bg-green-600 px-4 py-2 hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-400">
          Finish
        </button>
        <button onClick={onDiscard} aria-label="Discard session" className="rounded-md bg-red-600 px-4 py-2 hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400">
          Discard
        </button>
      </div>
    </div>
  );
};

export default LiveControlsBar;
