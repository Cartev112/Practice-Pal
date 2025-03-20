import React, { useRef, useEffect } from 'react';

interface WaveformVisualizationProps {
  audioData: Float32Array | null;
  isActive: boolean;
}

const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({ audioData, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !audioData || !isActive) return;
    
    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) return;
    
    // Clear the canvas
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set line style
    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = '#4f46e5'; // Indigo color
    
    // Start drawing
    canvasContext.beginPath();
    
    const sliceWidth = canvas.width / audioData.length;
    let x = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      const v = audioData[i];
      const y = (v + 1) / 2 * canvas.height;
      
      if (i === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.stroke();
  }, [audioData, isActive]);
  
  return (
    <div className="waveform-container h-full w-full relative">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full absolute inset-0" 
        width={300} 
        height={100}
      />
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-50 dark:bg-gray-800 dark:bg-opacity-50">
          <p className="text-gray-500 dark:text-gray-400">Ready to record</p>
        </div>
      )}
    </div>
  );
};

export default WaveformVisualization; 