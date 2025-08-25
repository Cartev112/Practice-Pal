import React, { useEffect, useState } from 'react';

interface NoteHistoryVisualizationProps {
  currentNote: string;
  isRecording: boolean;
  maxHistory?: number;
}

interface NoteHistoryItem {
  note: string;
  timestamp: number;
  duration: number;
}

const NoteHistoryVisualization: React.FC<NoteHistoryVisualizationProps> = ({
  currentNote,
  isRecording,
  maxHistory = 10
}) => {
  const [noteHistory, setNoteHistory] = useState<NoteHistoryItem[]>([]);
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [lastNoteTimestamp, setLastNoteTimestamp] = useState<number | null>(null);

  // Update history when note changes
  useEffect(() => {
    if (!isRecording) return;
    
    const now = Date.now();
    
    // If this is a new note or note has ended
    if (currentNote !== lastNote) {
      // If we had a previous note, add it to history with duration
      if (lastNote && lastNoteTimestamp && lastNote !== '--') {
        const duration = now - lastNoteTimestamp;
        
        setNoteHistory(prevHistory => {
          const newHistory = [
            { note: lastNote, timestamp: lastNoteTimestamp, duration },
            ...prevHistory
          ];
          
          // Keep only the most recent notes
          return newHistory.slice(0, maxHistory);
        });
      }
      
      // Only update the current note if it's not '--' (silence)
      if (currentNote !== '--') {
        setLastNote(currentNote);
        setLastNoteTimestamp(now);
      } else {
        // Reset last note when silence is detected
        setLastNote(null);
        setLastNoteTimestamp(null);
      }
    }
  }, [currentNote, isRecording, lastNote, lastNoteTimestamp, maxHistory]);

  // Clear history when recording stops
  useEffect(() => {
    if (!isRecording) {
      setNoteHistory([]);
      setLastNote(null);
      setLastNoteTimestamp(null);
    }
  }, [isRecording]);

  // Helper function to calculate note duration display
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="note-history-visualization w-full">
      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
        Note History
      </h4>
      
      {noteHistory.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No notes detected yet
        </p>
      ) : (
        <div className="space-y-2">
          {noteHistory.map((item) => (
            <div 
              key={`${item.note}-${item.timestamp}`}
              className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded"
            >
              <span className="font-medium">{item.note}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDuration(item.duration)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoteHistoryVisualization;
