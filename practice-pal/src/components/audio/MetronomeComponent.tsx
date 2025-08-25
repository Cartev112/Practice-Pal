import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioContext } from '../../contexts/AudioContext';
import { useMetronome } from '../../contexts/MetronomeContext';

interface MetronomeProps {
  timeSignature?: [number, number];
  onMetronomeStart?: (startTime: number) => void;
}

const MetronomeComponent: React.FC<MetronomeProps> = ({
  timeSignature = [4, 4],
  onMetronomeStart
}) => {
  const { audioContext, initializeAudio, isAudioInitialized } = useAudioContext();
  const { tempo, setTempo, isPlaying, togglePlay, setStartEpoch } = useMetronome();
  const [currentBeat, setCurrentBeat] = useState(0); // Visual beat state (0=off, 1-indexed: 1, 2, 3, 4)
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const audioLoopBeatRef = useRef<number>(0); // 0-indexed beat for audio scheduling
  const schedulerTimerRef = useRef<number | null>(null);
  const hasStartedRef = useRef<boolean>(false); // Flag to track if onMetronomeStart has been called this run

  useEffect(() => {
    if (audioContext && !noiseBufferRef.current) {
      const bufferSize = audioContext.sampleRate * 0.05; // 50ms buffer
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      noiseBufferRef.current = buffer;
    }
  }, [audioContext]);

  const scheduleNote = (beatNumber: number, time: number) => {
    if (!audioContext || !noiseBufferRef.current) return;
    
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBufferRef.current;
    const gainNode = audioContext.createGain();
    
    const clickLevel = beatNumber % timeSignature[0] === 0 ? 0.6 : 0.4;
    const attackTime = 0.001;
    const decayTime = 0.02;
    const stopDelay = 0.01; // Small delay after decay before stopping

    gainNode.gain.setValueAtTime(0.0001, time);
    gainNode.gain.exponentialRampToValueAtTime(clickLevel, time + attackTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + attackTime + decayTime);

    noiseSource.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    noiseSource.start(time);
    // Add explicit stop for certainty
    noiseSource.stop(time + attackTime + decayTime + stopDelay);
    
    return time;
  };

  // Track latest playing state inside a ref to prevent stale closure in scheduler
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const scheduler = useCallback(() => {
    const currentTime = audioContext?.currentTime ?? 0;

    if (!audioContext || !isPlayingRef.current) {
        if (schedulerTimerRef.current) {
          cancelAnimationFrame(schedulerTimerRef.current);
          schedulerTimerRef.current = null;
        }
        return;
    }

    const secondsPerBeat = 60.0 / tempo;
    const nextBeatTime = nextNoteTimeRef.current;

    if (currentTime >= nextBeatTime) {
        const beatIndexToSchedule = audioLoopBeatRef.current;
        
        const scheduledTime = scheduleNote(beatIndexToSchedule, nextBeatTime);

        // Update visual state (1-indexed) conditionally when a beat is scheduled
        if (beatIndexToSchedule + 1 !== currentBeat) {
            setCurrentBeat(beatIndexToSchedule + 1); // Set 1-indexed visual beat
        }

        // Trigger start callback ONLY on the very first beat 0 of this run
        if (beatIndexToSchedule === 0 && !hasStartedRef.current && scheduledTime !== undefined) {
            const timeUntilScheduled = nextBeatTime - currentTime;
            const epochTime = Date.now() + timeUntilScheduled * 1000;
            setStartEpoch(epochTime);
            if(onMetronomeStart){ onMetronomeStart(epochTime); }
            hasStartedRef.current = true; // Mark as started for this run
        }

        audioLoopBeatRef.current = (audioLoopBeatRef.current + 1) % timeSignature[0];
        
        const newNextNoteTime = nextBeatTime + secondsPerBeat;
        nextNoteTimeRef.current = newNextNoteTime;
    }

    // Queue next frame unconditionally (if running)
    schedulerTimerRef.current = requestAnimationFrame(scheduler);
  }, [audioContext, tempo, timeSignature]);

  const stopScheduler = () => {
    if (schedulerTimerRef.current) {
      cancelAnimationFrame(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    setCurrentBeat(0); 
    audioLoopBeatRef.current = 0; 
    hasStartedRef.current = false;
  };

  const handlePlayPauseClick = async () => {
    // Initialize/Resume audio context on first user interaction (click)
    if (!isAudioInitialized || (audioContext && audioContext.state === 'suspended')) {
      try {
        if (!isAudioInitialized) {
          await initializeAudio(); // Creates and resumes
        } else if (audioContext) {
          await audioContext.resume(); // Just resumes
        }
      } catch (error) {
        console.error("MetronomeComponent: handlePlayPauseClick - Error during initializeAudio:", error);
        // Handle error appropriately, maybe show a message to the user
        return; // Don't proceed if initialization failed
      }
    }

    // Now toggle playing state
    togglePlay();
  };

  useEffect(() => {
    if (!audioContext) {
        return;
    }

    if (isPlaying) {
      stopScheduler(); // Clean up any previous state first. Resets beat counts/visuals.

      if (!noiseBufferRef.current) {
          console.warn("EFFECT: Audio context ready, but noise buffer not yet created...");
      }
      
      hasStartedRef.current = false;

      const firstBeatTime = audioContext.currentTime + 0.15; // Small delay
      nextNoteTimeRef.current = firstBeatTime; 
      
      schedulerTimerRef.current = requestAnimationFrame(scheduler);

    } else {
      stopScheduler();
    }
    
    return () => {
        stopScheduler();
    };

  }, [isPlaying, audioContext, tempo, onMetronomeStart, timeSignature[0], timeSignature[1]]); 

  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = parseInt(e.target.value, 10);
    setTempo(newTempo);
  };
  
  return (
    <div className="metronome">
      <div className="tempo-display">
        <span className="tempo-value text-4xl font-bold text-indigo-600 dark:text-indigo-400">{tempo}</span>
        <span className="tempo-unit text-lg ml-2">BPM</span>
      </div>
      
      <div className="tempo-control flex items-center gap-4 mt-4">
        <button 
          onClick={() => setTempo(Math.max(40, tempo - 5))}
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
          onClick={() => setTempo(Math.min(240, tempo + 5))}
          className="tempo-button bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
        >
          +
        </button>
      </div>
      
      <div className="beat-indicator flex justify-center gap-2 mt-4">
        {Array.from({ length: timeSignature[0] }).map((_, i) => (
          <div 
            key={i}
            className={`beat w-4 h-4 rounded-full transition-colors duration-50 ${currentBeat === i + 1 && isPlaying 
              ? 'bg-indigo-600 scale-110' 
              : 'bg-gray-300 dark:bg-gray-700'}`}
          />
        ))}
      </div>
      
      <button
        onClick={handlePlayPauseClick}
        className={`play-button mt-4 px-4 py-2 rounded-md font-medium w-28 transition ${isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
      >
        {isPlaying ? 'Stop' : 'Start'}
      </button>
    </div>
  );
};

export default MetronomeComponent;