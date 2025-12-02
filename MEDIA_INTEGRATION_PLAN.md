# Photos & Videos Integration Plan

## Overview
Add photo and video upload/viewing capabilities to tournament rounds, allowing users to capture memorable moments during golf tournaments.

## Quick Summary - Compression Settings

### Photos

**Recommended Configuration:**
```javascript
// Desktop/Web: MEDIUM preset
{
  quality: 0.70,           // 70% JPEG quality
  maxSizeMB: 1,            // Target max 1 MB
  maxWidthOrHeight: 1600,  // Scale down to 1600px
  reduction: ~72%          // Typical compression ratio
}

// Mobile devices: MOBILE preset (auto-detect)
{
  quality: 0.50,           // 50% JPEG quality
  maxSizeMB: 0.3,          // Target max 300 KB
  maxWidthOrHeight: 1024,  // Scale down to 1024px
  reduction: ~86%          // Typical compression ratio
}
```

**Result:** 10MB photo → 1.8MB (desktop) or 0.9MB (mobile)

### Videos

**Recommended Configuration:**
```javascript
// For live camera recording: MEDIUM preset
{
  resolution: 1280x720,     // 720p
  bitrate: 2500000,         // 2.5 Mbps
  frameRate: 30,            // 30 fps
  maxDuration: 60,          // 60 seconds max
  targetSize: ~9-10 MB      // For 30-second clip
}

// Mobile devices: MOBILE preset (auto-detect)
{
  resolution: 640x360,      // 360p
  bitrate: 1000000,         // 1 Mbps
  frameRate: 24,            // 24 fps
  targetSize: ~4 MB         // For 30-second clip
}
```

**Result:** 30-second video → ~9MB (desktop) or ~4MB (mobile)

### Benefits
- **Photos**: 72-86% reduction, 3-6x faster uploads
- **Videos**: 50-75% reduction vs. uncompressed, 2-4x faster uploads
- **Storage costs**: 3-6x reduction
- **Quality**: Excellent for web/mobile viewing

## Data Model

### Firestore Collection: `media`
```javascript
{
  id: "auto-generated",
  tournamentId: "tournament-id",
  roundId: "round-id", // Optional - null for tournament-level media
  type: "photo" | "video",

  // Storage references
  storageUrl: "gs://bucket/path/to/file",
  thumbnailUrl: "gs://bucket/path/to/thumbnail", // For videos
  downloadUrl: "https://...", // Public URL

  // Metadata
  uploadedBy: "user-id-or-name",
  uploadedAt: "ISO-timestamp",
  caption: "optional caption",

  // Context
  category: "action" | "awards" | "ceremony" | "group" | "course" | "general",
  holeNumber: 12, // Optional - which hole this was taken on
  playerId: "player-id", // Optional - featured player
  playerIds: ["id1", "id2"], // Optional array - for group photos/awards
  matchId: "match-id", // Optional - for team formats

  // File info
  fileName: "original-filename.jpg",
  fileSize: 1234567, // bytes
  mimeType: "image/jpeg",
  originalSize: 5000000, // Original size before compression (bytes)

  // Processing info
  compressed: true,
  compressionRatio: 0.4, // Compressed to 40% of original

  // Engagement (future)
  likes: 0,
  views: 0
}
```

### Firebase Storage Structure
```
/tournaments/{tournamentId}/
  /rounds/{roundId}/
    /photos/
      /{mediaId}.jpg
      /{mediaId}_thumb.jpg (auto-generated thumbnail)
    /videos/
      /{mediaId}.mp4
      /{mediaId}_thumb.jpg (video thumbnail)
```

## Compression & Optimization

### Image Compression Options

#### Client-Side (Browser/Mobile)
**Recommended Library**: `browser-image-compression`
```javascript
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 2,              // Max file size in MB
  maxWidthOrHeight: 1920,    // Max dimension (maintains aspect ratio)
  useWebWorker: true,        // Use web worker for better performance
  fileType: 'image/jpeg',    // Convert to JPEG
  initialQuality: 0.85       // JPEG quality (0.1-1.0)
};

const compressedFile = await imageCompression(imageFile, options);
```

**Pros**:
- Immediate compression before upload (saves bandwidth)
- No server processing needed
- Works offline
- User sees real-time progress

**Cons**:
- Drains device battery
- Slower on low-end devices
- Limited format support

