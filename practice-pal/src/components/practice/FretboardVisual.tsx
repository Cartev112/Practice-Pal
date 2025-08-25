import React from 'react';

// Very lightweight SVG fretboard placeholder
const strings = 6;
const inlayFrets = [3, 5, 7, 9, 12];
const frets = 12;

interface Props { midiNote?: number }

const notePositions: Record<number, { string: number; fret: number }> = {};
// precompute EADGBE standard tuning MIDI numbers for first 12 frets
(() => {
  const open = [40, 45, 50, 55, 59, 64]; // low E to high E MIDI numbers
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= 12; f++) {
      notePositions[open[s] + f] = { string: s, fret: f };
    }
  }
})();

const FretboardVisual: React.FC<Props> = ({ midiNote }) => {
  const height = 120;
  const width = 260;
  const stringSpacing = height / (strings - 1);
  const fretSpacing = width / frets;

  const lines = [];
  for (let i = 0; i < strings; i++) {
    lines.push(
      <line
        key={`string-${i}`}
        x1={0}
        y1={i * stringSpacing}
        x2={width}
        y2={i * stringSpacing}
        stroke="#d1d5db"
        strokeWidth={i === 0 ? 2 : 1}
      />
    );
  }
  // draw frets and capture inlay positions
  for (let f = 1; f <= frets; f++) {
    lines.push(
      <line
        key={`fret-${f}`}
        x1={f * fretSpacing}
        y1={0}
        x2={f * fretSpacing}
        y2={height}
        stroke="#9ca3af"
        strokeWidth={f % 12 === 0 ? 2 : 1}
      />
    );
  }

  // inlay dots
  inlayFrets.forEach(f => {
    if (f > frets) return;
    const x = f * fretSpacing - fretSpacing / 2;
    const y = height / 2;
    lines.push(
      <circle key={`inlay-${f}`} cx={x} cy={y} r={4} fill="#e5e7eb" opacity={0.8} />
    );
  });

  // highlight note if mapped
  const highlight = midiNote !== undefined ? notePositions[midiNote] : undefined;

  return (
    <div className="rounded-lg p-3 flex justify-center items-center shadow-inner bg-gray-800 border border-gray-700">
      <svg width={width} height={height}>
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>
        {lines}
        {highlight && (
          <circle
            cx={highlight.fret * fretSpacing}
            cy={highlight.string * stringSpacing}
            r={8}
            fill="#f472b6"
            stroke="#fff"
            strokeWidth={1}
            filter="url(#shadow)"
          />
        )}
      </svg>
    </div>
  );
};

export default FretboardVisual;
