import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AudioContextProvider } from './contexts/AudioContext';
import HomePage from './pages/HomePage';
import ExercisePage from './pages/ExercisePage';
import PracticeSessionsPage from './pages/PracticeSessionsPage';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import './App.css';

const App: React.FC = () => {
  const [tempo, setTempo] = useState<number>(80);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  // We keep audioData even though it's not directly used in this component
  // because it will be needed for future audio analysis features and is passed to child components
  const [audioData, setAudioData] = useState<Float32Array | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [metronomeStartTime, setMetronomeStartTime] = useState<number | null>(null);
  
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
  
  // Handle tempo change
  const handleTempoChange = (newTempo: number) => {
    setTempo(newTempo);
  };
  
  // Handle metronome playing state
  const handlePlayingChange = (playing: boolean) => {
    setIsPlaying(playing);
    if (!playing) {
      setMetronomeStartTime(null);
    }
  };
  
  // Handle metronome start time
  const handleMetronomeStart = (startTime: number) => {
    setMetronomeStartTime(startTime);
  };
  
  // Handle audio data updates
  const handleAudioData = (data: Float32Array) => {
    setAudioData(data);
  };
  
  // Handle practice session start
  const handleStartPractice = () => {
    setIsRecording(true);
    // Start metronome automatically when practice starts
    setIsPlaying(true);
  };
  
  // Handle practice session end
  const handleStopPractice = () => {
    setIsRecording(false);
    // Stop metronome automatically when practice ends
    setIsPlaying(false);
    setMetronomeStartTime(null);
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <AudioContextProvider>
      <Router>
        <div className="flex flex-col min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Navbar 
            isRecording={isRecording}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
          />
          
          <main className="flex-grow w-full px-4 py-8">
            <Routes>
              <Route 
                path="/" 
                element={
                  <HomePage 
                    tempo={tempo}
                    isPlaying={isPlaying}
                    isRecording={isRecording}
                    metronomeStartTime={metronomeStartTime}
                    onTempoChange={handleTempoChange}
                    onPlayingChange={handlePlayingChange}
                    onMetronomeStart={handleMetronomeStart}
                    onAudioData={handleAudioData}
                    onStartPractice={handleStartPractice}
                    onStopPractice={handleStopPractice}
                  />
                } 
              />
              <Route 
                path="/exercises" 
                element={<ExercisePage />} 
              />
              <Route 
                path="/sessions" 
                element={<PracticeSessionsPage />} 
              />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </Router>
    </AudioContextProvider>
  );
};

export default App;