#### Alternative: `Compressor.js`
```javascript
import Compressor from 'compressorjs';

new Compressor(file, {
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1920,
  mimeType: 'image/jpeg',
  convertSize: 5000000, // Convert PNG > 5MB to JPEG
  success(result) {
    // Upload compressed file
  },
  error(err) {
    console.error(err.message);
  },
});
```

**Pros**:
- More control over conversion
- Better EXIF handling
- Lighter weight library

#### Alternative: Canvas API (Manual)
```javascript
function compressImage(file, maxWidth = 1920, quality = 0.85) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        } else if (height > maxWidth) {
          width = (width * maxWidth) / height;
          height = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
```

**Pros**:
- No dependencies
- Full control
- Works everywhere

**Cons**:
- More code to maintain
- Strips EXIF data by default
- Must handle edge cases manually

### Video Compression Options

#### Client-Side Options

**Option 1: FFmpeg.wasm** (Most Powerful)
```javascript
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ log: true });
await ffmpeg.load();

// Write input file
ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));

// Compress video
await ffmpeg.run(
  '-i', 'input.mp4',
  '-vcodec', 'libx264',      // H.264 codec
  '-crf', '28',              // Quality (18-28 good, 28=smaller)
  '-preset', 'fast',         // Encoding speed
  '-vf', 'scale=1280:-2',    // Scale to 720p
  '-movflags', '+faststart', // Web optimization
  '-maxrate', '2M',          // Max bitrate
  '-bufsize', '2M',
  'output.mp4'
);

// Read compressed file
const data = ffmpeg.FS('readFile', 'output.mp4');
const compressedVideo = new Blob([data.buffer], { type: 'video/mp4' });
```

**Pros**:
- Industry-standard FFmpeg
- Powerful compression
- Format conversion
- Can generate thumbnails

**Cons**:
- Large library (~30MB)
- Slow on mobile
- High memory usage
- Complex setup

**Option 2: MediaRecorder API** (Record Compressed)
```javascript
// When recording from camera, use lower quality
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
});

const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 2500000 // 2.5 Mbps
});
```

**Pros**:
- Native browser API
- Efficient recording
- Low memory usage

**Cons**:
- Only for live capture
- Can't compress existing videos
- Format support varies

**Option 3: Cloud Functions (Server-Side)**
```javascript
// Client: Upload original, let server compress
const uploadVideo = async (file) => {
  // Upload to temporary location
  const tempRef = ref(storage, `temp/${file.name}`);
  await uploadBytes(tempRef, file);

  // Trigger cloud function
  const compressFunction = httpsCallable(functions, 'compressVideo');
  const result = await compressFunction({
    tempPath: tempRef.fullPath
  });

  // Server handles compression and moves to final location
  return result.data.finalUrl;
};
```

**Firebase Cloud Function** (Node.js):
```javascript
const functions = require('firebase-functions');
const ffmpeg = require('fluent-ffmpeg');
const admin = require('firebase-admin');

exports.compressVideo = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;

  if (!filePath.startsWith('temp/')) return;

  const bucket = admin.storage().bucket();
  const tempFilePath = `/tmp/${Date.now()}_input.mp4`;
  const outputFilePath = `/tmp/${Date.now()}_output.mp4`;

  // Download
  await bucket.file(filePath).download({ destination: tempFilePath });

  // Compress with FFmpeg
  await new Promise((resolve, reject) => {
    ffmpeg(tempFilePath)
      .outputOptions([
        '-vcodec libx264',
        '-crf 28',
        '-preset fast',
        '-vf scale=1280:-2',
        '-maxrate 2M',
        '-bufsize 2M'
      ])
      .on('end', resolve)
      .on('error', reject)
      .save(outputFilePath);
  });

  // Upload compressed version
  const finalPath = filePath.replace('temp/', 'tournaments/');
  await bucket.upload(outputFilePath, { destination: finalPath });

  // Clean up
  await bucket.file(filePath).delete();
});
```

**Pros**:
- Powerful server hardware
- Doesn't drain user device
- Consistent results
- Can run in background

**Cons**:
- Costs more (compute time)
- Slower user experience (wait for processing)
- Requires backend infrastructure
- More complex error handling

### Recommended Approach

