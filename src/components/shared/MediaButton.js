import React, { useState } from 'react';
import { CameraIcon } from '@heroicons/react/24/outline';
import MediaUploader from '../media/MediaUploader';
import './MediaButton.css';

/**
 * Floating media button component
 * Provides quick access to media upload functionality
 *
 * @param {string} tournamentId - Tournament ID
 * @param {string} roundId - Round ID
 * @param {number} holeNumber - Current hole number
 * @param {string} playerId - Player ID (optional)
 * @param {string} category - Media category (default: 'action')
 * @param {string} className - Additional CSS classes
 */
function MediaButton({
  tournamentId,
  roundId,
  holeNumber,
  playerId,
  category = 'action',
  className = ''
}) {
  const [showMediaUploader, setShowMediaUploader] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowMediaUploader(true)}
        className={`floating-media-button ${className}`}
        title="Add Photo or Video"
      >
        <CameraIcon className="icon" />
      </button>

      {showMediaUploader && (
        <MediaUploader
          tournamentId={tournamentId}
          roundId={roundId}
          holeNumber={holeNumber}
          playerId={playerId}
          category={category}
          onUploadComplete={() => setShowMediaUploader(false)}
          onClose={() => setShowMediaUploader(false)}
        />
      )}
    </>
  );
}

export default MediaButton;
