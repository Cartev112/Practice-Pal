import React, { useEffect, useState, useRef } from 'react';
import { useAudioContext } from '../../contexts/AudioContext';

interface MetronomeProps {
  tempo: number;
  timeSignature: [number, number];
  isPlaying: boolean;
  onTempoChange: (tempo: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
  onMetronomeStart?: (startTime: number) => void;
}

const MetronomeComponent: React.FC<MetronomeProps> = ({
  tempo,
  timeSignature = [4, 4],
  isPlaying,
  onTempoChange,
  onPlayingChange,
  onMetronomeStart
}) => {
  const { audioContext, isAudioInitialized, initializeAudio } = useAudioContext();
  const [currentBeat, setCurrentBeat] = useState(0);
  const nextNoteTimeRef = useRef(0);
  const schedulerTimerRef = useRef<number | null>(null);
  const beatsPerBar = timeSignature[0];
  
  useEffect(() => {
    // Initialize audio context if not already done
    if (!isAudioInitialized) {
      initializeAudio();
    }
  }, [isAudioInitialized, initializeAudio]);
  
  const scheduleNote = (beatNumber: number, time: number) => {
    if (!audioContext) return;
    
    // Create and schedule oscillator node
    const osc = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    
    osc.frequency.value = beatNumber % beatsPerBar === 0 ? 1000 : 800;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    
    osc.connect(envelope);
    envelope.connect(audioContext.destination);
    
    osc.start(time);
    osc.stop(time + 0.03);
  };
  
  const scheduler = () => {
    if (!audioContext) return;
    
    while (nextNoteTimeRef.current < audioContext.currentTime + 0.1) {
      scheduleNote(currentBeat, nextNoteTimeRef.current);
      
      // Advance beat and time
      const secondsPerBeat = 60.0 / tempo;
      nextNoteTimeRef.current += secondsPerBeat;
      setCurrentBeat((prevBeat) => (prevBeat + 1) % beatsPerBar);
    }
    
    schedulerTimerRef.current = window.setTimeout(scheduler, 25);
  };
  
  useEffect(() => {
    if (!audioContext) return;
    
    if (isPlaying) {
      setCurrentBeat(0);
      nextNoteTimeRef.current = audioContext.currentTime;
      scheduler();
      
      // Notify parent component about metronome start time
      if (onMetronomeStart) {
        onMetronomeStart(Date.now());
      }
    } else if (schedulerTimerRef.current) {
      clearTimeout(schedulerTimerRef.current);
    }
    
    return () => {
      if (schedulerTimerRef.current) {
        clearTimeout(schedulerTimerRef.current);
      }
    };
  }, [isPlaying, tempo, beatsPerBar, audioContext, onMetronomeStart]);
  
  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = parseInt(e.target.value, 10);
    onTempoChange(newTempo);
  };
  
  return (
    <div className="metronome">
      <div className="tempo-display">
        <span className="tempo-value text-4xl font-bold text-indigo-600 dark:text-indigo-400">{tempo}</span>
        <span className="tempo-unit text-lg ml-2">BPM</span>
      </div>
      
      <div className="tempo-control flex items-center gap-4 mt-4">
        <button 
          onClick={() => onTempoChange(Math.max(40, tempo - 5))}
          className="tempo-button bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
        >
          -
        </button>
        
        <input
          type="range"
          min="40"
          max="240"
          value={tempo}
          onChange={handleTempoChange}
          className="tempo-slider w-full"
        />
        
        <button 
          onClick={() => onTempoChange(Math.min(240, tempo + 5))}
          className="tempo-button bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
        >
          +
        </button>
      </div>
      
      <div className="beat-indicator flex justify-center gap-2 mt-4">
        {Array.from({ length: beatsPerBar }).map((_, i) => (
          <div 
            key={i}
            className={`beat w-4 h-4 rounded-full ${currentBeat === i && isPlaying 
              ? 'bg-indigo-600' 
              : 'bg-gray-300 dark:bg-gray-700'}`}
          />
        ))}
      </div>
      
      <button
        onClick={() => onPlayingChange(!isPlaying)}
        className={`play-button mt-4 px-4 py-2 rounded-md font-medium w-28 transition ${
          isPlaying 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {isPlaying ? 'Stop' : 'Start'}
      </button>
    </div>
  );
};

export default MetronomeComponent;