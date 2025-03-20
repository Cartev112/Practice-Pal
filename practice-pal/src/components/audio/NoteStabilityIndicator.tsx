import React, { useEffect, useState } from 'react';

interface NoteStabilityIndicatorProps {
  currentNote: string;
  isRecording: boolean;
  stabilityThreshold?: number; // Time in ms to consider a note stable
}

const NoteStabilityIndicator: React.FC<NoteStabilityIndicatorProps> = ({
  currentNote,
  isRecording,
  stabilityThreshold = 500 // Default 500ms for stability
}) => {
  const [noteStartTime, setNoteStartTime] = useState<number | null>(null);
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [stability, setStability] = useState<number>(0); // 0-100 scale
  const [isStable, setIsStable] = useState<boolean>(false);

  // Update stability when note changes or persists
  useEffect(() => {
    if (!isRecording || currentNote === '--') {
      setStability(0);
      setIsStable(false);
      setNoteStartTime(null);
      setLastNote(null);
      return;
    }
    
    const now = Date.now();
    
    // If the note changed
    if (currentNote !== lastNote) {
      setNoteStartTime(now);
      setLastNote(currentNote);
      setStability(0);
      setIsStable(false);
    } 
    // If the note is the same, update stability
    else if (noteStartTime) {
      const duration = now - noteStartTime;
      
      // Calculate stability percentage (capped at 100%)
      const newStability = Math.min(100, Math.floor((duration / stabilityThreshold) * 100));
      setStability(newStability);
      
      // Set stable flag if we've reached the threshold
      setIsStable(duration >= stabilityThreshold);
    }
  }, [currentNote, isRecording, lastNote, noteStartTime, stabilityThreshold]);

  // Get color based on stability
  const getStabilityColor = (): string => {
    if (stability < 33) return 'bg-red-500';
    if (stability < 66) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="note-stability-indicator">
      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
        Note Stability
      </h4>
      
      <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getStabilityColor()} transition-all duration-300 ease-out`}
          style={{ width: `${stability}%` }}
        ></div>
      </div>
      
      <div className="mt-2 text-sm">
        {isStable ? (
          <span className="text-green-500 font-medium">Stable</span>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">
            {stability > 0 ? 'Stabilizing...' : 'Waiting for stable note...'}
          </span>
        )}
      </div>
    </div>
  );
};

export default NoteStabilityIndicator;
