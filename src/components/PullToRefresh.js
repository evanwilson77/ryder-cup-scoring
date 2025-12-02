import React from 'react';

function PullToRefresh({ distance }) {
  const isVisible = distance > 30;
  const progress = Math.min((distance / 80) * 100, 100);

  return (
    <div className={`pull-to-refresh ${isVisible ? 'visible' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div className="spinner" style={{
          width: '24px',
          height: '24px',
          borderWidth: '3px',
          opacity: progress / 100
        }}></div>
        <span>{progress >= 100 ? 'Release to refresh' : 'Pull to refresh'}</span>
      </div>
    </div>
  );
}

export default PullToRefresh;
