import React from 'react';
import './HoleNavigationGrid.css';

/**
 * Hole navigation grid component
 * Displays 18 holes as clickable buttons with status indicators
 *
 * @param {number} currentHole - Currently selected hole index (0-17)
 * @param {Function} onHoleSelect - Callback when hole is selected (holeIndex) => void
 * @param {Array} completedHoles - Array of booleans indicating completed status for each hole
 * @param {string} title - Optional title for the grid (default: "Holes")
 * @param {string} className - Additional CSS classes
 */
function HoleNavigationGrid({
  currentHole,
  onHoleSelect,
  completedHoles = [],
  title = 'Holes',
  className = ''
}) {
  const holes = Array.from({ length: 18 }, (_, i) => i);

  return (
    <div className={`hole-navigation ${className}`}>
      {title && <h3>{title}</h3>}
      <div className="holes-grid">
        {holes.map((holeIndex) => (
          <button
            key={holeIndex}
            onClick={() => onHoleSelect(holeIndex)}
            className={`hole-btn
              ${holeIndex === currentHole ? 'current' : ''}
              ${completedHoles[holeIndex] ? 'completed' : ''}
            `}
          >
            {holeIndex + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default HoleNavigationGrid;
