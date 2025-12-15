import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import './BottomSheet.css';

/**
 * BottomSheet - Mobile-friendly modal that slides up from the bottom
 * Better UX than traditional modals on mobile devices
 *
 * @param {boolean} isOpen - Whether the bottom sheet is open
 * @param {function} onClose - Callback when bottom sheet is closed
 * @param {string} title - Title displayed at the top of the sheet
 * @param {ReactNode} children - Content to display in the sheet
 * @param {number} maxHeight - Maximum height as percentage of viewport (default 90)
 */
function BottomSheet({ isOpen, onClose, title, children, maxHeight = 90 }) {
  const sheetRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when sheet is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Swipe down to close
  const handleSwipeDown = () => {
    onClose();
  };

  const swipeHandlers = useSwipeGestures(
    null, // No swipe left
    null, // No swipe right
    isOpen
  );

  // Enhanced swipe handling for downward swipes
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);

    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) { // Only allow downward drag
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const deltaY = currentY - startY;

    // If dragged down more than 100px, close the sheet
    if (deltaY > 100) {
      onClose();
    }

    // Reset position
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-backdrop" onClick={handleBackdropClick}>
      <div
        ref={sheetRef}
        className={`bottom-sheet ${isOpen ? 'open' : ''}`}
        style={{ maxHeight: `${maxHeight}vh` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...swipeHandlers}
      >
        {/* Drag handle */}
        <div className="bottom-sheet-handle">
          <div className="handle-bar"></div>
        </div>

        {/* Header */}
        <div className="bottom-sheet-header">
          <h2>{title}</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <XMarkIcon className="icon" />
          </button>
        </div>

        {/* Content */}
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default BottomSheet;
