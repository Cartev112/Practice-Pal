import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AudioContextProvider } from './contexts/AudioContext';
import { PracticeSession } from './components/practice/PracticeSessionManager';
import LandingPage from './pages/LandingPage';
import PracticePage from './pages/PracticePage';
import ExercisePage from './pages/ExercisePage';
import PracticeSessionsPage from './pages/PracticeSessionsPage';
import RoutinePage from './pages/RoutinePage';
import SessionDetailPage from './pages/SessionDetailPage';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import './App.css';

const App: React.FC = () => {
  const [tempo, setTempo] = useState<number>(120);
  const [currentSessionData, setCurrentSessionData] = useState<PracticeSession | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioData, setAudioData] = useState<Float32Array | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Check for user's preferred color scheme
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);
  
  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Handle tempo changes - wrapped in useCallback
  const handleTempoChange = useCallback((newTempo: number) => {
    setTempo(newTempo);
  }, [setTempo]); // Dependency: stable setter

  // Handle playing state changes - wrapped in useCallback
  const handlePlayingChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, [setIsPlaying]); // Dependency: stable setter

  // Handle audio data updates - wrapped in useCallback
  const handleAudioData = useCallback((data: Float32Array) => {
    setAudioData(data);
  }, [setAudioData]); // Dependency: stable setter

  // Handle practice session start - wrapped in useCallback
  const handleStartPractice = useCallback(() => {
    setIsRecording(true);
    setIsPlaying(true);
  }, [setIsRecording, setIsPlaying]); // Dependencies: stable setters

  // Handle practice session end - wrapped in useCallback
  const handleStopPractice = useCallback((sessionData: PracticeSession) => {
    setIsRecording(false);
    setIsPlaying(false);
    setCurrentSessionData(sessionData); // Save completed session data
    const savedSessions = JSON.parse(localStorage.getItem('practiceSessions') || '[]') as PracticeSession[];
    localStorage.setItem('practiceSessions', JSON.stringify([...savedSessions, sessionData]));
  }, [setIsRecording, setIsPlaying, setCurrentSessionData]); // Dependencies: stable setters

  // Handle practice session discard - wrapped in useCallback
  const handleDiscardPractice = useCallback(() => {
    setIsRecording(false); // Ensure recording stops
    setCurrentSessionData(null); // Clear session data
  }, [setIsRecording, setCurrentSessionData]); // Dependencies: stable setters

  // Toggle dark mode - wrapped in useCallback
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prevMode => !prevMode);
  }, [setDarkMode]); // Dependency: stable setter

  return (
    <AudioContextProvider>
      <Router>
        <div className="flex flex-col min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">

          
          <main className="flex-grow w-full overflow-y-auto">
            <Routes>
              <Route path="/" element={<LandingPage />} />

              <Route 
                path="/exercises" 
                element={<ExercisePage />} 
              />
              <Route 
                path="/practice" 
                element={
                  <PracticePage 
                    tempo={tempo}
                    isPlaying={isPlaying}
                    isRecording={isRecording}
                    onTempoChange={handleTempoChange}
                    onPlayingChange={handlePlayingChange}
                    onAudioData={handleAudioData}
                    onStartPractice={handleStartPractice}
                    onEndPractice={handleStopPractice}
                    onDiscardPractice={handleDiscardPractice}
                    currentSessionData={currentSessionData}
                  />
                }
              />

              <Route 
                path="/routines" 
                element={<RoutinePage />} 
              />

              <Route 
                path="/sessions" 
                element={<PracticeSessionsPage />} 
              />
              <Route 
                path="/sessions/:id" 
                element={<SessionDetailPage />} 
              />
            </Routes>
          </main>
          

        </div>
      </Router>
    </AudioContextProvider>
  );
};

export default App;
