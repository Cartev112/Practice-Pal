import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from "@/components/ui/label"; 
import { Switch } from "@/components/ui/switch"; 
import axios from 'axios'; 

// Define detailed data structures for events
export interface PitchEvent {
  timestamp: number; // Relative to session start (ms)
  note: string | null; // '--' or null if silent
  frequency: number | null;
  cents: number | null;
  confidence?: number; // Optional: Add confidence from Pitchy
}

export interface RhythmEvent {
  timestamp: number; // Relative to session start (ms)
  deviation: number | null; // Deviation from expected beat (ms)
  beatIndex: number | null; // Index of the target beat
  isOnBeat?: boolean; // Optional: Add if RhythmAnalysis provides it
}

export interface PracticeSession {
  id: string;
  startTime: number; // Absolute timestamp (Date.now())
  endTime: number | null; // Absolute timestamp (Date.now())
  duration: number; // in seconds
  // Store detailed pitch and rhythm events
  pitchEvents: PitchEvent[];
  rhythmEvents: RhythmEvent[];
  // Add session context
  tempo: number; // BPM
  timeSignature: string; // e.g., "4/4"
  exercises: string[]; // Keep associated exercises
}

interface PracticeSessionManagerProps {
  isRecording: boolean;
  onStartSession: () => void;
  onEndSession: (session: PracticeSession) => void;
  onDiscardSession: () => void; // Add discard callback
  onActualTempoChange: (newTempo: number) => void; // Add tempo change callback
  latestPitchData: { note: string | null, frequency: number | null, cents: number | null, confidence?: number } | null;
  latestRhythmEvent: { timestamp: number, deviation: number | null, beatIndex: number | null, isOnBeat?: boolean } | null; // Assuming parent calculates relative timestamp
  tempo: number; // Pass tempo from parent
  timeSignature: string; // Pass time signature from parent
  currentSessionData?: PracticeSession | null; // Optional: Initial session data to load
}

