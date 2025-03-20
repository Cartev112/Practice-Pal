import React, { useState, useEffect } from 'react';

interface PerformanceFeedbackProps {
  detectedNote: string;
  centsDeviation: number | null;
  rhythmScore: number;
  isRecording: boolean;
  targetNote?: string; // Optional target note for exercises
}

interface FeedbackMessage {
  type: 'pitch' | 'rhythm' | 'general';
  message: string;
  severity: 'success' | 'warning' | 'error' | 'info';
  timestamp: number;
}

const PerformanceFeedback: React.FC<PerformanceFeedbackProps> = ({
  detectedNote,
  centsDeviation,
  rhythmScore,
  isRecording,
  targetNote
}) => {
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>([]);
  const [pitchAccuracy, setPitchAccuracy] = useState<number>(0);
  const [rhythmAccuracy, setRhythmAccuracy] = useState<number>(0);
  const [overallScore, setOverallScore] = useState<number>(0);
  
  // Generate feedback based on performance
  useEffect(() => {
    if (!isRecording) {
      setFeedbackMessages([]);
      setPitchAccuracy(0);
      setRhythmAccuracy(0);
      setOverallScore(0);
      return;
    }
    
    // Update rhythm accuracy
    setRhythmAccuracy(rhythmScore);
    
    // Update pitch accuracy based on cents deviation
    if (detectedNote !== '--' && centsDeviation !== null) {
      // Convert cents deviation to a 0-100 score
      // Perfect pitch = 0 cents deviation = 100 score
      // Worst pitch = 50 cents deviation = 0 score
      const pitchScore = Math.max(0, 100 - Math.abs(centsDeviation) * 2);
      setPitchAccuracy(pitchScore);
      
      // Generate pitch feedback
      if (Math.abs(centsDeviation) > 30) {
        addFeedback({
          type: 'pitch',
          message: centsDeviation > 0 
            ? 'You\'re playing sharp, try lowering your pitch' 
            : 'You\'re playing flat, try raising your pitch',
          severity: 'warning',
          timestamp: Date.now()
        });
      } else if (Math.abs(centsDeviation) < 5 && detectedNote !== '--') {
        // Occasionally give positive feedback for good pitch
        if (Math.random() < 0.05) { // Only 5% chance to avoid spamming
          addFeedback({
            type: 'pitch',
            message: 'Great intonation!',
            severity: 'success',
            timestamp: Date.now()
          });
        }
      }
      
      // Check if playing the target note (if provided)
      if (targetNote && detectedNote !== targetNote) {
        const noteWithoutOctave = detectedNote.replace(/\d+$/, '');
        const targetWithoutOctave = targetNote.replace(/\d+$/, '');
        
        if (noteWithoutOctave !== targetWithoutOctave) {
          addFeedback({
            type: 'pitch',
            message: `Target note is ${targetNote}, you played ${detectedNote}`,
            severity: 'error',
            timestamp: Date.now()
          });
        }
      }
    }
    
    // Generate rhythm feedback
    if (rhythmScore < 40) {
      addFeedback({
        type: 'rhythm',
        message: 'Try to stay in time with the metronome',
        severity: 'warning',
        timestamp: Date.now()
      });
    } else if (rhythmScore > 80 && Math.random() < 0.05) { // Occasional positive feedback
      addFeedback({
        type: 'rhythm',
        message: 'Excellent rhythm!',
        severity: 'success',
        timestamp: Date.now()
      });
    }
    
    // Calculate overall score
    const newOverallScore = Math.round((pitchAccuracy * 0.6) + (rhythmAccuracy * 0.4));
    setOverallScore(newOverallScore);
    
    // Generate general feedback based on overall performance
    if (feedbackMessages.length === 0 && isRecording) {
      addFeedback({
        type: 'general',
        message: 'Start playing to receive feedback',
        severity: 'info',
        timestamp: Date.now()
      });
    }
    
  }, [detectedNote, centsDeviation, rhythmScore, isRecording, targetNote]);
  
  // Add a new feedback message
  const addFeedback = (feedback: FeedbackMessage) => {
    setFeedbackMessages(prev => {
      // Check if we already have a similar message recently
      const similarMessageExists = prev.some(msg => 
        msg.type === feedback.type && 
        msg.message === feedback.message && 
        Date.now() - msg.timestamp < 5000
      );
      
      if (similarMessageExists) return prev;
      
      // Add new message and keep only the 5 most recent
      return [feedback, ...prev].slice(0, 5);
    });
  };
  
  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Get background color based on severity
  const getSeverityBg = (severity: string): string => {
    switch (severity) {
      case 'success': return 'bg-green-100 dark:bg-green-900/30 border-green-500';
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500';
      case 'error': return 'bg-red-100 dark:bg-red-900/30 border-red-500';
      default: return 'bg-blue-100 dark:bg-blue-900/30 border-blue-500';
    }
  };
  
  // Get text color based on severity
  const getSeverityText = (severity: string): string => {
    switch (severity) {
      case 'success': return 'text-green-700 dark:text-green-300';
      case 'warning': return 'text-yellow-700 dark:text-yellow-300';
      case 'error': return 'text-red-700 dark:text-red-300';
      default: return 'text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <div className="performance-feedback bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Performance Feedback
      </h3>
      
      {isRecording ? (
        <>
          {/* Performance scores */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Pitch
              </h4>
              <div className={`text-xl font-bold ${getScoreColor(pitchAccuracy)}`}>
                {Math.round(pitchAccuracy)}
              </div>
            </div>
            
            <div className="text-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Rhythm
              </h4>
              <div className={`text-xl font-bold ${getScoreColor(rhythmAccuracy)}`}>
                {rhythmAccuracy}
              </div>
            </div>
            
            <div className="text-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Overall
              </h4>
              <div className={`text-xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </div>
            </div>
          </div>
          
          {/* Target note (if provided) */}
          {targetNote && (
            <div className="mb-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded text-center">
              <h4 className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Target Note
              </h4>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {targetNote}
              </div>
              {detectedNote !== '--' && (
                <div className={`text-sm mt-1 ${detectedNote.replace(/\d+$/, '') === targetNote.replace(/\d+$/, '') 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'}`}
                >
                  {detectedNote.replace(/\d+$/, '') === targetNote.replace(/\d+$/, '') 
                    ? 'Correct note!' 
                    : `You played: ${detectedNote}`}
                </div>
              )}
            </div>
          )}
          
          {/* Feedback messages */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback
            </h4>
            
            {feedbackMessages.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No feedback yet
              </p>
            ) : (
              <div className="space-y-2">
                {feedbackMessages.map((msg, index) => (
                  <div 
                    key={`${msg.timestamp}-${index}`}
                    className={`p-2 border-l-4 rounded ${getSeverityBg(msg.severity)}`}
                  >
                    <p className={`text-sm ${getSeverityText(msg.severity)}`}>
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Start recording to receive performance feedback
        </p>
      )}
    </div>
  );
};

export default PerformanceFeedback;
