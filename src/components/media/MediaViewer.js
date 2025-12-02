import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { formatDuration, formatFileSize } from '../../utils/mediaUtils';
import './MediaViewer.css';

function MediaViewer({ media, allMedia = [], onClose, onDelete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMedia, setCurrentMedia] = useState(media);

  useEffect(() => {
    const index = allMedia.findIndex(m => m.id === media.id);
    setCurrentIndex(index !== -1 ? index : 0);
  }, [media, allMedia]);

  useEffect(() => {
    if (allMedia.length > 0 && currentIndex >= 0 && currentIndex < allMedia.length) {
      setCurrentMedia(allMedia[currentIndex]);
    }
  }, [currentIndex, allMedia]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, allMedia.length]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < allMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDelete = async () => {
    if (onDelete && window.confirm('Are you sure you want to delete this media?')) {
      await onDelete(currentMedia);
      if (allMedia.length > 1) {
        if (currentIndex === allMedia.length - 1) {
          handlePrevious();
        } else {
          // Stay at same index, will show next media
        }
      } else {
        onClose();
      }
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentMedia.downloadUrl;
    link.download = currentMedia.fileName || `media_${currentMedia.id}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatUploadDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentMedia) return null;

  return (
    <div className="media-viewer-overlay" onClick={onClose}>
      <div className="media-viewer-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="media-viewer-header">
          <div className="viewer-title">
            {allMedia.length > 1 && (
              <span className="media-counter">
                {currentIndex + 1} / {allMedia.length}
              </span>
            )}
          </div>

          <div className="viewer-actions">
            <button
              onClick={handleDownload}
              className="viewer-button"
              title="Download"
            >
              <ArrowDownTrayIcon className="icon" />
            </button>

            {onDelete && (
              <button
                onClick={handleDelete}
                className="viewer-button delete"
                title="Delete"
              >
                <TrashIcon className="icon" />
              </button>
            )}

            <button
              onClick={onClose}
              className="viewer-button close"
              title="Close (Esc)"
            >
              <XMarkIcon className="icon" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="media-viewer-content">
          {allMedia.length > 1 && (
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="nav-button prev"
              title="Previous (←)"
            >
              <ChevronLeftIcon className="icon" />
            </button>
          )}

          <div className="media-display">
            {currentMedia.type === 'photo' && (
              <img
                src={currentMedia.downloadUrl}
                alt={currentMedia.caption || 'Photo'}
                className="viewer-image"
              />
            )}

            {currentMedia.type === 'video' && (
              <video
                src={currentMedia.downloadUrl}
                controls
                autoPlay
                className="viewer-video"
              />
            )}
          </div>

          {allMedia.length > 1 && (
            <button
              onClick={handleNext}
              disabled={currentIndex === allMedia.length - 1}
              className="nav-button next"
              title="Next (→)"
            >
              <ChevronRightIcon className="icon" />
            </button>
          )}
        </div>

        {/* Info Panel */}
        <div className="media-viewer-info">
          {currentMedia.caption && (
            <div className="media-caption">
              <p>{currentMedia.caption}</p>
            </div>
          )}

          <div className="media-metadata">
            <div className="metadata-row">
              <span className="metadata-label">Type:</span>
              <span className="metadata-value">
                {currentMedia.type === 'photo' ? 'Photo' : 'Video'}
                {currentMedia.type === 'video' && currentMedia.duration && (
                  <> ({formatDuration(currentMedia.duration)})</>
                )}
              </span>
            </div>

            {currentMedia.uploadedAt && (
              <div className="metadata-row">
                <span className="metadata-label">Uploaded:</span>
                <span className="metadata-value">
                  {formatUploadDate(currentMedia.uploadedAt)}
                </span>
              </div>
            )}

            {currentMedia.holeNumber && (
              <div className="metadata-row">
                <span className="metadata-label">Hole:</span>
                <span className="metadata-value">Hole {currentMedia.holeNumber}</span>
              </div>
            )}

            {currentMedia.category && currentMedia.category !== 'general' && (
              <div className="metadata-row">
                <span className="metadata-label">Category:</span>
                <span className="metadata-value category-tag">
                  {currentMedia.category}
                </span>
              </div>
            )}

            {currentMedia.fileSize && (
              <div className="metadata-row">
                <span className="metadata-label">Size:</span>
                <span className="metadata-value">{formatFileSize(currentMedia.fileSize)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaViewer;
