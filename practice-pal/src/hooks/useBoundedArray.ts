import { useState, useCallback } from 'react';

/**
 * useBoundedArray
 * Maintains an array limited to a maximum length. Returns the array and a push function.
 */
export function useBoundedArray<T>(maxLength: number): [T[], (item: T | ((prev: T[]) => T)) => void] {
  const [arr, setArr] = useState<T[]>([]);

  const push = useCallback((item: T | ((prev: T[]) => T)) => {
    setArr(prev => {
      const value = typeof item === 'function' ? (item as (p: T[]) => T)(prev) : item;
      const next = [...prev, value];
      if (next.length > maxLength) next.shift();
      return next;
    });
  }, [maxLength]);

  return [arr, push];
}
