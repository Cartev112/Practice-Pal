import React from 'react';
import DialGauge from '../ui/DialGauge';

interface Props {
  bpm: number;
  targetBpm: number;
}

const AdaptiveTempoGauge: React.FC<Props> = ({ bpm, targetBpm }) => {
  const percent = Math.min(100, (bpm / targetBpm) * 100);
  return (
    <div className="rounded-lg bg-gray-800 p-4 flex flex-col items-center shadow-inner">
      <DialGauge value={percent} units="%" label="Tempo" color="#4f46e5" />
      <span className="text-xs text-gray-400 mt-1">
        {bpm} / {targetBpm} BPM
      </span>
    </div>
  );
};

export default AdaptiveTempoGauge;
