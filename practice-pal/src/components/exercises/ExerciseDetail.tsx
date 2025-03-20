import React from 'react';

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

interface ExerciseDetailProps {
  exercise: Exercise | null;
  onStartPractice: (exercise: Exercise) => void;
  onBack: () => void;
}

const ExerciseDetail: React.FC<ExerciseDetailProps> = ({ 
  exercise, 
  onStartPractice, 
  onBack 
}) => {
  if (!exercise) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
        <p className="text-gray-600 dark:text-gray-300">Select an exercise to view details</p>
      </div>
    );
  }
  
  // Function to generate a difficulty display
  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Easy';
      case 3: return 'Intermediate';
      case 4: return 'Advanced';
      case 5: return 'Expert';
      default: return `Level ${level}`;
    }
  };
  
  const getDifficultyColor = (level: number) => {
    if (level <= 2) {
      return 'text-green-600 dark:text-green-400';
    } else if (level <= 4) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else {
      return 'text-red-600 dark:text-red-400';
    }
  };
  
  return (
    <div className="exercise-detail">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={onBack}
          className="text-indigo-600 dark:text-indigo-400 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to list
        </button>
        
        <button
          onClick={() => onStartPractice(exercise)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
        >
          Start Practice
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{exercise.name}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{exercise.type}</div>
          </div>
          
          <div className={`text-right ${getDifficultyColor(exercise.difficulty)}`}>
            <div className="text-lg font-medium">{getDifficultyLabel(exercise.difficulty)}</div>
            <div className="text-sm">Difficulty: {exercise.difficulty}/5</div>
          </div>
        </div>
        
        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 my-4">
          <p className="text-gray-600 dark:text-gray-300">{exercise.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Practice Details</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Target Tempo:</span>
                <span className="font-medium text-gray-800 dark:text-white">{exercise.targetTempo} BPM</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Recommended Repetitions:</span>
                <span className="font-medium text-gray-800 dark:text-white">{exercise.recommendedRepetitions}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Focus Areas</h3>
            
            <div className="flex flex-wrap gap-2">
              {exercise.focusAreas.map((area, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {exercise.notation && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Notation</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg font-mono">
              {exercise.notation}
            </div>
          </div>
        )}
        
        {exercise.audioExample && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Audio Example</h3>
            <audio controls className="w-full">
              <source src={exercise.audioExample} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseDetail; 