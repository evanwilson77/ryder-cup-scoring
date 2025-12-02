import React, { useState, useEffect } from 'react';
import { PhotoIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import MediaThumbnail from './MediaThumbnail';
import MediaViewer from './MediaViewer';
import MediaUploader from './MediaUploader';
import { subscribeToTournamentMedia, deleteMedia } from '../../firebase/mediaServices';
import { useAuth } from '../../contexts/AuthContext';
import './MediaGallery.css';

function MediaGallery({ tournamentId, roundId = null, showUploadButton = true, category = null }) {
  const { isAdmin } = useAuth();
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, photo, video
  const [filterCategory, setFilterCategory] = useState(category || 'all');
  const [filterRound, setFilterRound] = useState(roundId || 'all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToTournamentMedia(tournamentId, (mediaData) => {
      setMedia(mediaData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tournamentId]);

  useEffect(() => {
    let filtered = [...media];

    // Filter by round
    if (filterRound !== 'all') {
      filtered = filtered.filter(m => m.roundId === filterRound);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.type === filterType);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(m => m.category === filterCategory);
    }

    setFilteredMedia(filtered);
  }, [media, filterType, filterCategory, filterRound]);

  const handleMediaClick = (mediaItem) => {
    setSelectedMedia(mediaItem);
  };

  const handleCloseViewer = () => {
    setSelectedMedia(null);
  };

  const handleDelete = async (mediaItem) => {
    if (!window.confirm('Are you sure you want to delete this media?')) {
      return;
    }

    try {
      await deleteMedia(mediaItem.docId, mediaItem.storageUrl, mediaItem.thumbnailUrl);
      // Media will be removed from list via real-time subscription
    } catch (error) {
      alert('Failed to delete media: ' + error.message);
    }
  };

  const handleUploadComplete = () => {
    setShowUploader(false);
    // Media will appear via real-time subscription
  };

  const getUniqueRounds = () => {
    const rounds = [...new Set(media.map(m => m.roundId).filter(Boolean))];
    return rounds.sort();
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(media.map(m => m.category).filter(Boolean))];
    return categories.sort();
  };

  if (loading) {
    return (
      <div className="media-gallery-loading">
        <div className="spinner"></div>
        <p>Loading media...</p>
      </div>
    );
  }

  return (
    <div className="media-gallery">
      <div className="media-gallery-header">
        <div className="header-left">
          <PhotoIcon className="gallery-icon" />
          <div>
            <h3>Media Gallery</h3>
            <p className="media-count">
              {filteredMedia.length} {filteredMedia.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`button secondary small filter-button ${showFilters ? 'active' : ''}`}
          >
            <FunnelIcon className="icon" />
            Filters
          </button>

          {showUploadButton && (
            <button
              onClick={() => setShowUploader(true)}
              className="button primary small"
            >
              <PlusIcon className="icon" />
              Add Media
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="media-filters">
          <div className="filter-group">
            <label>Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="photo">Photos</option>
              <option value="video">Videos</option>
            </select>
          </div>

          {getUniqueCategories().length > 0 && (
            <div className="filter-group">
              <label>Category</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {getUniqueCategories().map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!roundId && getUniqueRounds().length > 0 && (
            <div className="filter-group">
              <label>Round</label>
              <select value={filterRound} onChange={(e) => setFilterRound(e.target.value)}>
                <option value="all">All Rounds</option>
                {getUniqueRounds().map((rid, index) => (
                  <option key={rid} value={rid}>
                    Round {index + 1}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {filteredMedia.length === 0 ? (
        <div className="no-media">
          <PhotoIcon className="no-media-icon" />
          <h4>No Media Yet</h4>
          <p>
            {media.length === 0
              ? 'Upload photos and videos to capture tournament memories'
              : 'No media matches the selected filters'}
          </p>
          {showUploadButton && media.length === 0 && (
            <button
              onClick={() => setShowUploader(true)}
              className="button primary"
            >
              <PlusIcon className="icon" />
              Add First Media
            </button>
          )}
        </div>
      ) : (
        <div className="media-grid">
          {filteredMedia.map(mediaItem => (
            <MediaThumbnail
              key={mediaItem.id}
              media={mediaItem}
              onClick={handleMediaClick}
              onDelete={isAdmin ? handleDelete : null}
              showDelete={isAdmin}
            />
          ))}
        </div>
      )}

      {selectedMedia && (
        <MediaViewer
          media={selectedMedia}
          allMedia={filteredMedia}
          onClose={handleCloseViewer}
          onDelete={isAdmin ? handleDelete : null}
        />
      )}

      {showUploader && (
        <MediaUploader
          tournamentId={tournamentId}
          roundId={roundId}
          category={category}
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploader(false)}
        />
      )}
    </div>
  );
}

export default MediaGallery;
