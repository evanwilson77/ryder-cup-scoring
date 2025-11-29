import { addPlayer, getPlayers } from '../firebase/services';

/**
 * Initialize the 13 regular players if they don't already exist
 * Players: Cyril, Stu, DC, Dodo, Dumpy, Guru, Poo, Hawk, Leaf, Jungle, Ciaran, Travis, Steve
 */
export const initializeRegularPlayers = async () => {
  try {
    // Check if players already exist
    const existingPlayers = await getPlayers();

    if (existingPlayers.length > 0) {
      console.log('Players already initialized');
      return;
    }

    // 13 regular players with placeholder handicaps (to be updated later)
    const regularPlayers = [
      { name: 'Cyril', handicap: 15.0 },
      { name: 'Stu', handicap: 12.0 },
      { name: 'DC', handicap: 18.0 },
      { name: 'Dodo', handicap: 14.0 },
      { name: 'Dumpy', handicap: 9.0 },
      { name: 'Guru', handicap: 16.0 },
      { name: 'Poo', handicap: 20.0 },
      { name: 'Hawk', handicap: 11.0 },
      { name: 'Leaf', handicap: 13.0 },
      { name: 'Jungle', handicap: 17.0 },
      { name: 'Ciaran', handicap: 10.0 },
      { name: 'Travis', handicap: 19.0 },
      { name: 'Steve', handicap: 14.5 }
    ];

    console.log('Initializing 13 regular players...');

    // Add all players
    const promises = regularPlayers.map(player => addPlayer(player));
    await Promise.all(promises);

    console.log('✓ Successfully initialized 13 regular players');
  } catch (error) {
    console.error('Error initializing players:', error);
    throw error;
  }
};
