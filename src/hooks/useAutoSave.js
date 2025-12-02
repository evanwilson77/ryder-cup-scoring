import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for auto-saving data with debouncing
 * @param {Function} saveFn - The async function to call for saving
 * @param {number} delay - Debounce delay in milliseconds (default: 1000)
 * @returns {Object} - { isSaving, save, cancel }
 */
export function useAutoSave(saveFn, delay = 1000) {
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef(null);

  // Cancel any pending save
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Trigger a debounced save
  const save = useCallback((...args) => {
    // Cancel any existing timeout
    cancel();

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveFn(...args);
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        setIsSaving(false);
        timeoutRef.current = null;
      }
    }, delay);
  }, [saveFn, delay, cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return { isSaving, save, cancel };
}
