import React, { createContext, useState, useCallback, useContext } from 'react';

interface MetronomeContextValue {
  tempo: number;
  isPlaying: boolean;
  startEpoch: number | null;
  setTempo: (t: number) => void;
  togglePlay: () => void;
  setStartEpoch: (t: number) => void;
}

const MetronomeContext = createContext<MetronomeContextValue | undefined>(undefined);

export const MetronomeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tempo, setTempo] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startEpoch, setStartEpoch] = useState<number | null>(null);

  const togglePlay = useCallback(() => {
    setIsPlaying(p => !p);
  }, []);

  const value: MetronomeContextValue = {
    tempo,
    isPlaying,
    startEpoch,
    setTempo,
    togglePlay,
    setStartEpoch,
  };

  return (
    <MetronomeContext.Provider value={value}>{children}</MetronomeContext.Provider>
  );
};

export function useMetronome() {
  const ctx = useContext(MetronomeContext);
  if (!ctx) throw new Error('useMetronome must be used within MetronomeProvider');
  return ctx;
}
