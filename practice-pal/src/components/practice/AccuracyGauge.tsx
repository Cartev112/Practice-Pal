import React from 'react';
import DialGauge from '../ui/DialGauge';

interface Props {
  offsetMs: number; // negative = dragging, positive = rushing
}

const AccuracyGauge: React.FC<Props> = ({ offsetMs }) => {
  // map -50..50 ms → 0..100 gauge (clamped)
  const clamped = Math.max(-50, Math.min(50, offsetMs));
  const value = ((clamped + 50) / 100) * 100; // 0 left, 100 right
  const label = clamped === 0 ? 'On-time' : clamped > 0 ? 'Rushing' : 'Dragging';
  // Placeholder – render simple text until dial component is built
  return (
    <div className="rounded-lg bg-gray-800 p-4 flex flex-col items-center shadow-inner">
      <DialGauge value={value} units="%" label="Timing" color="#facc15" />
      <span className="text-xs text-gray-400 mt-1">
        {offsetMs > 0 ? '+' : ''}
        {offsetMs.toFixed(0)} ms · {label}
      </span>
    </div>
  );
};

export default AccuracyGauge;
