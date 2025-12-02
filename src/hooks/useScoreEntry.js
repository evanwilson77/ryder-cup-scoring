import { useCallback } from 'react';

/**
 * Custom hook for managing score entry with increment/decrement logic
 * @param {number} par - The par for the current hole
 * @param {number} min - Minimum allowed score (default: 1)
 * @param {number} max - Maximum allowed score (default: 15)
 * @returns {Object} - { increment, decrement }
 */
export function useScoreEntry(par, min = 1, max = 15) {
  // Increment score (start at par if null/empty)
  const increment = useCallback((currentScore) => {
    if (!currentScore || currentScore === '') {
      return par;
    }
    const score = parseInt(currentScore, 10);
    return score >= max ? max : score + 1;
  }, [par, max]);

  // Decrement score (start at par if null/empty)
  const decrement = useCallback((currentScore) => {
    if (!currentScore || currentScore === '') {
      return par;
    }
    const score = parseInt(currentScore, 10);
    return score <= min ? min : score - 1;
  }, [par, min]);

  return { increment, decrement };
}
