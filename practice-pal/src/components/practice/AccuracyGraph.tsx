import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface Props {
  pitchAcc: number[]; // values 0-100
  rhythmAcc: number[]; // values 0-100
  windowSize?: number; // how many recent points to display
}



const AccuracyGraph: React.FC<Props> = ({ pitchAcc, rhythmAcc, windowSize = 60 }) => {
  // build merged data array limited to windowSize
  const data = useMemo(() => {
    const len = Math.max(pitchAcc.length, rhythmAcc.length);
    const start = Math.max(0, len - windowSize);
    const arr: Array<{ idx: number; pitch?: number; rhythm?: number }> = [];
    for (let i = start; i < len; i++) {
      arr.push({
        idx: i - start,
        pitch: pitchAcc[i],
        rhythm: rhythmAcc[i],
      });
    }
    return arr;
  }, [pitchAcc, rhythmAcc, windowSize]);

  return (
    <div className="w-full h-40 rounded-lg bg-gray-800 p-2">
      {/* Inline legend */}
      <div className="flex items-center gap-4 px-1 pb-1 text-xs text-gray-300">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-blue-500"></span>Pitch</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-500"></span>Rhythm</span>
      </div>
      <div className="h-[calc(100%-18px)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="idx" hide />
            <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <Tooltip
              formatter={(value: any, name: any) => {
                const label = name === 'pitch' ? 'Pitch' : name === 'rhythm' ? 'Rhythm' : name;
                return [`${value}%`, label];
              }}
              labelFormatter={() => ''}
            />
            <Line type="monotone" dataKey="pitch" stroke="#3b82f6" dot={false} strokeWidth={2} isAnimationActive={false} />
            <Line type="monotone" dataKey="rhythm" stroke="#10b981" dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AccuracyGraph;
