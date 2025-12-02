import { useState, useCallback } from 'react';

/**
 * Custom hook for managing hole-by-hole navigation
 * @param {number} totalHoles - Total number of holes (default: 18)
 * @param {number} initialHole - Starting hole number (default: 1)
 * @param {boolean} zeroIndexed - Whether to use zero-indexed holes (default: false)
 * @returns {Object} - { currentHole, next, previous, goToHole, canNext, canPrev, isFirstHole, isLastHole }
 */
export function useHoleNavigation(totalHoles = 18, initialHole = 1, zeroIndexed = false) {
  const [currentHole, setCurrentHole] = useState(zeroIndexed ? 0 : initialHole);

  const minHole = zeroIndexed ? 0 : 1;
  const maxHole = zeroIndexed ? totalHoles - 1 : totalHoles;

  // Navigate to next hole
  const next = useCallback(() => {
    setCurrentHole(prev => {
      if (prev >= maxHole) return prev;
      return prev + 1;
    });
  }, [maxHole]);

  // Navigate to previous hole
  const previous = useCallback(() => {
    setCurrentHole(prev => {
      if (prev <= minHole) return prev;
      return prev - 1;
    });
  }, [minHole]);

  // Navigate to specific hole
  const goToHole = useCallback((holeNumber) => {
    if (holeNumber >= minHole && holeNumber <= maxHole) {
      setCurrentHole(holeNumber);
    }
  }, [minHole, maxHole]);

  const canNext = currentHole < maxHole;
  const canPrev = currentHole > minHole;
  const isFirstHole = currentHole === minHole;
  const isLastHole = currentHole === maxHole;

  return {
    currentHole,
    setCurrentHole,
    next,
    previous,
    goToHole,
    canNext,
    canPrev,
    isFirstHole,
    isLastHole
  };
}
