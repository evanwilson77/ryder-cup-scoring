import React from 'react';
import { PlayIcon, TrashIcon } from '@heroicons/react/24/solid';
import { formatDuration } from '../../utils/mediaUtils';
import './MediaThumbnail.css';

function MediaThumbnail({ media, onClick, onDelete, showDelete = false }) {
  const handleClick = () => {
    if (onClick) {
      onClick(media);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(media);
    }
  };

  return (
    <div className="media-thumbnail" onClick={handleClick}>
      <div className="thumbnail-image-container">
        {media.type === 'photo' && (
          <img
            src={media.downloadUrl}
            alt={media.caption || 'Photo'}
            className="thumbnail-image"
            loading="lazy"
          />
        )}

        {media.type === 'video' && (
          <>
            {media.thumbnailUrl ? (
              <img
                src={media.thumbnailUrl}
                alt={media.caption || 'Video'}
                className="thumbnail-image"
                loading="lazy"
              />
            ) : (
              <video
                src={media.downloadUrl}
                className="thumbnail-image"
                preload="metadata"
              />
            )}
            <div className="video-overlay">
              <PlayIcon className="play-icon" />
              {media.duration && (
                <span className="video-duration">
                  {formatDuration(media.duration)}
                </span>
              )}
            </div>
          </>
        )}

        {showDelete && (
          <button
            className="delete-button"
            onClick={handleDelete}
            title="Delete media"
          >
            <TrashIcon className="delete-icon" />
          </button>
        )}
      </div>

      {media.caption && (
        <div className="thumbnail-caption">
          <p>{media.caption}</p>
        </div>
      )}

      <div className="thumbnail-info">
        {media.holeNumber && (
          <span className="hole-badge">Hole {media.holeNumber}</span>
        )}
        {media.category && media.category !== 'general' && (
          <span className="category-badge">{media.category}</span>
        )}
      </div>
    </div>
  );
}

export default MediaThumbnail;
