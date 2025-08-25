import React from 'react';
import { Exercise } from '../../types/exerciseTypes';

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
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{exercise.title}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">Category: {exercise.category}</div>
          </div>
        </div>
        
        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 my-4">
          <p className="text-gray-600 dark:text-gray-300">{exercise.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Parameters</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Tempo:</span>
                <span className="font-medium text-gray-800 dark:text-white">{exercise.tempo} BPM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Time Signature:</span>
                <span className="font-medium text-gray-800 dark:text-white">{exercise.timeSignature[0]}/{exercise.timeSignature[1]}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Notes</h3>
            {exercise.notes && exercise.notes.length > 0 ? (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                <p className="font-mono text-sm text-gray-700 dark:text-gray-200 break-words">
                  {exercise.notes.join(', ')}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No specific notes defined.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetail;