import React from 'react';

interface TunerDisplayProps {
  detectedNote: string;
  detectedFrequency: number | null;
  centsDeviation: number | null;
}

const TunerDisplay: React.FC<TunerDisplayProps> = ({
  detectedNote,
  detectedFrequency,
  centsDeviation
}) => {
  // Helper function to determine color based on tuning accuracy
  const getTuningColor = (cents: number | null): string => {
    if (cents === null) return 'text-gray-400';
    
    const absCents = Math.abs(cents);
    if (absCents < 5) return 'text-green-500';
    if (absCents < 15) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  // Helper function to get the indicator position
  const getIndicatorPosition = (cents: number | null): number => {
    if (cents === null) return 50; // Center position
    
    // Clamp cents between -50 and 50 for display purposes
    const clampedCents = Math.max(-50, Math.min(50, cents));
    
    // Convert to percentage (0-100) for positioning
    return 50 + clampedCents;
  };

  return (
    <div className="tuner-display p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Tuner
      </h3>
      
      <div className="flex flex-col items-center">
        {/* Note display */}
        <div className={`text-4xl font-bold mb-2 ${getTuningColor(centsDeviation)}`}>
          {detectedNote !== '--' ? detectedNote : '–'}
        </div>
        
        {/* Frequency display */}
        {detectedFrequency && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {detectedFrequency.toFixed(1)} Hz
          </div>
        )}
        
        {/* Tuning meter */}
        <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-full relative mb-2">
          {/* Center line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-400"></div>
          
          {/* Indicator */}
          {centsDeviation !== null && (
            <div 
              className={`absolute top-1/2 w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${getTuningColor(centsDeviation)}`}
              style={{ left: `${getIndicatorPosition(centsDeviation)}%` }}
            ></div>
          )}
          
          {/* Tick marks */}
          <div className="absolute top-0 bottom-0 left-1/4 w-0.5 bg-gray-400 opacity-50"></div>
          <div className="absolute top-0 bottom-0 left-3/4 w-0.5 bg-gray-400 opacity-50"></div>
        </div>
        
        {/* Cents deviation */}
        {centsDeviation !== null && (
          <div className={`text-sm ${getTuningColor(centsDeviation)}`}>
            {centsDeviation > 0 ? '+' : ''}{centsDeviation.toFixed(0)} cents
          </div>
        )}
      </div>
    </div>
  );
};

export default TunerDisplay;
