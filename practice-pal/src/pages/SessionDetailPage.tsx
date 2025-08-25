import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Define interfaces for the detailed data (can refine later)
interface PitchEvent {
    timestamp: number;
    note: string;
    frequency: number;
    clarity: number;
}

interface RhythmEvent {
    timestamp: number;
    type: 'beat' | 'onset';
    expectedTime?: number;
    accuracy?: number;
}

interface SessionDetails {
    id: string;
    startTime: number;
    endTime: number | null;
    duration: number;
    tempo: number;
    timeSignature: string;
    createdAt: string;
    pitchEvents: PitchEvent[];
    rhythmEvents: RhythmEvent[];
}

const SessionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<SessionDetails | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError('Session ID is missing.');
            setIsLoading(false);
            return;
        }

        const fetchSessionDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axios.get<SessionDetails>(`http://localhost:3001/api/sessions/${id}`);
                setSession(response.data);
            } catch (err) {
                console.error(`Error fetching session details for ID ${id}:`, err);
                setError('Failed to load session details.');
                if (axios.isAxiosError(err)) {
                    console.error('Axios error details:', err.response?.data || err.message);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchSessionDetails();
    }, [id]);

    if (isLoading) {
        return <div className="p-6 text-center">Loading session details...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-600">Error: {error}</div>;
    }

    if (!session) {
        return <div className="p-6 text-center">Session not found.</div>;
    }

    // Basic display (we can enhance this later)
    return (
        <div className="session-detail-page p-6">
            <button onClick={() => navigate('/sessions')} className="mb-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded shadow">
                &larr; Back to Sessions
            </button>
            <h1 className="text-2xl font-bold mb-4">Session Details</h1>
            <div className="bg-white p-4 rounded shadow mb-4">
                <p><strong>ID:</strong> {session.id}</p>
                <p><strong>Started:</strong> {new Date(session.startTime).toLocaleString()}</p>
                <p><strong>Ended:</strong> {session.endTime ? new Date(session.endTime).toLocaleString() : 'N/A'}</p>
                <p><strong>Duration:</strong> {Math.round(session.duration / 1000)} seconds</p>
                <p><strong>Tempo:</strong> {session.tempo} BPM</p>
                <p><strong>Time Signature:</strong> {session.timeSignature}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-xl font-semibold mb-2">Pitch Events ({session.pitchEvents.length})</h2>
                    <ul className="list-disc pl-5 max-h-96 overflow-y-auto">
                        {session.pitchEvents.map((event, index) => (
                            <li key={index} className="text-sm mb-1">
                                {new Date(event.timestamp).toLocaleTimeString()}: {event.note} ({(event.clarity * 100).toFixed(1)}%)
                            </li>
                        ))}
                        {session.pitchEvents.length === 0 && <li className="text-sm italic text-gray-500">No pitch events recorded.</li>}
                    </ul>
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-xl font-semibold mb-2">Rhythm Events ({session.rhythmEvents.length})</h2>
                    <ul className="list-disc pl-5 max-h-96 overflow-y-auto">
                        {session.rhythmEvents.map((event, index) => (
                            <li key={index} className="text-sm mb-1">
                                {new Date(event.timestamp).toLocaleTimeString()}: {event.type} {event.accuracy ? `(${(event.accuracy * 100).toFixed(1)}% accurate)` : ''}
                            </li>
                        ))}
                        {session.rhythmEvents.length === 0 && <li className="text-sm italic text-gray-500">No rhythm events recorded.</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SessionDetailPage;
