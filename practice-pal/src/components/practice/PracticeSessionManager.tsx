import React, { useState, useEffect } from 'react';

interface PracticeSession {
  id: string;
  startTime: number;
  endTime: number | null;
  duration: number; // in seconds
  notes: string[];
  rhythmScores: number[];
  averageRhythmScore: number | null;
  exercises: string[];
}

interface PracticeSessionManagerProps {
  isRecording: boolean;
  onStartSession: () => void;
  onEndSession: () => void;
  currentNote: string;
  rhythmScore: number;
}

const PracticeSessionManager: React.FC<PracticeSessionManagerProps> = ({
  isRecording,
  onStartSession,
  onEndSession,
  currentNote,
  rhythmScore
}) => {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  
  // Load sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('practiceSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);
  
  // Save sessions to localStorage when they change
  useEffect(() => {
    localStorage.setItem('practiceSessions', JSON.stringify(sessions));
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
        notes: [],
        rhythmScores: [],
        averageRhythmScore: null,
        exercises: [...selectedExercises]
      };
      setCurrentSession(newSession);
    } else if (!isRecording && currentSession) {
      // End the current session
      const endedSession: PracticeSession = {
        ...currentSession,
        endTime: Date.now(),
        duration: Math.round((Date.now() - currentSession.startTime) / 1000),
        averageRhythmScore: currentSession.rhythmScores.length > 0
          ? Math.round(currentSession.rhythmScores.reduce((sum, score) => sum + score, 0) / currentSession.rhythmScores.length)
          : null
      };
      
      setSessions(prev => [endedSession, ...prev]);
      setCurrentSession(null);
      setElapsedTime(0);
    }
  }, [isRecording, currentSession, selectedExercises]);
  
  // Update elapsed time during recording
  useEffect(() => {
    let interval: number | null = null;
    
    if (isRecording && currentSession) {
      interval = window.setInterval(() => {
        setElapsedTime(Math.round((Date.now() - currentSession.startTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isRecording, currentSession]);
  
  // Record notes and rhythm scores during session
  useEffect(() => {
    if (isRecording && currentSession && currentNote !== '--') {
      // Only add a note if it's different from the last recorded note
      if (currentSession.notes.length === 0 || currentSession.notes[currentSession.notes.length - 1] !== currentNote) {
        setCurrentSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            notes: [...prev.notes, currentNote]
          };
        });
      }
    }
  }, [isRecording, currentSession, currentNote]);
  
  // Record rhythm scores
  useEffect(() => {
    if (isRecording && currentSession && rhythmScore > 0) {
      // Record rhythm score every 5 seconds
      if (elapsedTime % 5 === 0 && elapsedTime > 0) {
        setCurrentSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            rhythmScores: [...prev.rhythmScores, rhythmScore]
          };
        });
      }
    }
  }, [isRecording, currentSession, rhythmScore, elapsedTime]);
  
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
              <div className="text-sm text-gray-600 dark:text-gray-400">Notes Played</div>
              <div className="text-xl font-bold text-gray-800 dark:text-white">
                {currentSession.notes.length}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Rhythm</div>
              <div className="text-xl font-bold text-gray-800 dark:text-white">
                {currentSession.rhythmScores.length > 0
                  ? Math.round(currentSession.rhythmScores.reduce((sum, score) => sum + score, 0) / currentSession.rhythmScores.length)
                  : '--'}
              </div>
            </div>
          </div>
          
          {/* End session button */}
          <button
            onClick={onEndSession}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          >
            End Session
          </button>
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
                  <span>Notes: {session.notes.length}</span>
                  {session.averageRhythmScore !== null && (
                    <span>Rhythm Score: {session.averageRhythmScore}</span>
                  )}
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
