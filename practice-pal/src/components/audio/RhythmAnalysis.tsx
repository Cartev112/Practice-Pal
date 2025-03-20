import React, { useState, useEffect, useRef } from 'react';

interface RhythmAnalysisProps {
  isRecording: boolean;
  tempo: number;
  timeSignature: [number, number];
  audioData: Float32Array | null;
  onRhythmScoreUpdate?: (score: number) => void;
}

interface BeatInfo {
  timestamp: number;
  deviation: number; // in milliseconds
  isOnBeat: boolean;
}

const RhythmAnalysis: React.FC<RhythmAnalysisProps> = ({
  isRecording,
  tempo,
  timeSignature,
  audioData,
  onRhythmScoreUpdate
}) => {
  const [beatHistory, setBeatHistory] = useState<BeatInfo[]>([]);
  const [currentBeat, setCurrentBeat] = useState<number>(1);
  const [rhythmScore, setRhythmScore] = useState<number>(0);
  const [averageDeviation, setAverageDeviation] = useState<number | null>(null);
  const [metronomeStartTime, setMetronomeStartTime] = useState<number | null>(null);
  
  const lastOnsetTime = useRef<number | null>(null);
  const beatInterval = useRef<number>(60000 / tempo); // in milliseconds
  const beatTimestamps = useRef<number[]>([]);
  const lastProcessedTime = useRef<number>(0);
  const prevRMSRef = useRef<number>(0);
  const adaptiveThresholdRef = useRef<number>(0.1);
  
  // Update beat interval when tempo changes
  useEffect(() => {
    beatInterval.current = 60000 / tempo;
    
    // Reset metronome start time when tempo changes during recording
    if (isRecording) {
      setMetronomeStartTime(Date.now());
      // Recalculate beat timestamps based on new tempo
      updateBeatTimestamps(Date.now(), true);
    }
  }, [tempo]);
  
  // Process audio data to detect onsets (sudden increases in amplitude)
  useEffect(() => {
    if (!isRecording || !audioData) return;
    
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessedTime.current;
    
    // Only process every 25ms to improve responsiveness
    if (timeSinceLastProcess < 25) return;
    lastProcessedTime.current = now;
    
    // Calculate RMS energy of the audio buffer
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sum / audioData.length);
    
    // Use adaptive threshold for better onset detection
    // Detect significant increases in energy rather than absolute values
    const energyIncrease = rms - prevRMSRef.current;
    prevRMSRef.current = rms;
    
    // Gradually adapt the threshold based on audio input
    adaptiveThresholdRef.current = 0.9 * adaptiveThresholdRef.current + 0.1 * (rms * 0.5);
    
    // Detect onset if energy exceeds threshold and there's a significant increase
    if (rms > adaptiveThresholdRef.current && energyIncrease > 0.05) {
      // Only count as a new onset if it's been at least 100ms since the last one
      // This prevents multiple detections of the same beat
      if (!lastOnsetTime.current || (now - lastOnsetTime.current) > 100) {
        analyzeOnset(now);
        lastOnsetTime.current = now;
      }
    }
    
    // Update beat timestamps based on tempo
    updateBeatTimestamps(now);
    
  }, [audioData, isRecording]);
  
  // Reset analysis when recording starts/stops
  useEffect(() => {
    if (!isRecording) {
      setBeatHistory([]);
      setCurrentBeat(1);
      setRhythmScore(0);
      setAverageDeviation(null);
      lastOnsetTime.current = null;
      beatTimestamps.current = [];
      lastProcessedTime.current = 0;
      prevRMSRef.current = 0;
      adaptiveThresholdRef.current = 0.1;
      setMetronomeStartTime(null);
    } else {
      // Initialize beat timestamps when recording starts
      const now = Date.now();
      setMetronomeStartTime(now);
      beatTimestamps.current = [now];
      lastProcessedTime.current = now;
      prevRMSRef.current = 0;
      adaptiveThresholdRef.current = 0.1;
      
      // Pre-populate expected beat timestamps for better initial synchronization
      updateBeatTimestamps(now, true);
    }
  }, [isRecording]);
  
  // Analyze an onset against the expected beat times
  const analyzeOnset = (timestamp: number) => {
    if (beatTimestamps.current.length === 0) return;
    
    // Find the closest expected beat
    let closestBeat = beatTimestamps.current[0];
    let minDeviation = Math.abs(timestamp - closestBeat);
    
    for (let i = 1; i < beatTimestamps.current.length; i++) {
      const deviation = Math.abs(timestamp - beatTimestamps.current[i]);
      if (deviation < minDeviation) {
        minDeviation = deviation;
        closestBeat = beatTimestamps.current[i];
      }
    }
    
    // Determine if the onset is "on beat" (within a tolerance window)
    // Tolerance is tighter at slower tempos, looser at faster tempos
    const toleranceWindow = Math.min(100, beatInterval.current * 0.3);
    const isOnBeat = minDeviation <= toleranceWindow;
    
    // Add to beat history
    const newBeat: BeatInfo = {
      timestamp,
      deviation: timestamp - closestBeat,
      isOnBeat
    };
    
    setBeatHistory(prev => {
      const newHistory = [newBeat, ...prev].slice(0, 20); // Keep last 20 beats
      
      // Calculate average deviation and rhythm score
      const deviations = newHistory.map(b => Math.abs(b.deviation));
      const avgDev = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
      setAverageDeviation(avgDev);
      
      // Calculate rhythm score (0-100)
      // Perfect timing would be 0 deviation, which equals 100 score
      // Maximum deviation we consider is half the beat interval, which equals 0 score
      const maxDeviation = beatInterval.current / 2;
      const onBeatCount = newHistory.filter(b => b.isOnBeat).length;
      const accuracyScore = (onBeatCount / newHistory.length) * 100;
      const deviationScore = 100 - Math.min(100, (avgDev / maxDeviation) * 100);
      
      // Combine accuracy and deviation scores with a 60/40 weight
      const newScore = Math.round((accuracyScore * 0.6) + (deviationScore * 0.4));
      setRhythmScore(newScore);
      
      // Call the callback if provided
      if (onRhythmScoreUpdate) {
        onRhythmScoreUpdate(newScore);
      }
      
      return newHistory;
    });
  };
  
  // Update the expected beat timestamps based on the current tempo
  const updateBeatTimestamps = (now: number, forceReset: boolean = false) => {
    if (!metronomeStartTime) return;
    
    if (forceReset) {
      // Reset timestamps completely based on current metronome start time
      beatTimestamps.current = [];
      
      // Calculate expected beats based on metronome start time
      const elapsedTime = now - metronomeStartTime;
      const beatsSinceStart = Math.floor(elapsedTime / beatInterval.current);
      
      // Add the first beat at metronome start time
      beatTimestamps.current.push(metronomeStartTime);
      
      // Add all beats since start up to current time plus future beats
      for (let i = 1; i <= beatsSinceStart + 8; i++) {
        beatTimestamps.current.push(metronomeStartTime + (i * beatInterval.current));
      }
    } else {
      // Clear old timestamps that are more than 2 seconds in the past
      beatTimestamps.current = beatTimestamps.current.filter(t => (now - t) < 2000);
      
      // Add future timestamps up to 2 seconds ahead
      const lastTimestamp = beatTimestamps.current.length > 0 
        ? beatTimestamps.current[beatTimestamps.current.length - 1] 
        : metronomeStartTime;
      
      let nextBeat = lastTimestamp + beatInterval.current;
      while (nextBeat < now + 2000) {
        beatTimestamps.current.push(nextBeat);
        nextBeat += beatInterval.current;
      }
    }
    
    // Update current beat position in the measure
    const beatsPerMeasure = timeSignature[0];
    const elapsedBeats = metronomeStartTime 
      ? Math.floor((now - metronomeStartTime) / beatInterval.current) 
      : 0;
    setCurrentBeat((elapsedBeats % beatsPerMeasure) + 1);
  };
  
  // Helper to format deviation in ms
  const formatDeviation = (ms: number): string => {
    const absMs = Math.abs(ms);
    const sign = ms < 0 ? 'early' : 'late';
    return `${absMs.toFixed(0)}ms ${sign}`;
  };
  
  // Get color based on rhythm score
  const getScoreColor = (): string => {
    if (rhythmScore >= 80) return 'text-green-500';
    if (rhythmScore >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="rhythm-analysis bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Rhythm Analysis
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rhythm score */}
        <div className="text-center p-3 bg-gray-100 dark:bg-gray-700 rounded">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rhythm Score
          </h4>
          <div className={`text-3xl font-bold ${getScoreColor()}`}>
            {isRecording ? rhythmScore : '--'}
          </div>
          {averageDeviation !== null && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Avg. Deviation: {formatDeviation(averageDeviation)}
            </div>
          )}
        </div>
        
        {/* Current beat indicator */}
        <div className="text-center p-3 bg-gray-100 dark:bg-gray-700 rounded">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Beat
          </h4>
          <div className="flex justify-center space-x-2">
            {Array.from({ length: timeSignature[0] }).map((_, i) => (
              <div 
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  currentBeat === i + 1 && isRecording
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Tempo: {tempo} BPM
          </div>
        </div>
      </div>
      
      {/* Beat history visualization */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Recent Beats
        </h4>
        <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden relative">
          {/* Center line (perfect timing) */}
          <div className="absolute top-0 left-1/2 w-px h-full bg-gray-400 dark:bg-gray-500"></div>
          
          {/* Tolerance window */}
          <div className="absolute top-0 left-1/2 h-full bg-green-200 dark:bg-green-900/30 transform -translate-x-1/2" 
               style={{ width: `${Math.min(50, beatInterval.current * 0.3)}px` }}>
          </div>
          
          {/* Beat markers */}
          {beatHistory.slice(0, 10).map((beat, index) => {
            // Calculate position based on deviation
            // Center is perfect timing, left is early, right is late
            const maxDeviation = beatInterval.current / 2;
            const position = 50 + ((beat.deviation / maxDeviation) * 50);
            const clampedPosition = Math.max(0, Math.min(100, position));
            
            return (
              <div 
                key={index}
                className={`absolute top-0 w-2 h-full ${beat.isOnBeat ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ left: `${clampedPosition}%` }}
              ></div>
            );
          })}
        </div>
      </div>
      
      {!isRecording && (
        <div className="mt-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          Start recording to analyze your rhythm
        </div>
      )}
    </div>
  );
};

export default RhythmAnalysis;