const PracticeSessionManager: React.FC<PracticeSessionManagerProps> = ({
  isRecording,
  onStartSession,
  onEndSession,
  onDiscardSession,
  onActualTempoChange, // Destructure the new prop
  // Use the new props receiving data
  latestPitchData,
  latestRhythmEvent,
  tempo,
  timeSignature,
  currentSessionData, // Destructure the new prop
}) => {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
 
  // State for Adaptive Tempo
  const [adaptiveTempoEnabled, setAdaptiveTempoEnabled] = useState<boolean>(false); // Correct state
  const [currentTargetTempo, setCurrentTargetTempo] = useState<number>(tempo); // Correct state
  const [actualTempo, setActualTempo] = useState<number>(tempo); // Correct state
  const [performanceHistory, setPerformanceHistory] = useState<boolean[]>([]); // Correct state
  const PERFORMANCE_HISTORY_LENGTH = 16; // Correct constant
  // Helper to push into performanceHistory with bounded size
  const pushPerformance = useCallback((onBeat: boolean) => {
    setPerformanceHistory(prev => {
      const next = [...prev, onBeat];
      if (next.length > PERFORMANCE_HISTORY_LENGTH) next.shift();
      return next;
    });
  }, []);

  // Timer interval reference
  const timerIntervalRef = useRef<number | null>(null);

  // Handler for the "End Session" button click
  const handleEndSessionClick = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (currentSession) {
      const finishedSession: PracticeSession = {
        ...currentSession,
        endTime: Date.now(),
        pitchEvents: [...currentSession.pitchEvents],
        rhythmEvents: [...currentSession.rhythmEvents],
      };
      // Reset states
      setCurrentSession(null);
      setElapsedTime(0);
      setAdaptiveTempoEnabled(false);
      setActualTempo(tempo); // Reset to base tempo prop
      setCurrentTargetTempo(tempo); // Reset target tempo to base tempo prop
      setPerformanceHistory([]);

      // Call the prop passed from HomePage
      onEndSession(finishedSession);
    } else {
      console.warn("Attempted to end session, but no session was active.");
    }
  }, [currentSession, onEndSession, tempo]); // Added tempo dependency for reset

  // Handler for the Adaptive Tempo toggle switch
  const handleAdaptiveTempoToggle = useCallback((checked: boolean) => {
    setAdaptiveTempoEnabled(checked);
    if (!checked) {
      // When disabling, reset actual tempo to the current base tempo prop
      setActualTempo(tempo);
      setCurrentTargetTempo(tempo); // Also reset target tempo
      if (onActualTempoChange) onActualTempoChange(tempo);
      setPerformanceHistory([]); // Clear history
    } else {
       // When enabling, initialize based on the current base tempo prop
       setCurrentTargetTempo(tempo);
       setActualTempo(tempo);
       setPerformanceHistory([]); // Clear history
    }
  }, [tempo, onActualTempoChange]); // Added tempo dependency

  // Load sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('practiceSessions');
    if (savedSessions) {
      try {
        // Add basic validation or type checking if needed
        const parsedSessions = JSON.parse(savedSessions);
        if (Array.isArray(parsedSessions)) {
           setSessions(parsedSessions);
        }
      } catch (error) {
        console.error("Failed to parse sessions from localStorage:", error);
        // Clear corrupted data so next reload works
        localStorage.removeItem('practiceSessions');
      }
    }
  }, []);
  
  // Save sessions to localStorage when they change
  useEffect(() => {
    // Only save if sessions is not empty to avoid writing default empty array on init
    if (sessions.length > 0 || localStorage.getItem('practiceSessions')) {
        localStorage.setItem('practiceSessions', JSON.stringify(sessions));
    }
  }, [sessions]);
  
  // Handle session start/end
  useEffect(() => {
    if (isRecording && !currentSession) {
      // Start a new session
      const newSession: PracticeSession = {
        id: `session-${Date.now()}`,
        startTime: Date.now(),
        endTime: null,
        duration: 0,
        pitchEvents: [],
        rhythmEvents: [],
        tempo,
        timeSignature,
        exercises: [...selectedExercises]
      };
      setCurrentSession(newSession);
      setElapsedTime(0); // Reset elapsed time on new session start
    } else if (!isRecording && currentSession) {
      // End the current session
      const endedSession: PracticeSession = {
        ...currentSession,
        endTime: Date.now(),
        duration: Math.round((Date.now() - currentSession.startTime) / 1000),
      };
      
      setSessions(prev => [endedSession, ...prev].slice(0, 50)); // Keep max 50 sessions
      setCurrentSession(null);
      setElapsedTime(0);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Send data to backend API
      const backendUrl = 'http://localhost:3001/api/sessions'; // Make sure backend is running
      const controller = new AbortController();
      axios.post(backendUrl, endedSession, { signal: controller.signal })
          .then(response => {
            console.log('Session data successfully sent to backend:', response.data);
          })
          .catch(error => {
            console.error('Error sending session data to backend:', error.response ? error.response.data : error.message);
          });

      // Abort the request if the component unmounts before completion
      return () => controller.abort();

      // Log the detailed session data
      console.log('Practice Session Ended:', endedSession);
      // TODO: Replace localStorage and console.log with backend API call
      // sendSessionToBackend(endedSession);
    }
  }, [isRecording, currentSession, selectedExercises, tempo, timeSignature]); // Added tempo, timeSignature dependencies
  
  // Update elapsed time during recording
  useEffect(() => {
    let interval: number | null = null;
    
    if (isRecording && currentSession) {
      // Ensure elapsedTime starts from 0 for the new session
      setElapsedTime(Math.round((Date.now() - currentSession.startTime) / 1000));
      interval = window.setInterval(() => {
        // Check if session still exists before updating state
        setCurrentSession(current => {
            if (current) {
                setElapsedTime(Math.round((Date.now() - current.startTime) / 1000));
            }
            return current; // Return current state for setCurrentSession
        });
      }, 1000);
    } else {
        // Clear interval if not recording or no session
         if (interval) window.clearInterval(interval);
         // Reset elapsed time if needed when recording stops outside the main start/end effect
         // if (!isRecording) setElapsedTime(0);
    }
    
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isRecording, currentSession]);
  
  // Record pitch events using latestPitchData prop
  useEffect(() => {
    if (isRecording && currentSession && latestPitchData) {
       // Avoid adding duplicate events if the prop doesn't change meaningfully
       const lastEvent = currentSession.pitchEvents[currentSession.pitchEvents.length - 1];
       if (!lastEvent || lastEvent.note !== latestPitchData.note || lastEvent.frequency !== latestPitchData.frequency) {
          setCurrentSession(prev => {
            if (!prev) return null;
            const newEvent: PitchEvent = {
              timestamp: Date.now() - prev.startTime, // Calculate relative timestamp here
              note: latestPitchData.note,
              frequency: latestPitchData.frequency,
              cents: latestPitchData.cents,
              confidence: latestPitchData.confidence, // Include confidence
            };
            // Ensure immutability
            return {
              ...prev,
              pitchEvents: [...prev.pitchEvents, newEvent]
            };
          });
       }
    }
  }, [isRecording, currentSession, latestPitchData]); // Depend on latestPitchData
  
  // Record rhythm events using latestRhythmEvent prop
  useEffect(() => {
    if (isRecording && currentSession && latestRhythmEvent) {
        const lastEvent = currentSession.rhythmEvents[currentSession.rhythmEvents.length - 1];
        // Check timestamp to avoid duplicates if the prop reference changes but data is same
        // Use a small tolerance for timestamp comparison if needed
        if (!lastEvent || Math.abs(lastEvent.timestamp - latestRhythmEvent.timestamp) > 10 ) { // Check if timestamp differs significantly
            setCurrentSession(prev => {
                if (!prev) return null;
                const newEvent: RhythmEvent = {
                    // Assuming latestRhythmEvent timestamp is already relative
                    timestamp: latestRhythmEvent.timestamp,
                    deviation: latestRhythmEvent.deviation,
                    beatIndex: latestRhythmEvent.beatIndex,
                    isOnBeat: latestRhythmEvent.isOnBeat, // Include isOnBeat
                };
                 // Ensure immutability
                return {
                    ...prev,
                    rhythmEvents: [...prev.rhythmEvents, newEvent]
                };
            });
        }
    }
  }, [isRecording, currentSession, latestRhythmEvent, adaptiveTempoEnabled, actualTempo]); // Add dependencies
  
  // Adaptive Tempo Logic
  useEffect(() => {
    if (!adaptiveTempoEnabled || !isRecording || performanceHistory.length < PERFORMANCE_HISTORY_LENGTH / 2) {
      return;
    }

    const accuracyThresholdIncrease = 0.85;
    const accuracyThresholdDecrease = 0.65;
    const increaseStep = 1;
    const decreaseStep = 2;
    const maxTempo = Math.min(currentTargetTempo + 10, 200);
    const minTempo = Math.max(currentTargetTempo - 10, 40);

    const relevantHistory = performanceHistory.slice(-PERFORMANCE_HISTORY_LENGTH);
    const onTimeCount = relevantHistory.filter(onBeat => onBeat).length;
    const accuracy = relevantHistory.length > 0 ? onTimeCount / relevantHistory.length : 1.0;

    let newActualTempo = actualTempo;

    if (accuracy >= accuracyThresholdIncrease && actualTempo < maxTempo) {
      newActualTempo = Math.min(maxTempo, actualTempo + increaseStep);
    } else if (accuracy < accuracyThresholdDecrease && actualTempo > minTempo) {
      newActualTempo = Math.max(minTempo, actualTempo - decreaseStep);
    }

    if (Math.abs(newActualTempo - actualTempo) > 0.1) {
      // console.log(`Adaptive Tempo: Changing to ${newActualTempo.toFixed(1)} (Accuracy: ${(accuracy * 100).toFixed(1)}%)`);
      setActualTempo(newActualTempo);
      if (onActualTempoChange) onActualTempoChange(newActualTempo);
    }

  }, [
    performanceHistory,
    adaptiveTempoEnabled,
    isRecording,
    actualTempo,
    currentTargetTempo,
    onActualTempoChange
  ]);
  
  // Format time display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format date display
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle exercise selection
  const toggleExercise = (exercise: string) => {
    setSelectedExercises(prev => 
      prev.includes(exercise)
        ? prev.filter(ex => ex !== exercise)
        : [...prev, exercise]
    );
  };
  
  // Sample exercises (would come from a database in a real app)
  const availableExercises = [
    'Major Scales',
    'Minor Scales',
    'Arpeggios',
    'Chord Progressions',
    'Sight Reading'
  ];

  return (
    <div className="practice-session-manager bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Practice Session
      </h3>
      
      {/* Current session info */}
      {isRecording && currentSession ? (
        <div className="current-session space-y-4">
          <div className="flex items-center justify-between bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded">
            <div>
              <h4 className="font-medium text-indigo-700 dark:text-indigo-300">
                Recording Session
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Started {formatDate(currentSession.startTime)}
              </p>
            </div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatTime(elapsedTime)}
            </div>
          </div>
          
          {/* Session stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Pitch Events</div>
              <div className="text-xl font-bold text-gray-800 dark:text-white">
                {currentSession.pitchEvents.length}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Rhythm Events</div>
              <div className="text-xl font-bold text-gray-800 dark:text-white">
                {currentSession.rhythmEvents.length}
              </div>
            </div>
          </div>
          
          {/* End session button */}
          <button
            onClick={handleEndSessionClick}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          >
            End Session
          </button>
          {/* Add Adaptive Tempo Toggle Switch */}
          <div className="flex items-center justify-between pt-4">
            <Label htmlFor="adaptive-tempo" className="text-gray-700 dark:text-gray-300">
              Adaptive Tempo
            </Label>
            <Switch
              id="adaptive-tempo"
              checked={adaptiveTempoEnabled}
              onCheckedChange={handleAdaptiveTempoToggle}
              aria-label="Toggle Adaptive Tempo"
            />
          </div>
          {/* Display actual tempo if adaptive is enabled */}
          {adaptiveTempoEnabled && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Actual Tempo: {actualTempo.toFixed(1)} BPM (Target: {currentTargetTempo} BPM)
            </p>
          )}
        </div>
      ) : (
        <div className="new-session space-y-4">
          <div className="exercise-selection">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Exercises
            </h4>
            <div className="space-y-2">
              {availableExercises.map(exercise => (
                <label 
                  key={exercise}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input 
                    type="checkbox"
                    checked={selectedExercises.includes(exercise)}
                    onChange={() => toggleExercise(exercise)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{exercise}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Start session button */}
          <button
            onClick={onStartSession}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          >
            Start New Session
          </button>
        </div>
      )}
      
      {/* Session history */}
      <div className="session-history mt-6">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
          Recent Sessions
        </h4>
        
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No practice sessions recorded yet
          </p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {sessions.slice(0, 5).map(session => (
              <div 
                key={session.id}
                className="bg-gray-100 dark:bg-gray-700 p-3 rounded"
              >
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">
                    {formatDate(session.startTime)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(session.duration)}
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {session.exercises.length > 0 
                    ? session.exercises.join(', ')
                    : 'No exercises selected'}
                </div>
                
                <div className="mt-1 flex justify-between text-xs">
                  <span>Pitch Events: {session.pitchEvents.length}</span>
                  <span>Rhythm Events: {session.rhythmEvents.length}</span>
                </div>
              </div>
            ))}
            
            {sessions.length > 5 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                +{sessions.length - 5} more sessions
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeSessionManager;
