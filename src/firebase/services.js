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
  setDoc
} from 'firebase/firestore';
import { db } from './config';

// Collections
const COLLECTIONS = {
  TOURNAMENT: 'tournament',
  TEAMS: 'teams',
  PLAYERS: 'players',
  COURSE: 'course',
  HOLES: 'holes',
  MATCHES: 'matches',
  SCORES: 'scores',
  SAVED_COURSES: 'savedCourses'
};

// Tournament operations
export const getTournament = async () => {
  const docRef = doc(db, COLLECTIONS.TOURNAMENT, 'current');
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const updateTournament = async (data) => {
  const docRef = doc(db, COLLECTIONS.TOURNAMENT, 'current');
  await setDoc(docRef, data, { merge: true });
};

// Team operations
export const getTeams = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.TEAMS));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getTeam = async (teamId) => {
  const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const addTeam = async (teamData) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.TEAMS), teamData);
  return docRef.id;
};

export const updateTeam = async (teamId, teamData) => {
  const docRef = doc(db, COLLECTIONS.TEAMS, teamId);
  await updateDoc(docRef, teamData);
};

export const subscribeToTeams = (callback) => {
  return onSnapshot(collection(db, COLLECTIONS.TEAMS), (snapshot) => {
    const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(teams);
  });
};

