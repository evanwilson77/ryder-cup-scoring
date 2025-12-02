import React from 'react';
import './HoleInfo.css';

/**
 * Reusable HoleInfo component for displaying current hole information
 */
function HoleInfo({
  holeNumber,
  par,
  strokeIndex,
  yardage = null,
  name = null,
  compact = false,
  className = ''
}) {
  return (
    <div className={`hole-info ${compact ? 'compact' : ''} ${className}`}>
      <div className="hole-header">
        <h3>Hole {holeNumber}</h3>
        {name && <span className="hole-name">{name}</span>}
      </div>
      <div className="hole-details">
        <div className="hole-detail-item">
          <span className="label">Par</span>
          <span className="value par">{par}</span>
        </div>
        <div className="hole-detail-item">
          <span className="label">SI</span>
          <span className="value">{strokeIndex}</span>
        </div>
        {yardage && (
          <div className="hole-detail-item">
            <span className="label">Yards</span>
            <span className="value">{yardage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default HoleInfo;
