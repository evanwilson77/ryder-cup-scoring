import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit
} from 'firebase/firestore';
import { db } from './config';

// Collections
const COLLECTIONS = {
  TOURNAMENT_SERIES: 'tournamentSeries',
  TOURNAMENTS: 'tournaments',
  HONOURS_BOARD: 'honoursBoard',
  MEDIA: 'media'
};

// ============================================================================
// TOURNAMENT SERIES OPERATIONS
// A series is a recurring tournament type (e.g., "Ryder Cup", "Chaps Cup")
// ============================================================================

/**
 * Get all tournament series
 */
export const getTournamentSeries = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.TOURNAMENT_SERIES));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get a single tournament series by ID
 */
export const getTournamentSeriesById = async (seriesId) => {
  const docRef = doc(db, COLLECTIONS.TOURNAMENT_SERIES, seriesId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

/**
 * Create a new tournament series
 */
export const createTournamentSeries = async (seriesData) => {
  const seriesWithDefaults = {
    name: seriesData.name,
    description: seriesData.description || '',
    format: seriesData.format, // 'ryder_cup', 'individual_stableford', 'scramble', 'team_stableford', 'best_ball', 'shamble', 'multi_day'
    theming: seriesData.theming || 'neutral', // 'ryder_cup' or 'neutral'
    isRecurring: seriesData.isRecurring !== false,
    frequency: seriesData.frequency || null, // e.g., '2_per_year', 'annual'
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.TOURNAMENT_SERIES), seriesWithDefaults);
  return docRef.id;
};

/**
 * Update a tournament series
 */
export const updateTournamentSeries = async (seriesId, seriesData) => {
  const docRef = doc(db, COLLECTIONS.TOURNAMENT_SERIES, seriesId);
  await updateDoc(docRef, {
    ...seriesData,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Subscribe to tournament series changes
 */
export const subscribeToTournamentSeries = (callback) => {
  return onSnapshot(collection(db, COLLECTIONS.TOURNAMENT_SERIES), (snapshot) => {
    const series = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(series);
  });
};

// ============================================================================
// TOURNAMENT OPERATIONS
// An individual tournament edition within a series
// ============================================================================

/**
 * Get all tournaments, optionally filtered by series
 */
export const getTournaments = async (seriesId = null) => {
  let q = collection(db, COLLECTIONS.TOURNAMENTS);

  if (seriesId) {
    q = query(q, where('seriesId', '==', seriesId), orderBy('startDate', 'desc'));
  } else {
    q = query(q, orderBy('startDate', 'desc'));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get a single tournament by ID
 */
export const getTournamentById = async (tournamentId) => {
  const docRef = doc(db, COLLECTIONS.TOURNAMENTS, tournamentId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

/**
 * Create a new tournament
 */
export const createTournament = async (tournamentData) => {
  const tournamentWithDefaults = {
    seriesId: tournamentData.seriesId,
    name: tournamentData.name,
    edition: tournamentData.edition || null, // e.g., "2025" or "October 2025"
    courseName: tournamentData.courseName,
    courseId: tournamentData.courseId || null,
    startDate: tournamentData.startDate,
    endDate: tournamentData.endDate || tournamentData.startDate,
    format: tournamentData.format,
    status: 'setup', // 'setup', 'in_progress', 'completed'

    // Participants
    players: tournamentData.players || [],
    teams: tournamentData.teams || null, // For team formats

    // Results
    winner: tournamentData.winner || null,
    winnerDetails: tournamentData.winnerDetails || null, // e.g., score, margin
    results: tournamentData.results || [],

    // Match data (for Ryder Cup format)
    matches: tournamentData.matches || [],

    // Scoring data (for Stableford/Stroke formats)
    scorecards: tournamentData.scorecards || [],

    // Media
    photos: tournamentData.photos || [],
    videos: tournamentData.videos || [],

    // Metadata
    notes: tournamentData.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.TOURNAMENTS), tournamentWithDefaults);
  return docRef.id;
};

/**
 * Update a tournament
 */
export const updateTournament = async (tournamentId, tournamentData) => {
  const docRef = doc(db, COLLECTIONS.TOURNAMENTS, tournamentId);
  await updateDoc(docRef, {
    ...tournamentData,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Complete a tournament and update winner
 */
export const completeTournament = async (tournamentId, winnerData) => {
  const docRef = doc(db, COLLECTIONS.TOURNAMENTS, tournamentId);
  await updateDoc(docRef, {
    status: 'completed',
    winner: winnerData.winner,
    winnerDetails: winnerData.winnerDetails,
    results: winnerData.results,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Subscribe to tournaments changes
 */
export const subscribeToTournaments = (callback, seriesId = null) => {
  let q = collection(db, COLLECTIONS.TOURNAMENTS);

  if (seriesId) {
    q = query(q, where('seriesId', '==', seriesId), orderBy('startDate', 'desc'));
  } else {
    q = query(q, orderBy('startDate', 'desc'));
  }

  return onSnapshot(q, (snapshot) => {
    const tournaments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tournaments);
  });
};

/**
 * Subscribe to a single tournament
 */
export const subscribeToTournament = (tournamentId, callback) => {
  const docRef = doc(db, COLLECTIONS.TOURNAMENTS, tournamentId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

// ============================================================================
// HONOURS BOARD OPERATIONS
// Historical winners and achievements
// ============================================================================

/**
 * Get all honours board entries, ordered by year descending
 */
export const getHonoursBoardEntries = async (seriesId = null) => {
  let q = collection(db, COLLECTIONS.HONOURS_BOARD);

  if (seriesId) {
    q = query(q, where('seriesId', '==', seriesId), orderBy('year', 'desc'));
  } else {
    q = query(q, orderBy('year', 'desc'));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get honours board entry for specific year and series
 */
export const getHonoursBoardEntry = async (seriesId, year) => {
  const q = query(
    collection(db, COLLECTIONS.HONOURS_BOARD),
    where('seriesId', '==', seriesId),
    where('year', '==', year),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;

  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

/**
 * Create honours board entry
 */
export const createHonoursBoardEntry = async (entryData) => {
  const entryWithDefaults = {
    seriesId: entryData.seriesId,
    tournamentId: entryData.tournamentId || null,
    year: entryData.year,
    edition: entryData.edition || null,
    winner: entryData.winner,
    winnerDetails: entryData.winnerDetails || {},
    courseName: entryData.courseName || '',
    date: entryData.date,
    photos: entryData.photos || [],
    summary: entryData.summary || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.HONOURS_BOARD), entryWithDefaults);
  return docRef.id;
};

/**
 * Update honours board entry
 */
export const updateHonoursBoardEntry = async (entryId, entryData) => {
  const docRef = doc(db, COLLECTIONS.HONOURS_BOARD, entryId);
  await updateDoc(docRef, {
    ...entryData,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Delete honours board entry
 */
export const deleteHonoursBoardEntry = async (entryId) => {
  const docRef = doc(db, COLLECTIONS.HONOURS_BOARD, entryId);
  await deleteDoc(docRef);
};

/**
 * Subscribe to honours board entries
 */
export const subscribeToHonoursBoard = (callback, seriesId = null) => {
  let q = collection(db, COLLECTIONS.HONOURS_BOARD);

  if (seriesId) {
    q = query(q, where('seriesId', '==', seriesId), orderBy('year', 'desc'));
  } else {
    q = query(q, orderBy('year', 'desc'));
  }

  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(entries);
  });
};

// ============================================================================
// INITIALIZATION
// Create default tournament series
// ============================================================================

/**
 * Initialize default tournament series if they don't exist
 */
export const initializeTournamentSeries = async () => {
  try {
    const existingSeries = await getTournamentSeries();

    if (existingSeries.length > 0) {
      console.log('Tournament series already initialized');
      return;
    }

    console.log('Initializing tournament series...');

    // Ryder Cup
    await createTournamentSeries({
      name: 'Ryder Cup',
      description: 'Team match play competition with foursomes, fourball, and singles matches',
      format: 'ryder_cup',
      theming: 'ryder_cup',
      isRecurring: true,
      frequency: 'annual'
    });

    // Chaps Cup
    await createTournamentSeries({
      name: 'Chaps Cup',
      description: 'Individual Stableford competition',
      format: 'individual_stableford',
      theming: 'neutral',
      isRecurring: true,
      frequency: '2_per_year'
    });

    // Josef Memorial
    await createTournamentSeries({
      name: 'Josef Memorial',
      description: 'Ambrose/Scramble team competition',
      format: 'scramble',
      theming: 'neutral',
      isRecurring: true,
      frequency: 'annual'
    });

    // Dodo Cup
    await createTournamentSeries({
      name: 'Dodo Cup',
      description: 'Team Stableford over multiple rounds',
      format: 'team_stableford',
      theming: 'neutral',
      isRecurring: true,
      frequency: 'annual'
    });

    console.log('✓ Successfully initialized tournament series');
  } catch (error) {
    console.error('Error initializing tournament series:', error);
    throw error;
  }
};
