/**
 * Tournament Services Integration Test Suite
 * Tests Firebase tournament operations (mocked)
 */

// Mock Firebase
jest.mock('../config', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn(),
  limit: jest.fn()
}));

import {
  createTournament,
  updateTournament,
  deleteTournament,
  getTournamentById,
  getTournaments,
  completeTournament,
  getTournamentSeries,
  getTournamentSeriesById,
  createTournamentSeries,
  updateTournamentSeries,
  getHonoursBoardEntries,
  getHonoursBoardEntry,
  createHonoursBoardEntry,
  updateHonoursBoardEntry,
  deleteHonoursBoardEntry,
  initializeTournamentSeries,
  subscribeToTournaments,
  subscribeToTournament,
  subscribeToTournamentSeries,
  subscribeToHonoursBoard
} from '../tournamentServices';

describe('Tournament Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTournament', () => {
    test('should create tournament with required fields', async () => {
      const { addDoc } = require('firebase/firestore');
      addDoc.mockResolvedValue({ id: 'tournament123' });

      const tournamentData = {
        name: 'Test Tournament',
        startDate: '2025-06-01',
        endDate: '2025-06-03',
        format: 'individual_stableford',
        players: ['player1', 'player2']
      };

      const tournamentId = await createTournament(tournamentData);

      expect(addDoc).toHaveBeenCalled();
      expect(tournamentId).toBe('tournament123');
    });

    test('should set default status to setup', async () => {
      const { addDoc } = require('firebase/firestore');
      const capturedData = {};

      addDoc.mockImplementation((col, data) => {
        Object.assign(capturedData, data);
        return Promise.resolve({ id: 'test123' });
      });

      await createTournament({
        name: 'Test',
        startDate: '2025-06-01',
        format: 'individual_stableford'
      });

      expect(capturedData.status).toBe('setup');
    });

    test('should remove undefined values from tournament data', async () => {
      const { addDoc } = require('firebase/firestore');
      const capturedData = {};

      addDoc.mockImplementation((col, data) => {
        Object.assign(capturedData, data);
        return Promise.resolve({ id: 'test123' });
      });

      await createTournament({
        name: 'Test',
        startDate: '2025-06-01',
        format: 'individual_stableford',
        teams: undefined // Should not appear in saved data
      });

      expect(capturedData.teams).toBeUndefined();
    });

    test('should handle team tournaments', async () => {
      const { addDoc } = require('firebase/firestore');
      const capturedData = {};

      addDoc.mockImplementation((col, data) => {
        Object.assign(capturedData, data);
        return Promise.resolve({ id: 'test123' });
      });

      await createTournament({
        name: 'Test Team Tournament',
        startDate: '2025-06-01',
        format: 'team_stableford',
        teams: [
          { id: 'team1', name: 'Team 1', players: ['p1', 'p2'] },
          { id: 'team2', name: 'Team 2', players: ['p3', 'p4'] }
        ]
      });

      expect(capturedData.teams).toHaveLength(2);
      expect(capturedData.teams[0].name).toBe('Team 1');
      expect(capturedData.teams[1].name).toBe('Team 2');
    });
  });

  describe('updateTournament', () => {
    test('should update tournament fields', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue();

      await updateTournament('tournament123', {
        name: 'Updated Name',
        status: 'in_progress'
      });

      expect(updateDoc).toHaveBeenCalled();
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.name).toBe('Updated Name');
      expect(callArgs.status).toBe('in_progress');
      expect(callArgs.updatedAt).toBeDefined();
    });

    test('should update players list', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue();

      await updateTournament('tournament123', {
        players: ['p1', 'p2', 'p3', 'p4']
      });

      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.players).toHaveLength(4);
    });
  });

  describe('deleteTournament', () => {
    test('should delete tournament', async () => {
      const { deleteDoc } = require('firebase/firestore');
      deleteDoc.mockResolvedValue();

      await deleteTournament('tournament123');

      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('getTournamentById', () => {
    test('should return tournament when it exists', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        id: 'tournament123',
        data: () => ({
          name: 'Test Tournament',
          status: 'setup'
        })
      });

      const tournament = await getTournamentById('tournament123');

      expect(tournament).toBeDefined();
      expect(tournament.id).toBe('tournament123');
      expect(tournament.name).toBe('Test Tournament');
    });

    test('should return null when tournament does not exist', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => false
      });

      const tournament = await getTournamentById('nonexistent');

      expect(tournament).toBeNull();
    });
  });

  describe('getTournaments', () => {
    test('should return all tournaments', async () => {
      const { getDocs, query } = require('firebase/firestore');
      query.mockReturnValue('mockQuery');
      getDocs.mockResolvedValue({
        docs: [
          {
            id: 't1',
            data: () => ({ name: 'Tournament 1', status: 'setup' })
          },
          {
            id: 't2',
            data: () => ({ name: 'Tournament 2', status: 'in_progress' })
          }
        ]
      });

      const tournaments = await getTournaments();

      expect(tournaments).toHaveLength(2);
      expect(tournaments[0].id).toBe('t1');
      expect(tournaments[1].id).toBe('t2');
    });

    test('should filter tournaments by seriesId', async () => {
      const { getDocs, query, where } = require('firebase/firestore');
      query.mockReturnValue('mockQuery');
      where.mockReturnValue('whereClause');
      getDocs.mockResolvedValue({
        docs: [
          {
            id: 't1',
            data: () => ({ name: 'Tournament 1', seriesId: 'series123' })
          }
        ]
      });

      const tournaments = await getTournaments('series123');

      expect(where).toHaveBeenCalledWith('seriesId', '==', 'series123');
      expect(tournaments).toHaveLength(1);
      expect(tournaments[0].seriesId).toBe('series123');
    });

    test('should return empty array when no tournaments exist', async () => {
      const { getDocs, query } = require('firebase/firestore');
      query.mockReturnValue('mockQuery');
      getDocs.mockResolvedValue({ docs: [] });

      const tournaments = await getTournaments();

      expect(tournaments).toEqual([]);
    });
  });

  describe('completeTournament', () => {
    test('should update tournament status to completed', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue();

      await completeTournament('tournament123', {
        winner: 'Team 1',
        winnerDetails: { captain: 'John Doe' },
        results: { team1: 15, team2: 13 }
      });

      expect(updateDoc).toHaveBeenCalled();
      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.status).toBe('completed');
      expect(callArgs.winner).toBe('Team 1');
      expect(callArgs.winnerDetails).toEqual({ captain: 'John Doe' });
      expect(callArgs.results).toEqual({ team1: 15, team2: 13 });
      expect(callArgs.updatedAt).toBeDefined();
    });

    test('should handle completion without winner data', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue();

      await completeTournament('tournament123', {});

      const callArgs = updateDoc.mock.calls[0][1];
      expect(callArgs.status).toBe('completed');
      expect(callArgs.updatedAt).toBeDefined();
    });
  });

  describe('Tournament Series', () => {
    describe('getTournamentSeries', () => {
      test('should return all tournament series', async () => {
        const { getDocs, query } = require('firebase/firestore');
        query.mockReturnValue('mockQuery');
        getDocs.mockResolvedValue({
          docs: [
            {
              id: 's1',
              data: () => ({ name: 'Series 1', year: 2025 })
            },
            {
              id: 's2',
              data: () => ({ name: 'Series 2', year: 2024 })
            }
          ]
        });

        const series = await getTournamentSeries();

        expect(series).toHaveLength(2);
        expect(series[0].id).toBe('s1');
        expect(series[1].id).toBe('s2');
      });

      test('should return empty array when no series exist', async () => {
        const { getDocs, query } = require('firebase/firestore');
        query.mockReturnValue('mockQuery');
        getDocs.mockResolvedValue({ docs: [] });

        const series = await getTournamentSeries();

        expect(series).toEqual([]);
      });
    });

    describe('getTournamentSeriesById', () => {
      test('should return series when it exists', async () => {
        const { getDoc } = require('firebase/firestore');
        getDoc.mockResolvedValue({
          exists: () => true,
          id: 'series123',
          data: () => ({
            name: 'Test Series',
            year: 2025
          })
        });

        const series = await getTournamentSeriesById('series123');

        expect(series).toBeDefined();
        expect(series.id).toBe('series123');
        expect(series.name).toBe('Test Series');
        expect(series.year).toBe(2025);
      });

      test('should return null when series does not exist', async () => {
        const { getDoc } = require('firebase/firestore');
        getDoc.mockResolvedValue({
          exists: () => false
        });

        const series = await getTournamentSeriesById('nonexistent');

        expect(series).toBeNull();
      });
    });

    describe('createTournamentSeries', () => {
      test('should create tournament series with required fields', async () => {
        const { addDoc } = require('firebase/firestore');
        addDoc.mockResolvedValue({ id: 'series123' });

        const seriesData = {
          name: 'Ryder Cup 2025',
          year: 2025,
          location: 'Bethpage Black'
        };

        const seriesId = await createTournamentSeries(seriesData);

        expect(addDoc).toHaveBeenCalled();
        expect(seriesId).toBe('series123');
      });

      test('should add timestamps to series data', async () => {
        const { addDoc } = require('firebase/firestore');
        const capturedData = {};

        addDoc.mockImplementation((col, data) => {
          Object.assign(capturedData, data);
          return Promise.resolve({ id: 'series123' });
        });

        await createTournamentSeries({
          name: 'Test Series',
          year: 2025
        });

        expect(capturedData.createdAt).toBeDefined();
        expect(capturedData.updatedAt).toBeDefined();
      });
    });

    describe('updateTournamentSeries', () => {
      test('should update series fields', async () => {
        const { updateDoc } = require('firebase/firestore');
        updateDoc.mockResolvedValue();

        await updateTournamentSeries('series123', {
          name: 'Updated Series Name',
          location: 'New Location'
        });

        expect(updateDoc).toHaveBeenCalled();
        const callArgs = updateDoc.mock.calls[0][1];
        expect(callArgs.name).toBe('Updated Series Name');
        expect(callArgs.location).toBe('New Location');
        expect(callArgs.updatedAt).toBeDefined();
      });
    });

    describe('initializeTournamentSeries', () => {
      test('should create default series if none exist', async () => {
        const { getDocs, addDoc, query } = require('firebase/firestore');
        query.mockReturnValue('mockQuery');
        getDocs.mockResolvedValue({ docs: [] });
        addDoc.mockResolvedValue({ id: 'series123' });

        await initializeTournamentSeries();

        expect(addDoc).toHaveBeenCalled();
        const callArgs = addDoc.mock.calls[0][1];
        expect(callArgs.name).toBe('Ryder Cup');
        expect(callArgs.format).toBe('ryder_cup');
      });

      test('should not create series if one already exists', async () => {
        const { getDocs, addDoc, query } = require('firebase/firestore');
        query.mockReturnValue('mockQuery');
        getDocs.mockResolvedValue({
          docs: [{ id: 'existing', data: () => ({}) }]
        });

        await initializeTournamentSeries();

        expect(addDoc).not.toHaveBeenCalled();
      });
    });
  });

  describe('Honours Board', () => {
    describe('getHonoursBoardEntries', () => {
      test('should return all honours board entries', async () => {
        const { getDocs, query } = require('firebase/firestore');
        query.mockReturnValue('mockQuery');
        getDocs.mockResolvedValue({
          docs: [
            {
              id: 'h1',
              data: () => ({ year: 2024, winner: 'Europe' })
            },
            {
              id: 'h2',
              data: () => ({ year: 2023, winner: 'USA' })
            }
          ]
        });

        const entries = await getHonoursBoardEntries();

        expect(entries).toHaveLength(2);
        expect(entries[0].year).toBe(2024);
        expect(entries[1].year).toBe(2023);
      });

      test('should filter entries by seriesId', async () => {
        const { getDocs, query, where } = require('firebase/firestore');
        query.mockReturnValue('mockQuery');
        where.mockReturnValue('whereClause');
        getDocs.mockResolvedValue({
          docs: [
            {
              id: 'h1',
              data: () => ({ year: 2024, seriesId: 'series123' })
            }
          ]
        });

        const entries = await getHonoursBoardEntries('series123');

        expect(where).toHaveBeenCalledWith('seriesId', '==', 'series123');
        expect(entries).toHaveLength(1);
      });
    });

    describe('getHonoursBoardEntry', () => {
      test('should return entry for specific year and series', async () => {
        const { getDocs, query, where } = require('firebase/firestore');
        query.mockReturnValue('mockQuery');
        where.mockReturnValue('whereClause');
        getDocs.mockResolvedValue({
          docs: [
            {
              id: 'h1',
              data: () => ({ year: 2024, winner: 'Europe', seriesId: 'series123' })
            }
          ]
        });

        const entry = await getHonoursBoardEntry('series123', 2024);

        expect(entry).toBeDefined();
        expect(entry.year).toBe(2024);
        expect(entry.winner).toBe('Europe');
      });

      test('should return null when no entry exists', async () => {
        const { getDocs, query, where } = require('firebase/firestore');
        query.mockReturnValue('mockQuery');
        where.mockReturnValue('whereClause');
        getDocs.mockResolvedValue({
          docs: [],
          empty: true
        });

        const entry = await getHonoursBoardEntry('series123', 2024);

        expect(entry).toBeNull();
      });
    });

    describe('createHonoursBoardEntry', () => {
      test('should create honours board entry', async () => {
        const { addDoc } = require('firebase/firestore');
        addDoc.mockResolvedValue({ id: 'honours123' });

        const entryData = {
          year: 2025,
          winner: 'Europe',
          score: '16.5 - 11.5',
          location: 'Bethpage Black',
          seriesId: 'series123'
        };

        const entryId = await createHonoursBoardEntry(entryData);

        expect(addDoc).toHaveBeenCalled();
        expect(entryId).toBe('honours123');
      });

      test('should add timestamps to entry', async () => {
        const { addDoc } = require('firebase/firestore');
        const capturedData = {};

        addDoc.mockImplementation((col, data) => {
          Object.assign(capturedData, data);
          return Promise.resolve({ id: 'honours123' });
        });

        await createHonoursBoardEntry({
          year: 2025,
          winner: 'Europe',
          seriesId: 'series123'
        });

        expect(capturedData.createdAt).toBeDefined();
        expect(capturedData.updatedAt).toBeDefined();
      });
    });

    describe('updateHonoursBoardEntry', () => {
      test('should update entry fields', async () => {
        const { updateDoc } = require('firebase/firestore');
        updateDoc.mockResolvedValue();

        await updateHonoursBoardEntry('honours123', {
          winner: 'USA',
          score: '15 - 13'
        });

        expect(updateDoc).toHaveBeenCalled();
        const callArgs = updateDoc.mock.calls[0][1];
        expect(callArgs.winner).toBe('USA');
        expect(callArgs.score).toBe('15 - 13');
        expect(callArgs.updatedAt).toBeDefined();
      });
    });

    describe('deleteHonoursBoardEntry', () => {
      test('should delete honours board entry', async () => {
        const { deleteDoc } = require('firebase/firestore');
        deleteDoc.mockResolvedValue();

        await deleteHonoursBoardEntry('honours123');

        expect(deleteDoc).toHaveBeenCalled();
      });
    });
  });

  describe('Subscription Functions', () => {
    describe('subscribeToTournaments', () => {
      test('should set up listener for tournaments', () => {
        const { onSnapshot, query } = require('firebase/firestore');
        const mockCallback = jest.fn();
        const mockUnsubscribe = jest.fn();

        query.mockReturnValue('mockQuery');
        onSnapshot.mockImplementation((q, callback) => {
          callback({
            docs: [
              { id: 't1', data: () => ({ name: 'Tournament 1' }) }
            ]
          });
          return mockUnsubscribe;
        });

        const unsubscribe = subscribeToTournaments(mockCallback);

        expect(onSnapshot).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalledWith([
          { id: 't1', name: 'Tournament 1' }
        ]);
        expect(unsubscribe).toBe(mockUnsubscribe);
      });

      test('should filter by seriesId when provided', () => {
        const { onSnapshot, query, where } = require('firebase/firestore');
        const mockCallback = jest.fn();

        query.mockReturnValue('mockQuery');
        where.mockReturnValue('whereClause');
        onSnapshot.mockReturnValue(jest.fn());

        subscribeToTournaments(mockCallback, 'series123');

        expect(where).toHaveBeenCalledWith('seriesId', '==', 'series123');
      });
    });

    describe('subscribeToTournament', () => {
      test('should set up listener for single tournament', () => {
        const { onSnapshot } = require('firebase/firestore');
        const mockCallback = jest.fn();
        const mockUnsubscribe = jest.fn();

        onSnapshot.mockImplementation((docRef, callback) => {
          callback({
            exists: () => true,
            id: 't1',
            data: () => ({ name: 'Tournament 1' })
          });
          return mockUnsubscribe;
        });

        const unsubscribe = subscribeToTournament('t1', mockCallback);

        expect(onSnapshot).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalledWith({
          id: 't1',
          name: 'Tournament 1'
        });
        expect(unsubscribe).toBe(mockUnsubscribe);
      });

      test('should not call callback for non-existent tournament', () => {
        const { onSnapshot } = require('firebase/firestore');
        const mockCallback = jest.fn();

        onSnapshot.mockImplementation((docRef, callback) => {
          callback({
            exists: () => false
          });
          return jest.fn();
        });

        subscribeToTournament('nonexistent', mockCallback);

        expect(mockCallback).not.toHaveBeenCalled();
      });
    });

    describe('subscribeToTournamentSeries', () => {
      test('should set up listener for tournament series', () => {
        const { onSnapshot, query } = require('firebase/firestore');
        const mockCallback = jest.fn();
        const mockUnsubscribe = jest.fn();

        query.mockReturnValue('mockQuery');
        onSnapshot.mockImplementation((q, callback) => {
          callback({
            docs: [
              { id: 's1', data: () => ({ name: 'Series 1' }) }
            ]
          });
          return mockUnsubscribe;
        });

        const unsubscribe = subscribeToTournamentSeries(mockCallback);

        expect(onSnapshot).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalledWith([
          { id: 's1', name: 'Series 1' }
        ]);
        expect(unsubscribe).toBe(mockUnsubscribe);
      });
    });

    describe('subscribeToHonoursBoard', () => {
      test('should set up listener for honours board', () => {
        const { onSnapshot, query } = require('firebase/firestore');
        const mockCallback = jest.fn();
        const mockUnsubscribe = jest.fn();

        query.mockReturnValue('mockQuery');
        onSnapshot.mockImplementation((q, callback) => {
          callback({
            docs: [
              { id: 'h1', data: () => ({ year: 2024, winner: 'Europe' }) }
            ]
          });
          return mockUnsubscribe;
        });

        const unsubscribe = subscribeToHonoursBoard(mockCallback);

        expect(onSnapshot).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalledWith([
          { id: 'h1', year: 2024, winner: 'Europe' }
        ]);
        expect(unsubscribe).toBe(mockUnsubscribe);
      });

      test('should filter by seriesId when provided', () => {
        const { onSnapshot, query, where } = require('firebase/firestore');
        const mockCallback = jest.fn();

        query.mockReturnValue('mockQuery');
        where.mockReturnValue('whereClause');
        onSnapshot.mockReturnValue(jest.fn());

        subscribeToHonoursBoard(mockCallback, 'series123');

        expect(where).toHaveBeenCalledWith('seriesId', '==', 'series123');
      });
    });
  });
});
