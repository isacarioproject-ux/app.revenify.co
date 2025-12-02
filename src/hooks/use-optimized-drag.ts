import { useCallback, useRef } from 'react';

interface DragState {
  isDragging: boolean;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
}

interface UseOptimizedDragOptions {
  onDragStart?: (position: { x: number; y: number }) => void;
  onDrag?: (position: { x: number; y: number }, delta: { x: number; y: number }) => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  throttleMs?: number;
}

export const useOptimizedDrag = ({
  onDragStart,
  onDrag,
  onDragEnd,
  throttleMs = 16 // ~60fps
}: UseOptimizedDragOptions) => {
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
  });
  
  const lastUpdateRef = useRef<number>(0);
  const rafIdRef = useRef<number>();

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    const now = performance.now();
    if (now - lastUpdateRef.current < throttleMs) return;
    
    lastUpdateRef.current = now;
    const state = dragStateRef.current;
    
    const newPosition = { x: clientX, y: clientY };
    const delta = {
      x: newPosition.x - state.currentPosition.x,
      y: newPosition.y - state.currentPosition.y
    };
    
    state.currentPosition = newPosition;
    onDrag?.(newPosition, delta);
  }, [onDrag, throttleMs]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const position = { x: e.clientX, y: e.clientY };
    dragStateRef.current = {
      isDragging: true,
      startPosition: position,
      currentPosition: position
    };
    
    onDragStart?.(position);
    
    // Capture pointer for better tracking
    (e.target as Element).setPointerCapture(e.pointerId);
  }, [onDragStart]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragStateRef.current.isDragging) return;
    
    e.preventDefault();
    
    // Use requestAnimationFrame for smooth updates
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    rafIdRef.current = requestAnimationFrame(() => {
      updatePosition(e.clientX, e.clientY);
    });
  }, [updatePosition]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!dragStateRef.current.isDragging) return;
    
    e.preventDefault();
    
    const finalPosition = { x: e.clientX, y: e.clientY };
    dragStateRef.current.isDragging = false;
    
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    onDragEnd?.(finalPosition);
    
    // Release pointer capture
    (e.target as Element).releasePointerCapture(e.pointerId);
  }, [onDragEnd]);

  // Touch events for mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const position = { x: touch.clientX, y: touch.clientY };
    
    dragStateRef.current = {
      isDragging: true,
      startPosition: position,
      currentPosition: position
    };
    
    onDragStart?.(position);
  }, [onDragStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragStateRef.current.isDragging || e.touches.length !== 1) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    rafIdRef.current = requestAnimationFrame(() => {
      updatePosition(touch.clientX, touch.clientY);
    });
  }, [updatePosition]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!dragStateRef.current.isDragging) return;
    
    e.preventDefault();
    
    dragStateRef.current.isDragging = false;
    
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    // Use last known position for touch end
    onDragEnd?.(dragStateRef.current.currentPosition);
  }, [onDragEnd]);

  return {
    dragHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isDragging: dragStateRef.current.isDragging
  };
};
