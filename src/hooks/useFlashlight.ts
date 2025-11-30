import { useCallback, type MouseEvent } from 'react';

/**
 * Hook to apply flashlight effect to an element.
 * It updates --x and --y CSS variables based on cursor position relative to the element.
 */
export function useFlashlight() {
  const handleMouseMove = useCallback((e: MouseEvent<HTMLElement>) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    element.style.setProperty('--x', `${x}px`);
    element.style.setProperty('--y', `${y}px`);
  }, []);

  return {
    onMouseMove: handleMouseMove,
    className: 'flashlight-effect' // Helper to ensure class is added
  };
}