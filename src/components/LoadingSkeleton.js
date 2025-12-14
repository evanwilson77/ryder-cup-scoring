import React from 'react';
import PropTypes from 'prop-types';
import './LoadingSkeleton.css';

/**
 * Reusable loading skeleton components
 * Provides better UX than blank screens or spinners
 */

export const SkeletonText = ({ width = '100%', height = '1rem' }) => (
  <div
    className="skeleton skeleton-text"
    style={{ width, height }}
  />
);

SkeletonText.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string
};

export const SkeletonCircle = ({ size = '3rem' }) => (
  <div
    className="skeleton skeleton-circle"
    style={{ width: size, height: size }}
  />
);

SkeletonCircle.propTypes = {
  size: PropTypes.string
};

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <SkeletonText width="60%" height="1.5rem" />
    <SkeletonText width="100%" height="1rem" />
    <SkeletonText width="80%" height="1rem" />
    <div className="skeleton-card-footer">
      <SkeletonText width="30%" height="0.875rem" />
      <SkeletonText width="30%" height="0.875rem" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="skeleton-table">
    <div className="skeleton-table-header">
      {Array.from({ length: columns }, (_, i) => (
        <SkeletonText key={i} width="80%" height="0.875rem" />
      ))}
    </div>
    {Array.from({ length: rows }, (_, rowIdx) => (
      <div key={rowIdx} className="skeleton-table-row">
        {Array.from({ length: columns }, (_, colIdx) => (
          <SkeletonText key={colIdx} width="70%" height="0.875rem" />
        ))}
      </div>
    ))}
  </div>
);

SkeletonTable.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number
};

export const TournamentListSkeleton = () => (
  <div className="skeleton-tournament-list">
    {Array.from({ length: 3 }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const ScorecardSkeleton = () => (
  <div className="skeleton-scorecard">
    <div className="skeleton-scorecard-header">
      <SkeletonText width="200px" height="1.5rem" />
      <SkeletonText width="150px" height="1rem" />
    </div>
    <SkeletonTable rows={3} columns={11} />
  </div>
);

export const LeaderboardSkeleton = () => (
  <div className="skeleton-leaderboard">
    <SkeletonText width="300px" height="2rem" />
    <div style={{ marginTop: '1.5rem' }}>
      <SkeletonTable rows={8} columns={5} />
    </div>
  </div>
);
