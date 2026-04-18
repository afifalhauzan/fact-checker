import React from 'react';

interface UseResizableProps {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  containerSelector?: string;
}

interface UseResizableReturn {
  width: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

export const useResizable = ({
  initialWidth = 60,
  minWidth = 20,
  maxWidth = 80,
  containerSelector = '.resize-container'
}: UseResizableProps = {}): UseResizableReturn => {
  const [width, setWidth] = React.useState(initialWidth);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const containerRect = document.querySelector(containerSelector)?.getBoundingClientRect();
    if (!containerRect) return;
    
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain width between min and max
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setWidth(constrainedWidth);
  }, [isDragging, containerSelector, minWidth, maxWidth]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners for mouse events
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    width,
    isDragging,
    handleMouseDown
  };
};