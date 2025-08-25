import React, { useState } from 'react';

import ExerciseList from '../components/exercises/ExerciseList';
import ExerciseDetail from '../components/exercises/ExerciseDetail';
import { Exercise } from '../types/exerciseTypes';

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
    console.log(`Starting practice for: ${exercise.title}`);
  };
  
    return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex-1 flex flex-col min-h-0">
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
    </div>
  );
};

export default ExercisePage;