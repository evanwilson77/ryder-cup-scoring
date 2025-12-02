/**
 * Player Initialization Test Suite
 * Tests player data initialization logic
 */

// Mock Firebase
jest.mock('../../firebase/config', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn()
}));

import { initializeRegularPlayers } from '../initializePlayers';

describe('Player Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should not initialize if players already exist', async () => {
    const { getDocs, addDoc } = require('firebase/firestore');

    // Mock existing players
    getDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'p1', data: () => ({ name: 'Existing Player' }) }]
    });

    await initializeRegularPlayers();

    expect(addDoc).not.toHaveBeenCalled();
  });

  test('should initialize default players if none exist', async () => {
    const { getDocs, addDoc } = require('firebase/firestore');

    // Mock no existing players
    getDocs.mockResolvedValue({
      empty: true,
      docs: []
    });

    addDoc.mockResolvedValue({ id: 'newPlayer123' });

    await initializeRegularPlayers();

    expect(addDoc).toHaveBeenCalled();
    expect(addDoc.mock.calls.length).toBeGreaterThan(0);
  });

  test('should create players with valid handicaps', async () => {
    const { getDocs, addDoc } = require('firebase/firestore');

    getDocs.mockResolvedValue({ empty: true, docs: [] });

    const capturedPlayers = [];
    addDoc.mockImplementation((col, player) => {
      capturedPlayers.push(player);
      return Promise.resolve({ id: 'id' });
    });

    await initializeRegularPlayers();

    capturedPlayers.forEach(player => {
      expect(player.name).toBeDefined();
      expect(player.handicap).toBeGreaterThanOrEqual(0);
      expect(player.handicap).toBeLessThanOrEqual(54);
    });
  });
});
