import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios
import './PracticeSessionsPage.css';

// Define a type for the session summary received from the backend
interface SessionSummary {
    id: string;
    startTime: number;
    endTime: number | null;
    duration: number;
    tempo: number;
    timeSignature: string;
    createdAt: string; // Assuming ISO string format from backend
}

// Mock data structure for exercises (keep for modal)
interface Exercise {
    id: string;
    name: string;
    category: string;
    description: string;
}

const PracticeSessionsPage: React.FC = () => {
    const navigate = useNavigate();
    // State for modal and exercise selection (keep)
    const [showNewSessionModal, setShowNewSessionModal] = useState<boolean>(false);
    const [sessionName, setSessionName] = useState<string>('');
    const [sessionNotes, setSessionNotes] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

    // State for backend session summaries (keep)
    const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch session summaries from backend (keep)
    useEffect(() => {
        const fetchSessions = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axios.get<SessionSummary[]>('http://localhost:3001/api/sessions');
                setSessionSummaries(response.data);
            } catch (err) {
                console.error('Error fetching sessions:', err);
                setError('Failed to load practice sessions.');
                if (axios.isAxiosError(err)) {
                    console.error('Axios error details:', err.response?.data || err.message);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchSessions();
    }, []);

    // Load mock exercises (keep for modal)
    useEffect(() => {
        setAvailableExercises([
            {
                id: 'ex1',
                name: 'C Major Scale',
                category: 'Scales',
                description: 'Practice the C major scale across two octaves.'
            },
            {
                id: 'ex2',
                name: 'Arpeggio Study 1',
                category: 'Arpeggios',
                description: 'Focus on smooth transitions between chord tones.'
            },
            {
                id: 'ex3',
                name: 'Rhythm Pattern A',
                category: 'Rhythm',
                description: 'Quarter notes and eighth notes at 80 BPM.'
            }
        ]);
    }, []);

    // Filter exercises (keep for modal)
    const filteredExercises = availableExercises.filter(exercise => 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle creating a new session (keep for modal, but doesn't save locally anymore)
    const handleCreateSession = () => {
        if (!sessionName) return;
        console.log('Creating session setup:', { sessionName, selectedExercises, sessionNotes });
        setShowNewSessionModal(false);
    };

    // Toggle exercise selection (keep for modal)
    const toggleExercise = (exercise: Exercise) => {
        setSelectedExercises(prev => 
            prev.some(ex => ex.id === exercise.id)
            ? prev.filter(ex => ex.id !== exercise.id)
            : [...prev, exercise]
        );
    };

    // Navigate to session detail page
    const handleCardClick = (sessionId: string) => {
        console.log(`Navigate to details for session: ${sessionId}`);
        navigate(`/sessions/${sessionId}`); // Use navigate to go to detail page
    };

    return (
        <div className="practice-sessions-page p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Practice Sessions</h1>
                <div>
                    <button 
                        onClick={() => navigate('/')}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded shadow"
                    >
                        Back
                    </button>
                </div>
            </div>

            {/* Modal for planning a new session (keep if needed) */}
            {showNewSessionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
                        <h2 className="text-2xl font-semibold mb-4">Plan New Practice Session</h2>
                        {/* Session Name Input */}
                        <div className="mb-4">
                            <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700 mb-1">Session Name / Goal</label>
                            <input
                                type="text"
                                id="sessionName"
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                placeholder="e.g., Sight Reading Practice, Improve Intonation"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {/* Exercise Selection */}
                        <div className="mb-4">
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Select Exercises</h3>
                            <input
                                type="text"
                                placeholder="Search exercises..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm mb-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border p-2 rounded">
                                {filteredExercises.length > 0 ? (
                                    filteredExercises.map(exercise => (
                                        <div 
                                            key={exercise.id}
                                            className={`p-3 border rounded cursor-pointer ${selectedExercises.some(ex => ex.id === exercise.id) ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'}`}
                                            onClick={() => toggleExercise(exercise)}
                                        >
                                            <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
                                            <p className="text-sm text-gray-600">{exercise.category}</p>
                                            <p className="text-xs text-gray-500 mt-1">{exercise.description}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic">No exercises match your search.</p>
                                )}
                            </div>
                        </div>
                        
                        {/* Session Notes */}
                        <div className="mb-6">
                            <label htmlFor="sessionNotes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                id="sessionNotes"
                                rows={3}
                                value={sessionNotes}
                                onChange={(e) => setSessionNotes(e.target.value)}
                                placeholder="Any specific things to focus on? Metronome markings?"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            ></textarea>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowNewSessionModal(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateSession}
                                disabled={!sessionName}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Plan
                            </button>
                        </div>
                    </div>
                </div>
            )} {/* End of Modal JSX */}

            {/* Display Fetched Session Summaries */} 
            <div className="session-list-container mt-8"> 
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Saved Sessions</h2>
                {isLoading && <p className="text-center text-gray-500">Loading sessions...</p>}
                {error && <p className="error-message text-center text-red-600">Error: {error}</p>}
                {!isLoading && !error && sessionSummaries.length === 0 && (
                    <p className="text-center text-gray-500 italic">No practice sessions recorded yet.</p>
                )}
                {!isLoading && !error && sessionSummaries.length > 0 && (
                    <div className="session-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sessionSummaries.map((session) => (
                            <div key={session.id} className="session-summary-card bg-white p-4 border border-gray-200 rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow duration-200" onClick={() => handleCardClick(session.id)}>
                                <p className="text-sm text-gray-500 mb-1">{new Date(session.createdAt).toLocaleDateString()}</p>
                                <p className="font-semibold text-gray-800">{new Date(session.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                                <div className="mt-2 text-xs text-gray-600">
                                    <span>Duration: {Math.round(session.duration / 1000)}s</span>
                                    <span className="mx-2">|</span>
                                    <span>{session.tempo} BPM</span>
                                    <span className="mx-2">|</span>
                                    <span>{session.timeSignature}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeSessionsPage;
