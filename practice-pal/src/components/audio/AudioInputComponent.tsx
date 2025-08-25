import React, { useEffect, useRef, useState } from 'react';
import { useAudioContext } from '../../contexts/AudioContext';
import WaveformVisualization from './WaveformVisualization';

interface AudioInputProps {
  onAudioData: (data: Float32Array) => void;
  isRecording: boolean;
}

const AudioInputComponent: React.FC<AudioInputProps> = ({ onAudioData, isRecording }) => {
  const { audioContext, isAudioInitialized, initializeAudio } = useAudioContext();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localAudioData, setLocalAudioData] = useState<Float32Array | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const initializeMicrophone = async () => {
    let cancelled = false;

    if (!isAudioInitialized) {
      try {
        await initializeAudio();
      } catch (err: any) {
        setError(err.message ?? 'Failed to initialise audio context.');
        return;
      }
    }
    
    try {
      if (!navigator.mediaDevices) {
        throw new Error("Media devices not supported in this browser.");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (cancelled) {
        // Component unmounted while awaiting permission
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;
      
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      setIsInitialized(true);
    } catch (err: any) {
      if (!cancelled) {
        setError(err.message ?? 'Microphone access denied.');
      }
    }

    // Return a cancel function so that callers can set cancelled = true
    return () => {
      cancelled = true;
    };
  };
  
  const processAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current || !isRecording) return;
    
    analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
    
    // Create a copy of the audio data to avoid reference issues
    const audioDataCopy = new Float32Array(dataArrayRef.current);
    
    // Only update state occasionally to prevent excessive renders
    // This reduces the number of state updates while still providing data frequently enough
    if (Math.random() < 0.2) { // Update roughly 20% of the time
      setLocalAudioData(audioDataCopy);
    }
    
    // Always pass the data to parent via callback (doesn't trigger re-renders)
    onAudioData(audioDataCopy);
    
    animationFrameRef.current = requestAnimationFrame(processAudio);
  };
  
  useEffect(() => {
    return () => {
      // Clean up on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  useEffect(() => {
    if (isInitialized && isRecording) {
      processAudio();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isInitialized, isRecording]);
  
  // When context reports initialised while this component is mounted
  useEffect(() => {
    if (isAudioInitialized) {
      setIsInitialized(true);
    }
  }, [isAudioInitialized]);
  
  return (
    <div className="audio-input">
      {error ? (
        <div className="error-message p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm"
          >
            Dismiss
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="audio-status text-gray-600 dark:text-gray-300">
            {isInitialized ? 
              (isRecording ? "Recording audio..." : "Microphone ready") : 
              "Microphone not initialized"}
          </div>
          
          {!isInitialized ? (
            <button 
              onClick={initializeMicrophone}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            >
              Enable Microphone
            </button>
          ) : (
            <div className="audio-visualization h-20 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
              <WaveformVisualization 
                audioData={localAudioData}
                isActive={isRecording}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioInputComponent; 