#### For Images
**Use `browser-image-compression`** (Client-Side)
- Best balance of size/quality/speed
- Works well on mobile
- Immediate feedback
- No server costs

```javascript
// Implementation in mediaUtils.js

// Quality Presets
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
    description: 'Good quality, ~70% reduction'
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
    description: 'Mobile optimized, ~85% reduction'
  }
};

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

// Auto-detect best preset based on file size and device
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
```

#### For Videos
**Hybrid Approach**:
1. **Mobile/Live Capture**: Use MediaRecorder API with lower bitrate
2. **Uploaded Videos**:
   - **Option A** (Simpler): Set size limit (50MB), let users compress before upload
   - **Option B** (Better UX): Cloud Functions post-processing
   - **Option C** (Middle ground): FFmpeg.wasm for videos < 100MB, reject larger

**Recommended for MVP**: Hybrid approach with MediaRecorder for live capture

```javascript
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
    videoBitsPerSecond: 2500000,    // 2.5 Mbps (Recommended)
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

// For live camera recording (recommended approach)
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

// For uploaded videos - validate and optionally compress with FFmpeg.wasm
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

// Optional: Compress uploaded video with FFmpeg.wasm (advanced)
export async function compressUploadedVideo(file, preset = 'MEDIUM') {
  const config = VIDEO_PRESETS[preset];

  // Only compress if file is large enough to benefit
  if (file.size < config.maxSizeMB * 1024 * 1024) {
    return file; // Already small enough
  }

  // This requires FFmpeg.wasm loaded
  const { createFFmpeg, fetchFile } = await import('@ffmpeg/ffmpeg');
  const ffmpeg = createFFmpeg({
    log: false,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
  });

  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  const inputName = 'input.mp4';
  const outputName = 'output.mp4';

  // Write input file
  ffmpeg.FS('writeFile', inputName, await fetchFile(file));

  // Compress video
  await ffmpeg.run(
    '-i', inputName,
    '-vcodec', 'libx264',
    '-crf', '28',                           // Quality (lower = better, 28 = good balance)
    '-preset', 'veryfast',                   // Encoding speed
    `-vf`, `scale=${config.width}:-2`,      // Scale to target resolution
    '-r', String(config.frameRate),         // Frame rate
    '-maxrate', `${config.videoBitsPerSecond / 1000}k`,
    '-bufsize', `${config.videoBitsPerSecond / 1000}k`,
    '-movflags', '+faststart',              // Web optimization
    '-an',                                   // Remove audio (optional)
    outputName
  );

  // Read compressed file
  const data = ffmpeg.FS('readFile', outputName);
  const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });

  // Clean up
  ffmpeg.FS('unlink', inputName);
  ffmpeg.FS('unlink', outputName);

  return new File([compressedBlob], file.name, { type: 'video/mp4' });
}
```

### Image Compression Quality Comparison

| Quality | Resolution | File Size | Visual Quality | Use Case | Data Usage (10 photos) |
|---------|-----------|-----------|----------------|----------|----------------------|
| 0.95 | 1920px | 70-80% | Excellent | Print/Archive | ~40-50 MB |
| 0.85 | 1920px | 40-50% | Very Good | Desktop viewing | ~25-30 MB |
| **0.70** | 1600px | 25-35% | **Good (Recommended)** | **Web/Mobile** | **~15-20 MB** |
| 0.60 | 1280px | 20-25% | Acceptable | Mobile upload | ~12-15 MB |
| 0.50 | 1024px | 15-20% | Fair | Mobile/slow networks | ~8-12 MB |
| 0.40 | 1024px | 10-15% | Poor | Thumbnails only | ~6-8 MB |

### Video Compression Quality Comparison

| Preset | Resolution | Bitrate | Quality | 30-sec Size | 60-sec Size | Use Case |
|--------|-----------|---------|---------|-------------|-------------|----------|
| HIGH | 1080p (1920x1080) | 5 Mbps | Excellent | ~19 MB | ~38 MB | Desktop/Archive |
| **MEDIUM** | **720p (1280x720)** | **2.5 Mbps** | **Good** | **~9 MB** | **~19 MB** | **Web/Mobile (Recommended)** |
| LOW | 480p (854x480) | 1.5 Mbps | Acceptable | ~6 MB | ~11 MB | Mobile upload |
| MOBILE | 360p (640x360) | 1 Mbps | Fair | ~4 MB | ~8 MB | Slow networks |

