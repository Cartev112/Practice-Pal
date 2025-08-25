import React from 'react';

interface Props {
  value: number; // 0-100
  label?: string;
  units?: string;
  color?: string; // tailwind color hex or class
}

const size = 100;
const radius = 40;
const cx = size / 2;
const cy = size / 2;
const circumference = 2 * Math.PI * radius;

const DialGauge: React.FC<Props> = ({ value, label, units, color = '#6366f1' }) => {
  const pct = Math.max(0, Math.min(100, value));
  const strokeOffset = circumference * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="#374151"
          strokeWidth={10}
          fill="none"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={10}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeOffset}
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="text-xs text-gray-400 -mt-1">{label}</span>}
      <span className="text-lg font-semibold text-white">
        {value}
        {units}
      </span>
    </div>
  );
};

export default DialGauge;
