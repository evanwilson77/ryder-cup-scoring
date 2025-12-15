import { useSwipeable } from 'react-swipeable';

/**
 * Custom hook for swipe gestures in scoring components
 * @param {Function} onSwipeLeft - Callback for swipe left (next hole)
 * @param {Function} onSwipeRight - Callback for swipe right (previous hole)
 * @param {boolean} enabled - Whether swipe gestures are enabled
 * @returns {Object} Swipeable handlers
 */
export const useSwipeGestures = (onSwipeLeft, onSwipeRight, enabled = true) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (enabled && onSwipeLeft) {
        onSwipeLeft();
      }
    },
    onSwipedRight: () => {
      if (enabled && onSwipeRight) {
        onSwipeRight();
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackTouch: true,
    trackMouse: false, // Only track touch, not mouse
    delta: 50, // Min distance for swipe
    swipeDuration: 500, // Max duration for swipe
  });

  return enabled ? handlers : {};
};

export default useSwipeGestures;