**Video Quality Descriptions:**
- **Excellent (1080p, 5 Mbps)**: Crystal clear, suitable for large screens
- **Good (720p, 2.5 Mbps)**: Sharp and clear, great for web/mobile ✅ **Recommended**
- **Acceptable (480p, 1.5 Mbps)**: Decent quality, noticeable softness
- **Fair (360p, 1 Mbps)**: Basic quality, acceptable for small screens only

**Visual Quality Descriptions:**
- **Excellent (0.95)**: Indistinguishable from original on screen
- **Very Good (0.85)**: Minimal artifacts, looks great
- **Good (0.70)**: Very minor artifacts on close inspection, perfectly fine for web
- **Acceptable (0.60)**: Some visible compression, but still clear
- **Fair (0.50)**: Noticeable compression, acceptable for mobile viewing
- **Poor (0.40)**: Obvious compression artifacts, use only for previews

### Real-World Examples (iPhone 14 Pro photo, 12MP)

| Preset | Original Size | Compressed Size | Reduction | Upload Time (4G) |
|--------|--------------|-----------------|-----------|------------------|
| Original | 6.5 MB | 6.5 MB | 0% | ~13 seconds |
| HIGH (0.85) | 6.5 MB | 3.2 MB | 51% | ~6 seconds |
| **MEDIUM (0.70)** | 6.5 MB | **1.8 MB** | **72%** | **~4 seconds** |
| LOW (0.60) | 6.5 MB | 1.3 MB | 80% | ~3 seconds |
| MOBILE (0.50) | 6.5 MB | 0.9 MB | 86% | ~2 seconds |

**Recommendation**: Use **MEDIUM (0.70)** as default
- Best balance of quality and size
- 72% reduction saves significant bandwidth
- Still looks excellent on all devices
- Fast uploads even on mobile data
- Reduces storage costs 3x

### Resolution Recommendations

| Device | Max Width | Use Case |
|--------|-----------|----------|
| 1920px | Desktop/Web viewing | Standard |
| 1280px | Mobile/Tablet | Good balance |
| 800px | Thumbnails | Gallery preview |
| 320px | Small thumbnails | List view |

### Compression Options Summary

#### Image Compression
| Option | Complexity | Performance | Quality | Dependencies | Recommendation |
|--------|-----------|-------------|---------|--------------|----------------|
| browser-image-compression | Low | Good | Excellent | 1 library | ✅ **Best for MVP** |
| Compressor.js | Low | Good | Excellent | 1 library | Good alternative |
| Canvas API | Medium | Good | Good | None | Use if avoiding deps |

#### Video Compression
| Option | Complexity | Performance | Quality | Cost | Recommendation |
|--------|-----------|-------------|---------|------|----------------|
| Size Limit Only | Very Low | N/A | N/A | Free | ✅ **Best for MVP** |
| MediaRecorder API | Low | Excellent | Good | Free | For live capture |
| FFmpeg.wasm | High | Poor (mobile) | Excellent | Free | Advanced use only |
| Cloud Functions | Medium | Excellent | Excellent | $$ | Best UX, add later |

**MVP Recommendation:**

**Images:** `browser-image-compression` with **MEDIUM preset**
- Quality: 0.70
- Max resolution: 1600px
- Target size: ~1 MB
- Reduction: ~72%
- Auto-detect: Use MOBILE preset (0.50, 1024px) on mobile devices

**Videos:** MediaRecorder API with **MEDIUM preset** for live capture
- Resolution: 720p (1280x720)
- Bitrate: 2.5 Mbps
- Target size: ~10 MB for 30-second clip
- Frame rate: 30 fps
- Upload validation: Max 10 MB, 60 seconds

**For Uploaded Videos (not recorded in-app):**
- Validate: Max 10 MB, 60 seconds
- If too large: Reject with message to compress or use camera
- Future: Add FFmpeg.wasm compression or Cloud Functions

**Aggressive Compression Benefits:**
- 72-86% file size reduction (10MB → 1.4-2.8MB)
- 3-6x faster uploads on mobile data
- 3-6x lower storage costs
- Still excellent visual quality for web/mobile viewing
- Better experience on slow networks

### Even More Aggressive Options (Optional)

If you want to reduce file sizes even further:

