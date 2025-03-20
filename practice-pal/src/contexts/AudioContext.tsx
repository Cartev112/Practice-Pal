import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AudioContextType {
  audioContext: AudioContext;
  isAudioInitialized: boolean;
  initializeAudio: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioContextProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeAudio = async () => {
    if (audioCtx) return;
    
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioCtx(context);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  };

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, [audioCtx]);

  const value = {
    audioContext: audioCtx as AudioContext,
    isAudioInitialized: isInitialized,
    initializeAudio,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

// Keep the old name for backward compatibility
export const AudioProvider = AudioContextProvider;

export const useAudioContext = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
};