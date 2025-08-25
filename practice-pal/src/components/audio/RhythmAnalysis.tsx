import React, { useState, useEffect, useRef } from 'react';

// Define RhythmEvent interface (mirroring PracticeSessionManager)
interface RhythmEvent {
  timestamp: number; // Relative to session start (ms)
  deviation: number | null;
  beatIndex: number | null;
  isOnBeat?: boolean;
}

interface RhythmAnalysisProps {
  isRecording: boolean;
  tempo: number;
  timeSignature: [number, number];
  audioData: Float32Array | null;
  // Update prop name and signature
  onRhythmEvent?: (event: RhythmEvent) => void;
  isPlaying: boolean;
  metronomeStartTime: number | null;
}

interface BeatInfo {
  id: number; // unique identifier (use timestamp)
  timestamp: number;
  deviation: number; // in milliseconds
  isOnBeat: boolean;
}

const RhythmAnalysis: React.FC<RhythmAnalysisProps> = ({
  isRecording,
  tempo,
  timeSignature,
  audioData,
  // Use the new prop name
  onRhythmEvent,
  isPlaying,
  metronomeStartTime: externalMetronomeStartTime
}) => {
  // State for visualization and scoring
  const [beatHistory, setBeatHistory] = useState<BeatInfo[]>([]);
  const [rhythmScore, setRhythmScore] = useState<number>(0);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  
  // Refs for tracking audio processing
  const lastProcessedTime = useRef<number>(0);
  const prevRMSRef = useRef<number>(0);
  const adaptiveThresholdRef = useRef<number>(0.05);
  const lastOnsetTime = useRef<number | null>(null);
  
  // Refs for metronome and beat tracking
  const metronomeStartTime = useRef<number | null>(null);
  const beatInterval = useRef<number>(60000 / tempo);
  const animationFrameRef = useRef<number | null>(null);
  
  // Update metronome start time when it changes externally
  useEffect(() => {
    metronomeStartTime.current = externalMetronomeStartTime;
  }, [externalMetronomeStartTime]);
  
  // Update beat interval when tempo changes
  useEffect(() => {
    beatInterval.current = 60000 / tempo;
  }, [tempo]);
  
  // Initialize or reset metronome when recording starts/stops
  useEffect(() => {
    if (isRecording && isPlaying) {
      if (!metronomeStartTime.current) {
        console.log('Warning: metronome not started yet');
        return;
      }
      
      setBeatHistory([]);
      setRhythmScore(0);
    } else {
      setBeatHistory([]);
      setRhythmScore(0);
      setCurrentBeat(0);
    }
  }, [isRecording, isPlaying]);
  
  // Analyze onset timing with improved accuracy
  const analyzeOnset = (timestamp: number) => {
    if (!metronomeStartTime.current) {
      console.log('Cannot analyze onset: metronome not initialized');
      return;
    }

    console.log('Analyzing onset at timestamp:', timestamp);

    // Calculate deviation from the closest beat directly
    const beatDuration = beatInterval.current;
    const startTime = metronomeStartTime.current;
    
    const elapsedTime = timestamp - startTime;
    // Use floor to keep beat index monotonic
    const beatIndex = Math.floor(elapsedTime / beatDuration);
    const closestBeatTime = startTime + beatIndex * beatDuration; // Calculate the time of that beat
    
    const deviation = timestamp - closestBeatTime;
    
    // Determine if the note is on beat (within tolerance)
    const toleranceWindow = beatDuration * 0.25; // 25% of beat interval
    const isOnBeat = Math.abs(deviation) <= toleranceWindow;
    
    console.log('Onset analysis:', {
      closestBeat: closestBeatTime,
      deviation,
      toleranceWindow,
      isOnBeat
    });

    // Create the event object with relative timestamp
    const rhythmEventData: RhythmEvent = {
        timestamp: elapsedTime, // Use elapsed time as relative timestamp
        deviation: deviation,
        beatIndex: beatIndex,
        isOnBeat: isOnBeat
    };

    // Call the new prop with the detailed event data
    if (onRhythmEvent) {
        onRhythmEvent(rhythmEventData);
    }

    // --- Internal state update (for local visualization/score) ---
    // Add to beat history for local display/calculations
    const newBeat: BeatInfo = { 
      id: timestamp,
      timestamp, // Keep absolute timestamp for potential internal use
      deviation, 
      isOnBeat 
    };
    
    setBeatHistory(prev => [newBeat, ...prev].slice(0, 10));
  };
  
  // Update current beat based on metronome time
  useEffect(() => {
    if (!isPlaying || !metronomeStartTime.current) {
      setCurrentBeat(0);
      return;
    }

    const updateBeat = () => {
      const now = Date.now();
      const beatDuration = beatInterval.current;
      const startTime = metronomeStartTime.current; // Store in local variable for type safety
      
      if (!startTime) return; // Extra safety check
      
      const elapsedBeats = Math.floor((now - startTime) / beatDuration);
      setCurrentBeat(elapsedBeats % timeSignature[0]);
      
      // Schedule next update
      animationFrameRef.current = requestAnimationFrame(updateBeat);
    };

    updateBeat();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, externalMetronomeStartTime, timeSignature]);

  // Process audio data for onset detection
  useEffect(() => {
    if (!isRecording || !isPlaying || !audioData || !metronomeStartTime.current) return;

    const rms = calculateRMS(audioData);
    const now = Date.now();

    // Only process if enough time has passed since last processing
    if (now - lastProcessedTime.current < 16) return; // ~60fps

    // Onset detection using adaptive threshold
    if (rms > adaptiveThresholdRef.current && rms > prevRMSRef.current) {
      if (!lastOnsetTime.current || now - lastOnsetTime.current > 100) { // Debounce onsets
        console.log('Onset detected at:', now);
        analyzeOnset(now);
        lastOnsetTime.current = now;
      }
    }

    // Update state
    prevRMSRef.current = rms;
    lastProcessedTime.current = now;

    // Adapt threshold
    // Allow threshold to decay slowly over time to stay sensitive after loud passages
    adaptiveThresholdRef.current = Math.max(
      0.05,
      adaptiveThresholdRef.current * 0.99 + rms * 0.01
    );
  }, [audioData, isRecording, isPlaying, externalMetronomeStartTime]);

  const calculateRMS = (audioData: Float32Array) => {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      const value = Math.abs(audioData[i]);
      sum += value * value;
    }
    return Math.sqrt(sum / audioData.length);
  };

  // Re-compute rhythm score whenever beat history changes
  useEffect(() => {
    const recentBeats = beatHistory.slice(0, 5);
    const onBeatCount = recentBeats.filter(b => b.isOnBeat).length;
    const newScore = Math.round((onBeatCount / Math.max(recentBeats.length, 1)) * 100);
    setRhythmScore(newScore);
  }, [beatHistory]);

  // Helper to format deviation in ms
  const formatDeviation = (ms: number): string => {
    const absMs = Math.abs(ms);
    if (absMs < 1000) return `${ms > 0 ? '+' : ''}${Math.round(ms)}ms`;
    return `${ms > 0 ? '+' : ''}${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="rhythm-analysis bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Rhythm Analysis</h2>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600 dark:text-gray-300">Rhythm Score</span>
          <span className="font-medium text-lg">{rhythmScore}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full" 
            style={{ width: `${rhythmScore}%` }}
          ></div>
        </div>
      </div>
      
      {/* Current beat indicator */}
      <div className="mb-4">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Current Beat</h4>
        <div className="flex space-x-2">
          {Array.from({ length: timeSignature[0] }).map((_, i) => (
            <div 
              key={i}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentBeat === i
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      
      {/* Beat history visualization */}
      <div className="beat-visualization mb-4">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Beat Timing</h4>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {beatHistory.map((beat, index) => (
            <div 
              key={beat.id}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${
                beat.isOnBeat 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              }`}
              title={`Deviation: ${formatDeviation(beat.deviation)}`}
            >
              {index + 1}
            </div>
          ))}
          {beatHistory.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No beats detected yet
            </div>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>Current tempo: {tempo} BPM</p>
        <p>Time signature: {timeSignature[0]}/{timeSignature[1]}</p>
      </div>
    </div>
  );
};

export default RhythmAnalysis;