```javascript
export const COMPRESSION_PRESETS = {
  // ... existing presets ...

  ULTRA_LOW: {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 800,
    initialQuality: 0.40,
    description: 'Ultra compressed, ~90% reduction'
  },
  THUMBNAIL: {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 640,
    initialQuality: 0.35,
    description: 'Thumbnail quality, ~95% reduction'
  }
};
```

**Extreme Compression Results:**
- **ULTRA_LOW**: 10MB → 1MB (90% reduction, ~2 seconds upload on 4G)
  - Still acceptable for gallery viewing on phones
  - Noticeable compression artifacts on large screens
  - Good for slow networks or data-limited users

- **THUMBNAIL**: 10MB → 0.5MB (95% reduction, ~1 second upload)
  - Only for preview/thumbnail purposes
  - Visible compression artifacts
  - Best for situations where you need maximum speed

### User Settings (Optional Future Enhancement)

Allow users to choose compression level in app settings:

```javascript
// In user settings
const QUALITY_OPTIONS = [
  { value: 'HIGH', label: 'High Quality (3-4 MB)', speed: 'Slower' },
  { value: 'MEDIUM', label: 'Balanced (1-2 MB) - Recommended', speed: 'Fast' },
  { value: 'LOW', label: 'Lower Quality (1 MB)', speed: 'Faster' },
  { value: 'MOBILE', label: 'Mobile Data Saver (< 1 MB)', speed: 'Fastest' }
];
```

**Recommendation:** Start with **MEDIUM (0.70)** as non-configurable default. Add user settings later if needed.

## Upload Points

### 1. **Scoring Screens** (Primary - During Play)
- **Location**: Bottom of scoring interface
- **Access**: Small camera icon/button
- **Flow**:
  1. Tap camera icon
  2. Choose "Take Photo", "Take Video", or "Choose from Library"
  3. Capture/select media
  4. Add optional caption
  5. Automatically associate with current hole, round, tournament
  6. Upload in background
- **Context**: Automatically knows tournament, round, hole, player(s)
- **Use case**: Action shots during play

### 2. **Tournament Detail Page** (General Tournament Media)
- **Location**: New "Media" tab or section
- **Access**: "Upload Photos/Videos" button
- **Flow**: Similar to scoring, but requires manual selection of round/hole (optional)
- **Use case**: Uploading media after the round, general tournament photos
- **Context**: Auto-associates with tournament, optional round/hole

### 3. **Leaderboard Screen** (Awards & Ceremony)
- **Location**: Top or bottom action bar
- **Access**: "📷 Add Photos" button
- **Flow**:
  1. Tap button
  2. Choose photo/video source
  3. Capture/select media
  4. Add caption (e.g., "1st Place - John Smith")
  5. Optionally tag players in photo
  6. Auto-tagged as "Awards" or "Ceremony" category
- **Context**: Tournament-level, no specific round/hole
- **Use case**: Trophy presentations, award ceremonies, group photos, podium shots
- **Special**: Can bulk upload multiple award photos at once

### 4. **Round Detail Section**
- **Location**: Within round details on tournament page
- **Access**: "Add Media" button per round
- **Context**: Auto-associates with specific round

## Viewing & Display

### 1. **Tournament Detail Page**
```
[Tournament Info]
[Rounds]
[Media Gallery]  ← NEW SECTION
  - Grid layout (3-4 columns on desktop, 2 on mobile)
  - Photos and videos mixed
  - Video thumbnails with play icon overlay
  - Click to open lightbox/modal viewer

  FILTERS:
  - By Type: All | Photos | Videos
  - By Category: All | Action | Awards | Ceremony | Group | Course
  - By Round: All Rounds | Round 1 | Round 2 | etc.
  - By Hole: All Holes | 1-18

  SORT:
  - Latest | Oldest | Most viewed

  SPECIAL VIEWS:
  - "Awards Gallery" button → Show only awards/ceremony photos
  - "Highlights" button → Featured/pinned media
```

### 2. **Round Specific View**
- Media section within each round's detail page
- Show only media from that round
- Grouped by hole (optional toggle)

### 3. **Lightbox/Modal Viewer**
- Full-screen viewing
- Swipe/arrow navigation between media
- Show caption, timestamp, uploader
- Share button (future)
- Download button
- Delete button (if uploader or admin)

