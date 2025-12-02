import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db, storage } from './config';

const COLLECTIONS = {
  MEDIA: 'media'
};

/**
 * Upload a photo to Firebase Storage and create Firestore document
 * @param {File} file - Compressed image file
 * @param {Object} metadata - Media metadata
 * @returns {Promise<string>} mediaId
 */
export async function uploadPhoto(file, metadata) {
  try {
    const {
      tournamentId,
      roundId = null,
      caption = '',
      category = 'general',
      holeNumber = null,
      playerId = null,
      playerIds = [],
      matchId = null,
      uploadedBy = 'user'
    } = metadata;

    // Generate unique media ID
    const mediaId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create storage path
    let storagePath = `tournaments/${tournamentId}`;
    if (roundId) {
      storagePath += `/rounds/${roundId}`;
    }
    storagePath += `/photos/${mediaId}.jpg`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: 'image/jpeg',
      customMetadata: {
        tournamentId,
        roundId: roundId || '',
        category,
        uploadedBy
      }
    });

    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);

    // Create Firestore document
    const mediaDoc = {
      id: mediaId,
      type: 'photo',
      tournamentId,
      roundId,
      storageUrl: uploadResult.metadata.fullPath,
      downloadUrl,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      caption,
      category,
      holeNumber,
      playerId,
      playerIds,
      matchId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      originalSize: metadata.originalSize || file.size,
      compressed: metadata.compressed || false,
      compressionRatio: metadata.compressionRatio || 1,
      views: 0,
      likes: 0
    };

    // Remove null/undefined fields
    Object.keys(mediaDoc).forEach(key => {
      if (mediaDoc[key] === null || mediaDoc[key] === undefined) {
        delete mediaDoc[key];
      }
    });

    await addDoc(collection(db, COLLECTIONS.MEDIA), mediaDoc);

    console.log('Photo uploaded successfully:', mediaId);
    return mediaId;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw new Error(`Failed to upload photo: ${error.message}`);
  }
}

/**
 * Upload a video to Firebase Storage and create Firestore document
 * @param {File} file - Video file
 * @param {Object} metadata - Media metadata
 * @param {Blob} thumbnailBlob - Thumbnail image blob
 * @returns {Promise<string>} mediaId
 */
export async function uploadVideo(file, metadata, thumbnailBlob = null) {
  try {
    const {
      tournamentId,
      roundId = null,
      caption = '',
      category = 'general',
      holeNumber = null,
      playerId = null,
      playerIds = [],
      matchId = null,
      uploadedBy = 'user',
      duration = 0
    } = metadata;

    // Generate unique media ID
    const mediaId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create storage path for video
    let storagePath = `tournaments/${tournamentId}`;
    if (roundId) {
      storagePath += `/rounds/${roundId}`;
    }
    const videoPath = `${storagePath}/videos/${mediaId}.mp4`;

    // Upload video to Firebase Storage
    const videoRef = ref(storage, videoPath);
    const uploadResult = await uploadBytes(videoRef, file, {
      contentType: file.type,
      customMetadata: {
        tournamentId,
        roundId: roundId || '',
        category,
        uploadedBy
      }
    });

    // Get download URL
    const downloadUrl = await getDownloadURL(videoRef);

    // Upload thumbnail if provided
    let thumbnailUrl = null;
    if (thumbnailBlob) {
      const thumbnailPath = `${storagePath}/videos/${mediaId}_thumb.jpg`;
      const thumbnailRef = ref(storage, thumbnailPath);
      await uploadBytes(thumbnailRef, thumbnailBlob, {
        contentType: 'image/jpeg'
      });
      thumbnailUrl = await getDownloadURL(thumbnailRef);
    }

    // Create Firestore document
    const mediaDoc = {
      id: mediaId,
      type: 'video',
      tournamentId,
      roundId,
      storageUrl: uploadResult.metadata.fullPath,
      downloadUrl,
      thumbnailUrl,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      caption,
      category,
      holeNumber,
      playerId,
      playerIds,
      matchId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      duration,
      views: 0,
      likes: 0
    };

    // Remove null/undefined fields
    Object.keys(mediaDoc).forEach(key => {
      if (mediaDoc[key] === null || mediaDoc[key] === undefined) {
        delete mediaDoc[key];
      }
    });

    await addDoc(collection(db, COLLECTIONS.MEDIA), mediaDoc);

    console.log('Video uploaded successfully:', mediaId);
    return mediaId;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw new Error(`Failed to upload video: ${error.message}`);
  }
}

