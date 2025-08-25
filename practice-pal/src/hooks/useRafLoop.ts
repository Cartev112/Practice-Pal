import { useEffect, useRef } from 'react';

/**
 * useRafLoop
 * Runs the provided callback on every animation frame while `active` is true.
 * Automatically cleans up on dependency change or unmount.
 */
export function useRafLoop(callback: (dt: number) => void, active: boolean) {
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const savedCallback = useRef(callback);

  // Keep latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      return;
    }

    const loop = (time: number) => {
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;
      savedCallback.current(dt);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active]);
}