### 4. **Scoring Screen Integration**
- Small thumbnail strip at bottom
- Shows media uploaded during current round
- Tap to view full screen
- Quick access to add more

## Technical Implementation

### Phase 1: Foundation (Essential)
1. **Firebase Storage setup**
   - Configure storage bucket
   - Set security rules (authenticated uploads only)

2. **Media service** (`src/firebase/mediaServices.js`)
   ```javascript
   - uploadPhoto(file, metadata)
   - uploadVideo(file, metadata)
   - getTournamentMedia(tournamentId)
   - getRoundMedia(tournamentId, roundId)
   - deleteMedia(mediaId)
   - updateMediaCaption(mediaId, caption)
   ```

3. **UI Components**
   - `MediaUploader.js` - Upload interface
   - `MediaGallery.js` - Grid display
   - `MediaViewer.js` - Lightbox/modal
   - `MediaThumbnail.js` - Individual item

4. **Integration points**
   - Add to StablefordScoring component
   - Add to ScorecardScoring component
   - Add to TournamentDetail component

### Phase 2: Enhancements (Nice-to-have)
1. **Image optimization**
   - Auto-resize large images before upload
   - Generate thumbnails server-side (Cloud Functions)
   - Progressive loading

2. **Video features**
   - Max length limit (e.g., 30 seconds)
   - Video compression before upload
   - Generate video thumbnail (Cloud Functions)

3. **Advanced features**
   - Face detection / player tagging
   - Location tagging (GPS)
   - Batch upload
   - Slideshow mode
   - Download all media as zip

### Phase 3: Social Features (Future)
1. Likes/reactions
2. Comments
3. Share to social media
4. Featured media (highlight best shots)
5. Automatic highlights reel generation

## File Size Limits

### Photos
- **Upload limit**: No hard limit (compressed automatically)
- **After compression**: ~1-2 MB (desktop), ~0.3-1 MB (mobile)
- **Formats**: JPEG, PNG, HEIC (all converted to JPEG)
- **Max resolution**: 1600px (desktop), 1024px (mobile)

### Videos
- **Max size**: 10 MB per video (after recording/compression)
- **Max duration**: 60 seconds
- **Formats**: WebM (VP9/VP8), MP4 (H.264) depending on browser
- **Resolution**: 720p (desktop), 360p (mobile)
- **Live recording**: Compressed in real-time using MediaRecorder API
- **Uploaded videos**: Must be under 10 MB or rejected with message to compress

## Security Rules

### Firebase Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tournaments/{tournamentId}/{allPaths=**} {
      // Allow authenticated users to read
      allow read: if request.auth != null;

      // Allow authenticated users to upload photos and videos
      allow create: if request.auth != null
                    && (
                      // Photos: reasonable limit after compression
                      (request.resource.contentType.matches('image/.*')
                        && request.resource.size < 5 * 1024 * 1024)  // 5 MB max
                      ||
                      // Videos: strict limit for compressed videos
                      (request.resource.contentType.matches('video/.*')
                        && request.resource.size < 15 * 1024 * 1024)  // 15 MB max
                    );

      // Allow users to delete their own uploads or admins
      allow delete: if request.auth != null;  // Add admin check later
    }
  }
}
```

### Firestore Rules (media collection)
```javascript
match /media/{mediaId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null;
  allow delete: if request.auth != null;  // Add ownership check later
}
```

## UI/UX Considerations

### Mobile First
- Use device camera API for capture
- Compress before upload on mobile
- Show upload progress
- Allow background uploads
- Handle offline gracefully (queue uploads)

### Performance
- Lazy load media in gallery
- Virtual scrolling for large galleries
- Thumbnail preview loading before full image
- Cache downloaded media locally

### Accessibility
- Alt text for images (from caption)
- Keyboard navigation in gallery
- Screen reader announcements for uploads

## Implementation Priority

### Must Have (MVP)
1. ✅ Data model design
2. Photo upload from scoring screens
3. Photo gallery on tournament page
4. Basic lightbox viewer
5. Firebase Storage integration

### Should Have
1. Video upload and playback
2. Media filtering and sorting
3. Caption editing
4. Delete functionality
5. Upload progress indicators

### Could Have
1. Image compression/optimization
2. Video thumbnails
3. Batch upload
4. Media download
5. Share functionality

### Won't Have (Initially)
1. Social features (likes, comments)
2. Advanced video editing
3. AI-powered features
4. Live streaming

## File Structure

```
src/
  components/
    media/
      MediaUploader.js       - Upload interface component
      MediaUploader.css
      MediaGallery.js        - Grid gallery display
      MediaGallery.css
      MediaViewer.js         - Lightbox modal viewer
      MediaViewer.css
      MediaThumbnail.js      - Single media item
      MediaThumbnail.css
      MediaFilters.js        - Filter/sort controls
      VideoPlayer.js         - Video playback component

  firebase/
    mediaServices.js         - Firebase Storage operations

  utils/
    mediaUtils.js            - Compression, validation, format conversion

  hooks/
    useMediaUpload.js        - Upload state management
    useMediaGallery.js       - Gallery data fetching
