import { useEffect, useState, useRef } from 'react';
import { PitchDetector } from 'pitchy';
import TunerDisplay from './TunerDisplay';
import NoteHistoryVisualization from './NoteHistoryVisualization';
import NoteStabilityIndicator from './NoteStabilityIndicator';
import FrequencySpectrumVisualization from './FrequencySpectrumVisualization';

interface PitchDetectionProps {
  audioData: Float32Array | null;
  isRecording: boolean;
  onPitchDetected?: (note: string, frequency: number | null, cents: number | null) => void;
}

const PitchDetection: React.FC<PitchDetectionProps> = ({ audioData, isRecording, onPitchDetected }) => {
  const [detectedNote, setDetectedNote] = useState<string>('--');
  const [detectedFrequency, setDetectedFrequency] = useState<number | null>(null);
  const [centsDeviation, setCentsDeviation] = useState<number | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frequencyBufferRef = useRef<number[]>([]);
  const noteBufferRef = useRef<string[]>([]);
  const bufferSizeRef = useRef<number>(5); // Size of buffer for smoothing
  const pitchDetectorRef = useRef<PitchDetector<Float32Array> | null>(null);

  // Helper function to get note from frequency with improved accuracy
  const getNote = (frequency: number): { note: string, cents: number } => {
    // A4 is 440Hz, and each semitone is a factor of 2^(1/12)
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    const notesInOctave = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    
    if (frequency < 16.35) return { note: "Below audible range", cents: 0 };
    if (frequency > 4186.01) return { note: "Above audible range", cents: 0 };
    
    // Calculate the number of semitones from C0
    const semitonesFromC0 = Math.log2(frequency / C0) * 12;
    
    // Round to the nearest semitone to get the note
    const roundedSemitones = Math.round(semitonesFromC0);
    const octave = Math.floor(roundedSemitones / 12);
    const noteIndex = roundedSemitones % 12;
    const noteName = `${notesInOctave[noteIndex]}${octave}`;
    
    // Calculate cents deviation (how far from the perfect frequency)
    const centsDeviation = Math.round((semitonesFromC0 - roundedSemitones) * 100);
    
    return { note: noteName, cents: centsDeviation };
  };

  // Setup audio analysis
  useEffect(() => {
    if (!isRecording) {
      // Clean up when not recording
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setDetectedNote('--');
      setDetectedFrequency(null);
      setCentsDeviation(null);
      setConfidenceLevel(0);
      if (onPitchDetected) onPitchDetected('--', null, null);
      return;
    }
    
    // Initialize audio context and analyzer
    const setupAudio = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (audioContextRef.current) {
          if (sourceRef.current) {
            sourceRef.current.disconnect();
          }
          
          sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 2048;
          sourceRef.current.connect(analyserRef.current);
          
          // Initialize Pitchy detector
          pitchDetectorRef.current = PitchDetector.forFloat32Array(analyserRef.current.fftSize);
          
          // Start analyzing
          detectPitch();
        }
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    };
    
    setupAudio();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, onPitchDetected]);

  // Pitch detection loop
  const detectPitch = () => {
    if (!analyserRef.current || !audioContextRef.current || !pitchDetectorRef.current) return;
    
    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(buffer);
    
    // Check if there's enough signal
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += buffer[i] * buffer[i];
    }
    
    const rms = Math.sqrt(sum / bufferLength);
    
    // Only analyze if we have sufficient signal
    if (rms > 0.01) {
      // Use Pitchy to detect the pitch
      const [pitch, clarity] = pitchDetectorRef.current.findPitch(buffer, audioContextRef.current.sampleRate);
      
      // Convert clarity (0-1) to confidence percentage
      const confidence = Math.min(clarity * 100, 100);
      
      if (pitch && pitch > 30 && pitch < 5000 && clarity > 0.5) {
        // Add to buffer for smoothing
        frequencyBufferRef.current.push(pitch);
        if (frequencyBufferRef.current.length > bufferSizeRef.current) {
          frequencyBufferRef.current.shift();
        }
        
        // Calculate median frequency for stability
        const sortedFreqs = [...frequencyBufferRef.current].sort((a, b) => a - b);
        const medianFreq = sortedFreqs[Math.floor(sortedFreqs.length / 2)];
        
        // Get note and cents deviation
        const { note, cents } = getNote(medianFreq);
        
        // Add to note buffer
        noteBufferRef.current.push(note);
        if (noteBufferRef.current.length > bufferSizeRef.current) {
          noteBufferRef.current.shift();
        }
        
        // Only update UI if the note is stable (appears most often in buffer)
        const noteCounts: Record<string, number> = {};
        let maxCount = 0;
        let dominantNote = note;
        
        for (const n of noteBufferRef.current) {
          noteCounts[n] = (noteCounts[n] || 0) + 1;
          if (noteCounts[n] > maxCount) {
            maxCount = noteCounts[n];
            dominantNote = n;
          }
        }
        
        // Calculate confidence based on note stability and Pitchy clarity
        const noteStability = maxCount / noteBufferRef.current.length;
        const overallConfidence = noteStability * confidence;
        
        // Update state with smoothed values
        setDetectedFrequency(medianFreq);
        setDetectedNote(dominantNote);
        setCentsDeviation(cents);
        setConfidenceLevel(Math.round(overallConfidence));
        if (onPitchDetected) onPitchDetected(dominantNote, medianFreq, cents);
      }
    }
    
    // Continue detection loop
    animationFrameRef.current = requestAnimationFrame(detectPitch);
  };

  return (
    <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Pitch Detection
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <TunerDisplay 
            detectedNote={detectedNote} 
            detectedFrequency={detectedFrequency} 
            centsDeviation={centsDeviation}
          />
        </div>
        
        <div className="space-y-4">
          <NoteStabilityIndicator 
            currentNote={detectedNote}
            isRecording={isRecording}
          />
          
          <div className="confidence-meter">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
              Detection Confidence: {confidenceLevel}%
            </h4>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500"
                style={{ width: `${confidenceLevel}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
     
      
      <div className="mt-4">
        <NoteHistoryVisualization 
          currentNote={detectedNote}
          isRecording={isRecording}
        />
      </div>
      
      {!isRecording && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Start recording to detect pitch
        </p>
      )}
    </div>
  );
};

export default PitchDetection;