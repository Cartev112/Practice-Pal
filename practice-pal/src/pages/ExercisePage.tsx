import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ExerciseList from '../components/exercises/ExerciseList';
import ExerciseDetail from '../components/exercises/ExerciseDetail';

interface Exercise {
  id: string;
  type: 'scale' | 'arpeggio' | 'rhythm' | 'improvisation' | 'custom';
  name: string;
  description: string;
  difficulty: number;
  targetTempo: number;
  recommendedRepetitions: number;
  focusAreas: string[];
  notation?: string;
  audioExample?: string;
}

const ExercisePage: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };
  
  const handleBack = () => {
    setSelectedExercise(null);
  };
  
  const handleStartPractice = (exercise: Exercise) => {
    // In a full implementation, this would navigate to a practice session component
    // or set up the practice environment
    console.log(`Starting practice for: ${exercise.name}`);
  };
  
  return (
    <div className="exercise-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Practice Exercises
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
      
      {selectedExercise ? (
        <ExerciseDetail 
          exercise={selectedExercise}
          onStartPractice={handleStartPractice}
          onBack={handleBack}
        />
      ) : (
        <ExerciseList onSelectExercise={handleSelectExercise} />
      )}
    </div>
  );
};

export default ExercisePage;