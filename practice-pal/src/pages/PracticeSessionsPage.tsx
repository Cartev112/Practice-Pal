import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
}

interface PracticeSession {
  id: string;
  name: string;
  startTime: number;
  endTime: number | null;
  duration: number;
  exercises: Exercise[];
  notes: string;
}

const PracticeSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [showNewSessionModal, setShowNewSessionModal] = useState<boolean>(false);
  const [sessionName, setSessionName] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  
  const navigate = useNavigate();
  
  // Load sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('practiceSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
    
    // Mock data for available exercises
    // In a real app, this would come from a backend API
    setAvailableExercises([
      {
        id: 'ex1',
        name: 'Major Scales',
        category: 'Scales',
        difficulty: 'beginner',
        description: 'Practice all major scales with correct fingerings'
      },
      {
        id: 'ex2',
        name: 'Minor Scales',
        category: 'Scales',
        difficulty: 'beginner',
        description: 'Practice natural, harmonic, and melodic minor scales'
      },
      {
        id: 'ex3',
        name: 'Major Arpeggios',
        category: 'Arpeggios',
        difficulty: 'intermediate',
        description: 'Practice major arpeggios in all keys'
      },
      {
        id: 'ex4',
        name: 'Minor Arpeggios',
        category: 'Arpeggios',
        difficulty: 'intermediate',
        description: 'Practice minor arpeggios in all keys'
      },
      {
        id: 'ex5',
        name: 'II-V-I Progressions',
        category: 'Chord Progressions',
        difficulty: 'intermediate',
        description: 'Practice II-V-I progressions in all keys'
      },
      {
        id: 'ex6',
        name: 'Sight Reading Level 1',
        category: 'Sight Reading',
        difficulty: 'beginner',
        description: 'Basic sight reading exercises'
      },
      {
        id: 'ex7',
        name: 'Sight Reading Level 2',
        category: 'Sight Reading',
        difficulty: 'intermediate',
        description: 'Intermediate sight reading exercises'
      },
      {
        id: 'ex8',
        name: 'Sight Reading Level 3',
        category: 'Sight Reading',
        difficulty: 'advanced',
        description: 'Advanced sight reading exercises'
      }
    ]);
  }, []);
  
  // Save sessions to localStorage when they change
  useEffect(() => {
    localStorage.setItem('practiceSessions', JSON.stringify(sessions));
  }, [sessions]);
  
  // Filter exercises based on search query
  const filteredExercises = availableExercises.filter(exercise => 
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle creating a new session
  const handleCreateSession = () => {
    if (!sessionName) return;
    
    const newSession: PracticeSession = {
      id: `session-${Date.now()}`,
      name: sessionName,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      exercises: [...selectedExercises],
      notes: sessionNotes
    };
    
    setShowNewSessionModal(false);
    
    // In a real app, this would be saved to a backend
    // For now, we'll just add it to our local state
    setSessions(prev => [newSession, ...prev]);
    
    // Navigate to home page to start the session
    navigate('/');
  };
  
  // Handle ending a session
  const handleEndSession = (sessionId: string) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId
          ? {
              ...session,
              endTime: Date.now(),
              duration: Math.round((Date.now() - session.startTime) / 1000)
            }
          : session
      )
    );
  };
  
  // Toggle exercise selection
  const toggleExercise = (exercise: Exercise) => {
    setSelectedExercises(prev => 
      prev.some(ex => ex.id === exercise.id)
        ? prev.filter(ex => ex.id !== exercise.id)
        : [...prev, exercise]
    );
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
  
  // Format time display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="practice-sessions-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Practice Sessions
        </h1>
        
        <button
          onClick={() => setShowNewSessionModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
        >
          New Session
        </button>
      </div>
      
      {/* Sessions list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No practice sessions yet. Click "New Session" to get started.
            </p>
          </div>
        ) : (
          sessions.map(session => (
            <div 
              key={session.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {session.name}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(session.startTime)}
                </span>
              </div>
              
              <div className="mt-2">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Duration: </span>
                  {session.endTime 
                    ? formatTime(session.duration)
                    : 'In progress...'}
                </div>
                
                <div className="mt-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Exercises:
                  </span>
                  {session.exercises.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      No exercises added
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {session.exercises.map(exercise => (
                        <li 
                          key={exercise.id}
                          className="text-sm text-gray-600 dark:text-gray-300"
                        >
                          • {exercise.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {session.notes && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Notes:
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {session.notes}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-end">
                {!session.endTime ? (
                  <button
                    onClick={() => handleEndSession(session.id)}
                    className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    End Session
                  </button>
                ) : (
                  <button
                    className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                New Practice Session
              </h2>
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Session name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Session Name
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Morning Practice"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Exercise search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Add Exercises
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search exercises..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Exercise list */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {filteredExercises.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No exercises found
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredExercises.map(exercise => (
                        <li 
                          key={exercise.id}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
                          onClick={() => toggleExercise(exercise)}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedExercises.some(ex => ex.id === exercise.id)}
                              onChange={() => {}}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {exercise.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {exercise.category} • {exercise.difficulty}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Selected exercises */}
              {selectedExercises.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selected Exercises ({selectedExercises.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercises.map(exercise => (
                      <div 
                        key={exercise.id}
                        className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded-full flex items-center"
                      >
                        <span>{exercise.name}</span>
                        <button
                          onClick={() => toggleExercise(exercise)}
                          className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Session notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Session Notes (Optional)
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Add any notes about this practice session..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={!sessionName}
                  className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
                    sessionName
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-indigo-400 cursor-not-allowed'
                  }`}
                >
                  Start Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeSessionsPage;
