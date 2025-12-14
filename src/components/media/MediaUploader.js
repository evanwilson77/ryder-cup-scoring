import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { CameraIcon, PhotoIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  compressPhoto,
  getRecommendedPreset,
  isMobileDevice,
  validateVideo,
  generateVideoThumbnail,
  formatFileSize,
  validateFileType
} from '../../utils/mediaUtils';
import { uploadPhoto, uploadVideo } from '../../firebase/mediaServices';
import './MediaUploader.css';

function MediaUploader({
  tournamentId,
  roundId = null,
  holeNumber = null,
  playerId = null,
  playerIds = [],
  matchId = null,
  category = 'general',
  onUploadComplete,
  onClose
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploadType, setUploadType] = useState(null); // 'photo' or 'video'
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const videoPreviewRef = useRef(null);

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateFileType(file, ['image/*'])) {
      setError('Please select an image file');
      return;
    }

    setSelectedFile(file);
    setUploadType('photo');
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateFileType(file, ['image/*'])) {
      setError('Please select an image file');
      return;
    }

    setSelectedFile(file);
    setUploadType('photo');
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateFileType(file, ['video/*'])) {
      setError('Please select a video file');
      return;
    }

    // Validate video
    validateVideo(file, 60)
      .then(() => {
        setSelectedFile(file);
        setUploadType('video');
        setError(null);

        // Create preview
        const url = URL.createObjectURL(file);
        setFilePreview(url);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  const startVideoRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true
      });

      streamRef.current = stream;

      // Show preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: isMobileDevice() ? 1000000 : 2500000
      });

      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const file = new File([blob], `video_${Date.now()}.webm`, { type: mimeType });

        setSelectedFile(file);
        setUploadType('video');
        setFilePreview(URL.createObjectURL(file));
        setRecording(false);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);

      // Update recording time
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 60) {
            stopVideoRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const metadata = {
        tournamentId,
        roundId,
        caption,
        category,
        holeNumber,
        playerId,
        playerIds,
        matchId,
        uploadedBy: 'user'
      };

      if (uploadType === 'photo') {
        // Compress photo
        setUploadProgress(20);
        const preset = getRecommendedPreset(selectedFile.size, isMobileDevice());
        const originalSize = selectedFile.size;
        const compressedFile = await compressPhoto(selectedFile, preset);

        setUploadProgress(50);

        // Upload
        await uploadPhoto(compressedFile, {
          ...metadata,
          originalSize,
          compressed: compressedFile.size < originalSize,
          compressionRatio: compressedFile.size / originalSize
        });

        setUploadProgress(100);
      } else if (uploadType === 'video') {
        // Generate thumbnail
        setUploadProgress(20);
        const thumbnailBlob = await generateVideoThumbnail(selectedFile);

        setUploadProgress(40);

        // Get video duration
        const video = document.createElement('video');
        video.src = URL.createObjectURL(selectedFile);
        await new Promise(resolve => {
          video.onloadedmetadata = resolve;
        });
        const duration = video.duration;
        URL.revokeObjectURL(video.src);

        setUploadProgress(60);

        // Upload
        await uploadVideo(selectedFile, {
          ...metadata,
          duration
        }, thumbnailBlob);

        setUploadProgress(100);
      }

      // Success
      setTimeout(() => {
        if (onUploadComplete) {
          onUploadComplete();
        }
        handleClose();
      }, 500);

    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Cleanup
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    if (filePreview && uploadType === 'video') {
      URL.revokeObjectURL(filePreview);
    }

    if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadType(null);
    setCaption('');
    setError(null);
    setRecording(false);
  };

  return (
    <div className="media-uploader-overlay">
      <div className="media-uploader-modal">
        <div className="media-uploader-header">
          <h3>Add Media</h3>
          <button onClick={handleClose} className="close-button">
            <XMarkIcon className="icon" />
          </button>
        </div>

        <div className="media-uploader-content">
          {!selectedFile && !recording && (
            <div className="upload-options">
              <button
                className="upload-option"
                onClick={() => fileInputRef.current.click()}
              >
                <PhotoIcon className="option-icon" />
                <span>Choose Photo</span>
              </button>

              <button
                className="upload-option"
                onClick={() => cameraInputRef.current.click()}
              >
                <CameraIcon className="option-icon" />
                <span>Take Photo</span>
              </button>

              <button
                className="upload-option"
                onClick={() => videoInputRef.current.click()}
              >
                <VideoCameraIcon className="option-icon" />
                <span>Choose Video</span>
              </button>

              <button
                className="upload-option"
                onClick={startVideoRecording}
              >
                <VideoCameraIcon className="option-icon" />
                <span>Record Video</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraPhoto}
                style={{ display: 'none' }}
              />

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {recording && (
            <div className="recording-view">
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                className="video-preview"
              />
              <div className="recording-indicator">
                <span className="recording-dot"></span>
                <span>Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
              </div>
              <button
                onClick={stopVideoRecording}
                className="button primary stop-recording-button"
              >
                Stop Recording
              </button>
            </div>
          )}

          {selectedFile && !recording && (
            <div className="preview-view">
              {uploadType === 'photo' && (
                <img src={filePreview} alt="Preview" className="media-preview" />
              )}

              {uploadType === 'video' && (
                <video src={filePreview} controls className="media-preview" />
              )}

              <div className="file-info">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">{formatFileSize(selectedFile.size)}</span>
              </div>

              <div className="caption-input">
                <label>Caption (optional)</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  rows={3}
                  maxLength={200}
                />
                <span className="char-count">{caption.length}/200</span>
              </div>

              {error && (
                <div className="error-message">{error}</div>
              )}

              {uploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="progress-text">{uploadProgress}%</span>
                </div>
              )}

              <div className="action-buttons">
                <button
                  onClick={handleCancel}
                  className="button secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="button primary"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

MediaUploader.propTypes = {
  /** Tournament ID */
  tournamentId: PropTypes.string.isRequired,
  /** Round ID (optional) */
  roundId: PropTypes.string,
  /** Current hole number (optional) */
  holeNumber: PropTypes.number,
  /** Player ID (optional) */
  playerId: PropTypes.string,
  /** Array of player IDs (optional, for team photos) */
  playerIds: PropTypes.arrayOf(PropTypes.string),
  /** Match ID (optional) */
  matchId: PropTypes.string,
  /** Media category */
  category: PropTypes.string,
  /** Callback when upload completes */
  onUploadComplete: PropTypes.func,
  /** Callback when uploader is closed */
  onClose: PropTypes.func
};

export default MediaUploader;