/**
 * Get all media for a tournament
 * @param {string} tournamentId
 * @returns {Promise<Array>} Array of media documents
 */
export async function getTournamentMedia(tournamentId) {
  try {
    const q = query(
      collection(db, COLLECTIONS.MEDIA),
      where('tournamentId', '==', tournamentId),
      orderBy('uploadedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching tournament media:', error);
    throw error;
  }
}

/**
 * Get media for a specific round
 * @param {string} tournamentId
 * @param {string} roundId
 * @returns {Promise<Array>} Array of media documents
 */
export async function getRoundMedia(tournamentId, roundId) {
  try {
    const q = query(
      collection(db, COLLECTIONS.MEDIA),
      where('tournamentId', '==', tournamentId),
      where('roundId', '==', roundId),
      orderBy('uploadedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching round media:', error);
    throw error;
  }
}

/**
 * Subscribe to tournament media updates (real-time)
 * @param {string} tournamentId
 * @param {Function} callback - Called with updated media array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTournamentMedia(tournamentId, callback) {
  const q = query(
    collection(db, COLLECTIONS.MEDIA),
    where('tournamentId', '==', tournamentId),
    orderBy('uploadedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const media = snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
    callback(media);
  }, (error) => {
    console.error('Error in media subscription:', error);
  });
}

/**
 * Update media caption
 * @param {string} docId - Firestore document ID
 * @param {string} caption - New caption
 */
export async function updateMediaCaption(docId, caption) {
  try {
    const mediaRef = doc(db, COLLECTIONS.MEDIA, docId);
    await updateDoc(mediaRef, {
      caption,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating caption:', error);
    throw error;
  }
}

/**
 * Delete media (both Storage and Firestore)
 * @param {string} docId - Firestore document ID
 * @param {string} storagePath - Firebase Storage path
 * @param {string} thumbnailPath - Optional thumbnail path
 */
export async function deleteMedia(docId, storagePath, thumbnailPath = null) {
  try {
    // Delete from Storage
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);

    // Delete thumbnail if exists
    if (thumbnailPath) {
      const thumbnailRef = ref(storage, thumbnailPath);
      try {
        await deleteObject(thumbnailRef);
      } catch (err) {
        console.warn('Thumbnail not found or already deleted:', err);
      }
    }

    // Delete from Firestore
    const mediaRef = doc(db, COLLECTIONS.MEDIA, docId);
    await deleteDoc(mediaRef);

    console.log('Media deleted successfully:', docId);
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
}

/**
 * Increment view count for media
 * @param {string} docId - Firestore document ID
 */
export async function incrementMediaViews(docId) {
  try {
    const mediaRef = doc(db, COLLECTIONS.MEDIA, docId);
    const mediaDoc = await getDocs(mediaRef);
    const currentViews = mediaDoc.data()?.views || 0;

    await updateDoc(mediaRef, {
      views: currentViews + 1
    });
  } catch (error) {
    console.error('Error incrementing views:', error);
    // Don't throw - view count is not critical
  }
}

/**
 * Get media filtered by category
 * @param {string} tournamentId
 * @param {string} category - Category to filter by
 * @returns {Promise<Array>}
 */
export async function getMediaByCategory(tournamentId, category) {
  try {
    const q = query(
      collection(db, COLLECTIONS.MEDIA),
      where('tournamentId', '==', tournamentId),
      where('category', '==', category),
      orderBy('uploadedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching media by category:', error);
    throw error;
  }
}

/**
 * Get media for a specific player
 * @param {string} tournamentId
 * @param {string} playerId
 * @returns {Promise<Array>}
 */
export async function getPlayerMedia(tournamentId, playerId) {
  try {
    const q = query(
      collection(db, COLLECTIONS.MEDIA),
      where('tournamentId', '==', tournamentId),
      where('playerId', '==', playerId),
      orderBy('uploadedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching player media:', error);
    throw error;
  }
}