```

## Example User Flow

### Scenario: Player uploads photo during round

1. **During Scoring**
   - Player completes hole 7
   - Taps camera icon at bottom of screen
   - Selects "Take Photo"
   - Camera opens, takes photo of group on green
   - Adds caption: "Great birdie putt by John!"
   - Taps "Upload"

2. **System Actions**
   - Compresses image if > 2 MB
   - Generates unique mediaId
   - Uploads to `/tournaments/{id}/rounds/{id}/photos/{mediaId}.jpg`
   - Creates Firestore document with metadata
   - Shows success notification
   - Photo appears in round's media gallery

3. **Viewing Later**
   - Any participant opens tournament page
   - Scrolls to Media Gallery
   - Sees photo in grid
   - Clicks to view full screen
   - Swipes through all tournament photos
   - Downloads favorite shots

## Cost Considerations

### Firebase Storage Pricing
- Storage: $0.026/GB per month
- Download: $0.12/GB
- Upload: $0.12/GB

### Estimated Costs (per tournament - with aggressive compression)

**Photos:**
- 50 photos @ 1.5 MB avg (compressed) = 75 MB storage = $0.002/month
- Without compression @ 6 MB avg = 300 MB = $0.008/month
- **Savings: 75%**

**Videos:**
- 10 videos @ 9 MB avg (30-sec, 720p) = 90 MB storage = $0.002/month
- Without compression @ 40 MB avg = 400 MB = $0.010/month
- **Savings: 77%**

**Total per tournament:**
- With compression: ~$0.004/month (~165 MB)
- Without compression: ~$0.018/month (~700 MB)
- **Total savings: 78%**

**Annual costs for 12 tournaments:**
- With compression: ~$0.58/year
- Without compression: ~$2.50/year
- **Savings: $1.92/year**

**Upload/Download bandwidth:**
- Negligible for small user base (<100 users)
- Even with heavy usage (1000 downloads/month), only ~$0.20/month

**Conclusion**: Extremely affordable. Aggressive compression reduces storage costs by ~78% while maintaining excellent quality.

## Migration Strategy

### Existing Tournaments
- No migration needed
- Media feature is additive
- Old tournaments work as before, but can add media going forward

### Database Updates
- No schema changes to existing collections
- New `media` collection added independently
- Rounds reference media by query, not embedded

## Testing Plan

1. **Unit Tests**
   - Media upload utilities
   - File validation
   - Compression functions

2. **Integration Tests**
   - Upload flow end-to-end
   - Gallery loading
   - Viewer navigation

3. **Device Testing**
   - iOS Safari camera
   - Android Chrome camera
   - Desktop file picker
   - Various image formats
   - Large file handling

4. **Performance Testing**
   - Gallery with 100+ items
   - Upload concurrent files
   - Slow network simulation
   - Offline upload queue

## Future Enhancements

### Short Term
- Automatically generate tournament highlight photo collage
- Pin featured photos to top of gallery
- Filter by player/team

### Medium Term
- Real-time upload notifications (other users see new media instantly)
- Bulk download as zip
- Print-ready photo book generation

### Long Term
- AI-powered shot detection (birdie, eagle, etc.)
- Automatic video highlight compilation
- Integration with golf stat tracking (link photos to specific shots)
- AR features (virtual pin placement, distance overlays)

---

## Next Steps

1. Review and approve plan
2. Set up Firebase Storage bucket
3. Implement Phase 1 components
4. Test with sample tournament
5. Deploy to production
6. Gather user feedback
7. Iterate on enhancements
