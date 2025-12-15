import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import './PullToRefresh.css';

function PullToRefresh({ distance }) {
  const isVisible = distance > 30;
  const progress = Math.min((distance / 80) * 100, 100);
  const isReady = progress >= 100;

  // Rotation increases as you pull, completing 180deg when ready
  const rotation = Math.min((distance / 80) * 180, 180);

  return (
    <div className={`pull-to-refresh ${isVisible ? 'visible' : ''} ${isReady ? 'ready' : ''}`}>
      <div className="pull-to-refresh-content">
        {/* Progress circle */}
        <div className="progress-circle">
          <svg className="progress-ring" width="50" height="50">
            <circle
              className="progress-ring-circle"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              r="20"
              cx="25"
              cy="25"
              style={{
                strokeDasharray: `${2 * Math.PI * 20}`,
                strokeDashoffset: `${2 * Math.PI * 20 * (1 - progress / 100)}`,
              }}
            />
          </svg>

          {/* Refresh icon that rotates */}
          <div
            className="refresh-icon"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <ArrowPathIcon />
          </div>
        </div>

        {/* Text indicator */}
        <div className="pull-to-refresh-text">
          {isReady ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      </div>
    </div>
  );
}

export default PullToRefresh;
