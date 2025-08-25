import { useEffect, useRef } from 'react';

/**
 * useInterval
 * A declarative setInterval replacement that cleans up automatically.
 *
 * @param callback Function to run on every tick
 * @param delay Interval in ms. If null, the interval is paused.
 * @param immediate If true, run callback once immediately before the first delay
 */
export function useInterval(callback: () => void, delay: number | null, immediate = false) {
  const savedCallback = useRef(callback);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    if (immediate) {
      savedCallback.current();
    }

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay, immediate]);
}
