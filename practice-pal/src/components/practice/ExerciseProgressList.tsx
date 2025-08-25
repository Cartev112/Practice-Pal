import React from 'react';

export interface ProgressItem {
  id: string;
  title: string;
  durationSec: number;
  current: boolean;
  completed: boolean;
  elapsedSec?: number; // tracked for the current item
}

interface Props {
  items: ProgressItem[];
}

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
};

const ExerciseProgressList: React.FC<Props> = ({ items }) => {
  const currentIdx = items.findIndex((i) => i.current);
  return (
    <div className="space-y-1.5" role="list" aria-label="Exercise progress list">
      {items.map((it, idx) => {
        const isNext = !it.current && !it.completed && idx === currentIdx + 1;
        const elapsed = Math.max(0, Math.floor(it.elapsedSec ?? 0));
        const remaining = Math.max(0, it.durationSec > 0 ? it.durationSec - elapsed : it.durationSec);
        const pct = it.current && it.durationSec > 0 ? Math.min(100, Math.max(0, (elapsed / it.durationSec) * 100)) : 0;
        return (
          <div
            key={it.id}
            role="listitem"
            aria-current={it.current ? 'step' : undefined}
            className={`relative overflow-hidden flex items-center justify-between rounded-md px-3 py-2 text-sm shadow transition-colors ${
              it.current
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white ring-1 ring-indigo-400'
                : it.completed
                ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-400 line-through'
                : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400`}
            tabIndex={0}
          >
            {/* Depletion overlay: covers the proportion elapsed for current item */}
            {it.current && it.durationSec > 0 && (
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 bg-black/30"
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs w-6 h-6 inline-flex items-center justify-center rounded bg-gray-700/60 text-gray-200">
                {idx + 1}
              </span>
              <span className="truncate">{it.title}</span>
              {it.current && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white">Current</span>
              )}
              {isNext && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200">Next</span>
              )}
              {it.completed && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-200">Done</span>
              )}
            </div>
            <span className="tabular-nums text-gray-300">
              {it.current && it.durationSec > 0 ? formatTime(remaining) : formatTime(it.durationSec)}
            </span>
          </div>
        );
      })}
    </div>
  );
} 

export default ExerciseProgressList;
