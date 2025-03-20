import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MetronomeComponent from '../components/audio/MetronomeComponent';
import AudioInputComponent from '../components/audio/AudioInputComponent';
import PitchDetection from '../components/audio/PitchDetection';
import RhythmAnalysis from '../components/audio/RhythmAnalysis';
import PracticeSessionManager from '../components/practice/PracticeSessionManager';

interface HomePageProps {
  tempo: number;
  isPlaying: boolean;
  isRecording: boolean;
  onTempoChange: (tempo: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
  onAudioData: (data: Float32Array) => void;
  onStartPractice: () => void;
  onStopPractice: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  tempo,
  isPlaying,
  isRecording,
  onTempoChange,
  onPlayingChange,
  onAudioData,
  onStartPractice,
  onStopPractice
}) => {
  const [currentAudioData, setCurrentAudioData] = useState<Float32Array | null>(null);
  const [detectedNote, setDetectedNote] = useState<string>('--');
  // We're keeping centsDeviation for future use in the UI
  const [centsDeviation, setCentsDeviation] = useState<number | null>(null);
  const [rhythmScore, setRhythmScore] = useState<number>(0);
  
  // Handler to update the local state and pass to parent
  const handleAudioData = (data: Float32Array) => {
    setCurrentAudioData(data);
    onAudioData(data);
  };
  
  // Handler for pitch detection updates
  const handlePitchDetection = (note: string, _frequency: number | null, cents: number | null) => {
    setDetectedNote(note);
    setCentsDeviation(cents);
  };
  
  // Handler for rhythm analysis updates
  const handleRhythmUpdate = (score: number) => {
    setRhythmScore(score);
  };

  return (
    <div className="home-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Welcome to Practice Pal
        </h1>
        <Link 
          to="/sessions" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Practice Sessions
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Metronome</h2>
            <MetronomeComponent 
              tempo={tempo} 
              timeSignature={[4, 4]} 
              isPlaying={isPlaying}
              onTempoChange={onTempoChange}
              onPlayingChange={onPlayingChange}
            />
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Audio Input</h2>
            <AudioInputComponent 
              onAudioData={handleAudioData}
              isRecording={isRecording}
            />
          </div>
          
          <PracticeSessionManager 
            isRecording={isRecording}
            onStartSession={onStartPractice}
            onEndSession={onStopPractice}
            currentNote={detectedNote}
            rhythmScore={rhythmScore}
          />
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          <PitchDetection 
            audioData={currentAudioData} 
            isRecording={isRecording}
            onPitchDetected={handlePitchDetection}
          />
          
          <RhythmAnalysis 
            isRecording={isRecording}
            tempo={tempo}
            timeSignature={[4, 4]}
            audioData={currentAudioData}
            onRhythmScoreUpdate={handleRhythmUpdate}
          />
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/exercises"
                className="flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/30"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Exercises
              </Link>
              <button 
                onClick={onStartPractice}
                disabled={isRecording}
                className={`flex items-center justify-center p-3 rounded-lg ${
                  isRecording 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                    : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/30'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Practice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;