import React from 'react';
import RoutineList from '../components/exercises/RoutineList';

const RoutinePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex-1 flex flex-col min-h-0">
        <RoutineList />
      </div>
    </div>
  );
};

export default RoutinePage;
