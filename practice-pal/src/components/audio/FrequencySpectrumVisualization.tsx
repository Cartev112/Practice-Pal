import React, { useEffect, useRef } from 'react';

interface FrequencySpectrumVisualizationProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
}

const FrequencySpectrumVisualization: React.FC<FrequencySpectrumVisualizationProps> = ({
  analyserNode,
  isActive
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserNode || !isActive) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const drawSpectrum = () => {
      if (!isActive) return;
      
      // Get canvas dimensions
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Get frequency data
      analyserNode.getByteFrequencyData(dataArray);
      
      // Set up visualization style
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, width, height);
      
      // Calculate bar width based on canvas size and buffer length
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;
      
      // Draw frequency bars
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        
        // Create gradient color based on frequency
        const hue = i / bufferLength * 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
        if (x > width) break;
      }
      
      animationFrameRef.current = requestAnimationFrame(drawSpectrum);
    };
    
    drawSpectrum();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isActive]);

  return (
    <div className="frequency-spectrum-visualization w-full h-full">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        width={500}
        height={150}
      />
    </div>
  );
};

export default FrequencySpectrumVisualization;
