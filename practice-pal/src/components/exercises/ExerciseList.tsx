import React, { useState } from 'react';

// Define exercise types based on the implementation plan
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

// Sample exercises for demonstration
const sampleExercises: Exercise[] = [
  {
    id: '1',
    type: 'scale',
    name: 'C Major Scale',
    description: 'Standard C Major scale, ascending and descending',
    difficulty: 1,
    targetTempo: 100,
    recommendedRepetitions: 5,
    focusAreas: ['technique', 'speed', 'accuracy'],
    notation: 'C D E F G A B C B A G F E D C'
  },
  {
    id: '2',
    type: 'arpeggio',
    name: 'D Minor Arpeggio',
    description: 'D Minor arpeggio pattern',
    difficulty: 2,
    targetTempo: 90,
    recommendedRepetitions: 4,
    focusAreas: ['technique', 'intonation'],
    notation: 'D F A D A F D'
  },
  {
    id: '3',
    type: 'rhythm',
    name: 'Syncopated Eighth Notes',
    description: 'Practice syncopated eighth note patterns',
    difficulty: 3,
    targetTempo: 80,
    recommendedRepetitions: 6,
    focusAreas: ['timing', 'rhythm', 'coordination'],
    notation: '1 & a 2 & a 3 & a 4 & a'
  },
];

interface ExerciseListProps {
  onSelectExercise: (exercise: Exercise) => void;
}

const ExerciseList: React.FC<ExerciseListProps> = ({ onSelectExercise }) => {
  const [filter, setFilter] = useState<string>('all');
  const [difficultyRange, setDifficultyRange] = useState<[number, number]>([1, 5]);
  
  const filteredExercises = sampleExercises.filter(exercise => {
    const typeMatch = filter === 'all' || exercise.type === filter;
    const difficultyMatch = exercise.difficulty >= difficultyRange[0] && 
                            exercise.difficulty <= difficultyRange[1];
    return typeMatch && difficultyMatch;
  });
  
  return (
    <div className="exercise-list">
      <div className="filters bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
          Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exercise Type
            </label>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="scale">Scales</option>
              <option value="arpeggio">Arpeggios</option>
              <option value="rhythm">Rhythms</option>
              <option value="improvisation">Improvisation</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Difficulty (1-5): {difficultyRange[0]} - {difficultyRange[1]}
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="range" 
                min={1} 
                max={5} 
                value={difficultyRange[0]} 
                onChange={(e) => setDifficultyRange([parseInt(e.target.value), difficultyRange[1]])}
                className="w-full"
              />
              <span>to</span>
              <input 
                type="range" 
                min={1} 
                max={5} 
                value={difficultyRange[1]} 
                onChange={(e) => setDifficultyRange([difficultyRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {filteredExercises.length > 0 ? (
          filteredExercises.map(exercise => (
            <div 
              key={exercise.id}
              className="exercise-card bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer"
              onClick={() => onSelectExercise(exercise)}
            >
              <div className="flex justify-between">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                  {exercise.name}
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  exercise.difficulty <= 2 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : exercise.difficulty <= 4
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  Level {exercise.difficulty}
                </span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
                {exercise.description}
              </p>
              
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                <div>Target tempo: {exercise.targetTempo} BPM</div>
                <div>Suggested repetitions: {exercise.recommendedRepetitions}</div>
              </div>
              
              {exercise.notation && (
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notation:</div>
                  <div className="font-mono text-sm">{exercise.notation}</div>
                </div>
              )}
              
              <div className="mt-3 flex flex-wrap gap-1">
                {exercise.focusAreas.map((area, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded text-xs"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center text-gray-500 dark:text-gray-400">
            No exercises match your filters. Try adjusting your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseList; 