// Player operations
export const getPlayers = async () => {
  const q = query(collection(db, COLLECTIONS.PLAYERS), orderBy('name'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getPlayer = async (playerId) => {
  const docRef = doc(db, COLLECTIONS.PLAYERS, playerId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const getPlayersByTeam = async (teamId) => {
  const players = await getPlayers();
  return players.filter(player => player.teamId === teamId);
};

export const addPlayer = async (playerData) => {
  // Ensure handicap is stored as decimal number with 1 decimal place
  const handicap = playerData.handicap ? parseFloat(parseFloat(playerData.handicap).toFixed(1)) : 0.0;

  const playerWithDefaults = {
    name: playerData.name,
    handicap: handicap,
    teamId: playerData.teamId || null,
    handicapHistory: [{
      handicap: handicap,
      date: new Date().toISOString(),
      tournamentId: playerData.tournamentId || null,
      reason: 'Initial handicap'
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.PLAYERS), playerWithDefaults);
  return docRef.id;
};

export const updatePlayer = async (playerId, playerData) => {
  const docRef = doc(db, COLLECTIONS.PLAYERS, playerId);

  // If handicap is being updated, add to history
  if (playerData.handicap !== undefined) {
    const player = await getPlayer(playerId);
    const newHandicap = parseFloat(parseFloat(playerData.handicap).toFixed(1));

    // Only add to history if handicap actually changed
    if (!player || player.handicap !== newHandicap) {
      const historyEntry = {
        handicap: newHandicap,
        date: new Date().toISOString(),
        tournamentId: playerData.tournamentId || null,
        reason: playerData.handicapChangeReason || 'Manual update'
      };

      const updatedHistory = [...(player?.handicapHistory || []), historyEntry];
      playerData.handicapHistory = updatedHistory;
    }

    playerData.handicap = newHandicap;
  }

  await updateDoc(docRef, {
    ...playerData,
    updatedAt: new Date().toISOString()
  });
};

export const deletePlayer = async (playerId) => {
  const docRef = doc(db, COLLECTIONS.PLAYERS, playerId);
  await deleteDoc(docRef);
};

export const subscribeToPlayers = (callback) => {
  const q = query(collection(db, COLLECTIONS.PLAYERS), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(players);
  });
};

export const subscribeToPlayer = (playerId, callback) => {
  const docRef = doc(db, COLLECTIONS.PLAYERS, playerId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

// Course operations
export const getCourse = async () => {
  const docRef = doc(db, COLLECTIONS.COURSE, 'current');
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const updateCourse = async (courseData) => {
  const docRef = doc(db, COLLECTIONS.COURSE, 'current');
  await setDoc(docRef, courseData, { merge: true });
};

export const getHoles = async () => {
  const q = query(collection(db, COLLECTIONS.HOLES), orderBy('number'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateHole = async (holeId, holeData) => {
  const docRef = doc(db, COLLECTIONS.HOLES, holeId);
  await updateDoc(docRef, holeData);
};

export const setHole = async (holeId, holeData) => {
  const docRef = doc(db, COLLECTIONS.HOLES, holeId);
  await setDoc(docRef, holeData);
};

export const subscribeToHoles = (callback) => {
  const q = query(collection(db, COLLECTIONS.HOLES), orderBy('number'));
  return onSnapshot(q, (snapshot) => {
    const holes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(holes);
  });
};

// Saved Courses operations
export const getSavedCourses = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.SAVED_COURSES));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveCourseConfiguration = async (courseName, holes) => {
  const courseData = {
    name: courseName,
    holes: holes,
    totalPar: holes.reduce((sum, h) => sum + (h.par || 0), 0),
    savedAt: new Date().toISOString()
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.SAVED_COURSES), courseData);
  return docRef.id;
};

export const loadCourseConfiguration = async (courseId, holes) => {
  // Load saved course and apply to current holes
  const docRef = doc(db, COLLECTIONS.SAVED_COURSES, courseId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Saved course not found');
  }

  const savedCourse = docSnap.data();

  // Update all holes with saved data
  const updatePromises = savedCourse.holes.map((holeData, index) => {
    const holeId = `hole${holeData.number}`;
    return setHole(holeId, holeData);
  });

  await Promise.all(updatePromises);

  // Update course info
  await updateCourse({
    name: savedCourse.name,
    totalPar: savedCourse.totalPar,
    holesCount: 18
  });

  return savedCourse;
};

export const deleteSavedCourse = async (courseId) => {
  const docRef = doc(db, COLLECTIONS.SAVED_COURSES, courseId);
  await deleteDoc(docRef);
};

export const subscribeToSavedCourses = (callback) => {
  return onSnapshot(collection(db, COLLECTIONS.SAVED_COURSES), (snapshot) => {
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(courses);
  });
};

// Match operations
export const getMatches = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTIONS.MATCHES));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getMatch = async (matchId) => {
  const docRef = doc(db, COLLECTIONS.MATCHES, matchId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const addMatch = async (matchData) => {
  const docRef = await addDoc(collection(db, COLLECTIONS.MATCHES), {
    ...matchData,
    createdAt: new Date().toISOString(),
    status: 'not_started'
  });
  return docRef.id;
};

export const updateMatch = async (matchId, matchData) => {
  const docRef = doc(db, COLLECTIONS.MATCHES, matchId);
  await updateDoc(docRef, {
    ...matchData,
    updatedAt: new Date().toISOString()
  });
};

export const deleteMatch = async (matchId) => {
  const docRef = doc(db, COLLECTIONS.MATCHES, matchId);
  await deleteDoc(docRef);
};

export const subscribeToMatches = (callback) => {
  return onSnapshot(collection(db, COLLECTIONS.MATCHES), (snapshot) => {
    const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(matches);
  });
};

export const subscribeToMatch = (matchId, callback) => {
  const docRef = doc(db, COLLECTIONS.MATCHES, matchId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

// Score operations
export const getScore = async (matchId) => {
  const docRef = doc(db, COLLECTIONS.SCORES, matchId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const updateScore = async (matchId, scoreData) => {
  const docRef = doc(db, COLLECTIONS.SCORES, matchId);
  await setDoc(docRef, scoreData, { merge: true });
};

export const subscribeToScore = (matchId, callback) => {
  const docRef = doc(db, COLLECTIONS.SCORES, matchId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

// Initialize default data
export const initializeDefaultData = async () => {
  // Initialize default teams
  const teamsSnapshot = await getDocs(collection(db, COLLECTIONS.TEAMS));
  if (teamsSnapshot.empty) {
    await setDoc(doc(db, COLLECTIONS.TEAMS, 'team1'), {
      name: 'Tawa Lads',
      color: '#DC2626', // Red
      points: 0,
      order: 1
    });

    await setDoc(doc(db, COLLECTIONS.TEAMS, 'team2'), {
      name: 'Rest of World',
      color: '#2563EB', // Blue
      points: 0,
      order: 2
    });
  }

  // Initialize default course (18 holes with standard par)
  const holesSnapshot = await getDocs(collection(db, COLLECTIONS.HOLES));
  if (holesSnapshot.empty) {
    const defaultPars = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4];
    const defaultStrokeIndexes = [7, 3, 17, 1, 13, 9, 15, 5, 11, 10, 18, 6, 2, 14, 8, 16, 4, 12];

    for (let i = 1; i <= 18; i++) {
      await setDoc(doc(db, COLLECTIONS.HOLES, `hole${i}`), {
        number: i,
        par: defaultPars[i - 1],
        strokeIndex: defaultStrokeIndexes[i - 1]
      });
    }

    await setDoc(doc(db, COLLECTIONS.COURSE, 'current'), {
      name: 'Default Course',
      totalPar: 72,
      holesCount: 18
    });
  }

  // Initialize tournament
  const tournament = await getTournament();
  if (!tournament) {
    await setDoc(doc(db, COLLECTIONS.TOURNAMENT, 'current'), {
      name: 'Ryder Cup',
      startDate: new Date().toISOString(),
      status: 'setup'
    });
  }
};
