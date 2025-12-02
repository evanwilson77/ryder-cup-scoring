import imageCompression from 'browser-image-compression';

// Quality Presets for Image Compression
export const COMPRESSION_PRESETS = {
  HIGH: {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    initialQuality: 0.85,
    description: 'High quality, ~50% reduction'
  },
  MEDIUM: {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    initialQuality: 0.70,
    description: 'Good quality, ~72% reduction'
  },
  LOW: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1280,
    initialQuality: 0.60,
    description: 'Acceptable quality, ~80% reduction'
  },
  MOBILE: {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1024,
    initialQuality: 0.50,
    description: 'Mobile optimized, ~86% reduction'
  }
};

// Video Compression Presets
export const VIDEO_PRESETS = {
  HIGH: {
    maxSizeMB: 20,
    videoBitsPerSecond: 5000000,    // 5 Mbps
    width: 1920,
    height: 1080,
    frameRate: 30,
    description: 'High quality 1080p, ~5 MB/sec'
  },
  MEDIUM: {
    maxSizeMB: 10,
    videoBitsPerSecond: 2500000,    // 2.5 Mbps
    width: 1280,
    height: 720,
    frameRate: 30,
    description: 'Good quality 720p, ~2.5 MB/sec'
  },
  LOW: {
    maxSizeMB: 5,
    videoBitsPerSecond: 1500000,    // 1.5 Mbps
    width: 854,
    height: 480,
    frameRate: 30,
    description: 'Acceptable 480p, ~1.5 MB/sec'
  },
  MOBILE: {
    maxSizeMB: 3,
    videoBitsPerSecond: 1000000,    // 1 Mbps
    width: 640,
    height: 360,
    frameRate: 24,
    description: 'Mobile optimized 360p, ~1 MB/sec'
  }
};

/**
 * Compress a photo file
 * @param {File} file - The image file to compress
 * @param {string} preset - Preset name (HIGH, MEDIUM, LOW, MOBILE)
 * @returns {Promise<File>} Compressed image file
 */
export async function compressPhoto(file, preset = 'MEDIUM') {
  const options = {
    ...COMPRESSION_PRESETS[preset],
    useWebWorker: true,
    fileType: 'image/jpeg'
  };

  try {
    const compressed = await imageCompression(file, options);
    const originalMB = (file.size / 1024 / 1024).toFixed(2);
    const compressedMB = (compressed.size / 1024 / 1024).toFixed(2);
    const savings = ((1 - compressed.size / file.size) * 100).toFixed(1);

    console.log(`Compressed ${originalMB}MB → ${compressedMB}MB (${savings}% reduction)`);

    return compressed;
  } catch (error) {
    console.error('Compression failed, using original:', error);
    return file; // Fallback to original
  }
}

/**
 * Auto-detect best preset based on file size and device
 * @param {number} fileSize - File size in bytes
 * @param {boolean} isMobile - Whether device is mobile
 * @returns {string} Recommended preset name
 */
export function getRecommendedPreset(fileSize, isMobile = false) {
  const sizeMB = fileSize / 1024 / 1024;

  if (isMobile) {
    return 'MOBILE'; // Always use mobile preset on mobile devices
  }

  if (sizeMB < 2) {
    return 'HIGH'; // Small files can stay higher quality
  } else if (sizeMB < 5) {
    return 'MEDIUM'; // Medium files need more compression
  } else {
    return 'LOW'; // Large files need aggressive compression
  }
}

/**
 * Detect if device is mobile
 * @returns {boolean}
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Start video recording with compression
 * @param {string} preset - Preset name (HIGH, MEDIUM, LOW, MOBILE)
 * @returns {Promise<{mediaRecorder: MediaRecorder, stream: MediaStream}>}
 */
export async function startVideoRecording(preset = 'MEDIUM') {
  const config = VIDEO_PRESETS[preset];

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: config.width },
      height: { ideal: config.height },
      frameRate: { ideal: config.frameRate }
    },
    audio: true
  });

  // Use WebM with VP9 codec (better compression than H.264)
  let mimeType = 'video/webm;codecs=vp9';

  // Fallback to VP8 if VP9 not supported
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
  }

  // Fallback to H.264 if WebM not supported (Safari)
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4;codecs=h264';
  }

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: config.videoBitsPerSecond
  });

  return { mediaRecorder, stream };
}

/**
 * Validate video file
 * @param {File} file - Video file to validate
 * @param {number} maxDuration - Max duration in seconds
 * @returns {Promise<{duration: number, width: number, height: number}>}
 */
export async function validateVideo(file, maxDuration = 60) {
  const config = VIDEO_PRESETS.MEDIUM;
  const maxSize = config.maxSizeMB * 1024 * 1024;

  // Check duration and size
  const metadata = await new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      });
    };

    video.onerror = () => reject(new Error('Invalid video file'));
    video.src = URL.createObjectURL(file);
  });

  // Check duration
  if (metadata.duration > maxDuration) {
    throw new Error(
      `Video must be under ${maxDuration} seconds (yours is ${Math.round(metadata.duration)}s)`
    );
  }

  // Check size - if too large, need compression
  if (file.size > maxSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    const maxMB = (maxSize / 1024 / 1024).toFixed(0);

    throw new Error(
      `Video must be under ${maxMB}MB (yours is ${sizeMB}MB). ` +
      `Please use the camera to record, or compress your video before uploading.`
    );
  }

  return metadata;
}

/**
 * Generate a thumbnail from a video file
 * @param {File} videoFile - Video file
 * @param {number} seekTime - Time in seconds to capture thumbnail
 * @returns {Promise<Blob>} Thumbnail image as blob
 */
export async function generateVideoThumbnail(videoFile, seekTime = 1) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(seekTime, video.duration / 2);
    });

    video.addEventListener('seeked', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(video.src);
        resolve(blob);
      }, 'image/jpeg', 0.7);
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to generate thumbnail'));
    });

    video.src = URL.createObjectURL(videoFile);
  });
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration for display
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1:23")
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {string[]} allowedTypes - Allowed MIME types
 * @returns {boolean}
 */
export function validateFileType(file, allowedTypes) {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', ''));
    }
    return file.type === type;
  });
}
