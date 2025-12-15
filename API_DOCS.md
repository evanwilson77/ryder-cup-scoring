# API Documentation

Complete reference for all Firebase services, custom hooks, and utility functions in the Ryder Cup Scoring App.

## Table of Contents

- [Firebase Services](#firebase-services)
  - [Core Services](#core-services)
  - [Tournament Services](#tournament-services)
  - [Media Services](#media-services)
- [Custom Hooks](#custom-hooks)
- [Utility Functions](#utility-functions)
  - [Scoring Calculations](#scoring-calculations)
  - [Statistics](#statistics)
  - [Scramble/Shamble Logic](#scramble-shamble-logic)

---

## Firebase Services

### Core Services

Location: `src/firebase/services.js`

#### `initializeDefaultData()`

Initializes default data for new installations (courses, players, teams).

```javascript
await initializeDefaultData();
```

**Returns:** `Promise<void>`

**Side Effects:**
- Creates default course in Firestore if none exists
- Creates default teams if none exist
- Creates default players if none exist

---

#### `subscribeToPlayers(callback)`

Subscribe to real-time player updates.

```javascript
const unsubscribe = subscribeToPlayers((players) => {
  console.log('Current players:', players);
});

// Later: unsubscribe();
```

**Parameters:**
- `callback` (Function): Called with array of player objects when data changes

**Returns:** `Function` - Unsubscribe function

**Player Object:**
```javascript
{
  id: string,
  name: string,
  handicap: number,
  teamId?: string,
  isRegular: boolean,
  photoURL?: string
}
```

---

#### `addPlayer(playerData)`

Add a new player to Firestore.

```javascript
const newPlayer = await addPlayer({
  name: 'John Doe',
  handicap: 12,
  teamId: 'team1',
  isRegular: true
});
```

**Parameters:**
- `playerData` (Object):
  - `name` (string): Player's full name
  - `handicap` (number): Player's handicap (0-54)
  - `teamId` (string, optional): Team ID
  - `isRegular` (boolean): Whether player is a regular
  - `photoURL` (string, optional): Profile photo URL

**Returns:** `Promise<Object>` - Created player object with ID

---

#### `updatePlayer(playerId, updates)`

Update an existing player's data.

```javascript
await updatePlayer('player123', {
  handicap: 10,
  name: 'John Smith'
});
```

**Parameters:**
- `playerId` (string): Player's document ID
- `updates` (Object): Fields to update

**Returns:** `Promise<void>`

---

#### `deletePlayer(playerId)`

Delete a player from Firestore.

```javascript
await deletePlayer('player123');
```

**Parameters:**
- `playerId` (string): Player's document ID

**Returns:** `Promise<void>`

---

#### `subscribeToCourse(callback)`

Subscribe to real-time course updates.

```javascript
const unsubscribe = subscribeToCourse((course) => {
  console.log('Current course:', course);
});
```

**Parameters:**
- `callback` (Function): Called with course object when data changes

**Returns:** `Function` - Unsubscribe function

**Course Object:**
```javascript
{
  id: string,
  name: string,
  tee: string,
  holes: [{
    number: number,
    par: number,
    strokeIndex: number,
    distance?: number
  }]
}
```

---

#### `saveCourse(courseData)`

Save or update a course.

```javascript
await saveCourse({
  name: 'Pebble Beach',
  tee: 'Blue',
  holes: [...]
});
```

**Parameters:**
- `courseData` (Object): Course configuration

**Returns:** `Promise<string>` - Course document ID

---

### Tournament Services

Location: `src/firebase/tournamentServices.js`

#### `subscribeTo Tournaments(callback)`

Subscribe to real-time tournament list updates.

```javascript
const unsubscribe = subscribeToTournaments((tournaments) => {
  console.log('All tournaments:', tournaments);
});
```

**Parameters:**
- `callback` (Function): Called with array of tournament objects

**Returns:** `Function` - Unsubscribe function

---

#### `subscribeToTournament(tournamentId, callback)`

Subscribe to a specific tournament's real-time updates.

```javascript
const unsubscribe = subscribeToTournament('tournament123', (tournament) => {
  console.log('Tournament data:', tournament);
});
```

**Parameters:**
- `tournamentId` (string): Tournament document ID
- `callback` (Function): Called with tournament object when data changes

**Returns:** `Function` - Unsubscribe function

**Tournament Object:**
```javascript
{
  id: string,
  name: string,
  startDate: Timestamp,
  endDate?: Timestamp,
  status: 'draft' | 'in-progress' | 'completed',
  type: 'individual' | 'ryder-cup',
  edition: number,
  seriesId?: string,
  teams?: Array,
  rounds: [{
    id: string,
    name: string,
    format: string,
    courseData: Object,
    status: string,
    matchPairings?: Array,
    scorecards?: Array
  }]
}
```

---

#### `createTournament(tournamentData)`

Create a new tournament.

```javascript
const tournament = await createTournament({
  name: 'Summer Classic',
  type: 'individual',
  startDate: new Date(),
  rounds: []
});
```

**Parameters:**
- `tournamentData` (Object):
  - `name` (string): Tournament name
  - `type` (string): 'individual' or 'ryder-cup'
  - `startDate` (Date): Start date
  - `endDate` (Date, optional): End date
  - `seriesId` (string, optional): Series ID if part of series
  - `teams` (Array, optional): Teams for Ryder Cup format
  - `rounds` (Array): Round configurations

**Returns:** `Promise<Object>` - Created tournament with ID

---

#### `updateTournament(tournamentId, updates)`

Update tournament data.

```javascript
await updateTournament('tournament123', {
  status: 'in-progress',
  'rounds.0.status': 'completed'
});
```

**Parameters:**
- `tournamentId` (string): Tournament document ID
- `updates` (Object): Fields to update (supports dot notation)

**Returns:** `Promise<void>`

---

#### `deleteTournament(tournamentId)`

Delete a tournament and all associated data.

```javascript
await deleteTournament('tournament123');
```

**Parameters:**
- `tournamentId` (string): Tournament document ID

**Returns:** `Promise<void>`

**Side Effects:**
- Deletes all scorecards for the tournament
- Updates series if tournament was part of one

---

#### `addRoundToTournament(tournamentId, roundData)`

Add a new round to an existing tournament.

```javascript
const roundId = await addRoundToTournament('tournament123', {
  name: 'Round 2',
  format: 'best_ball',
  courseData: {...},
  matchPairings: [...]
});
```

**Parameters:**
- `tournamentId` (string): Tournament document ID
- `roundData` (Object):
  - `name` (string): Round name
  - `format` (string): Round format
  - `courseData` (Object): Course configuration
  - `matchPairings` (Array, optional): Team pairings
  - Configuration options based on format

**Returns:** `Promise<string>` - New round ID

---

#### `updateRoundInTournament(tournamentId, roundId, updates)`

Update a specific round within a tournament.

```javascript
await updateRoundInTournament('tournament123', 'round1', {
  status: 'completed'
});
```

**Parameters:**
- `tournamentId` (string): Tournament document ID
- `roundId` (string): Round ID within tournament
- `updates` (Object): Fields to update

**Returns:** `Promise<void>`

---

#### `saveScorecard(tournamentId, roundId, scorecardData)`

Save or update a scorecard for a round.

```javascript
await saveScorecard('tournament123', 'round1', {
  playerId: 'player1',
  scores: [
    { holeNumber: 1, grossScore: 5, netScore: 4, points: 2 },
    // ...
  ],
  totalGross: 85,
  totalNet: 73,
  totalPoints: 36,
  completed: true
});
```

**Parameters:**
- `tournamentId` (string): Tournament document ID
- `roundId` (string): Round ID
- `scorecardData` (Object):
  - `playerId` (string): Player ID
  - `scores` (Array): Hole-by-hole scores
  - `totalGross` (number): Total gross score
  - `totalNet` (number): Total net score
  - `totalPoints` (number): Total Stableford points
  - `completed` (boolean): Whether round is finished

**Returns:** `Promise<void>`

---

#### `initializeTournamentSeries()`

Initialize default tournament series data.

```javascript
await initializeTournamentSeries();
```

**Returns:** `Promise<void>`

**Side Effects:**
- Creates default series if none exists

---

#### `createSeries(seriesData)`

Create a new tournament series.

```javascript
const series = await createSeries({
  name: '2024 Season',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});
```

**Parameters:**
- `seriesData` (Object):
  - `name` (string): Series name
  - `startDate` (Date): Series start date
  - `endDate` (Date): Series end date
  - `status` (string, optional): 'active' or 'completed'

**Returns:** `Promise<Object>` - Created series with ID

---

### Media Services

Location: `src/firebase/mediaServices.js`

#### `uploadTournamentPhoto(tournamentId, file, onProgress)`

Upload a photo for a tournament with automatic compression.

```javascript
const photoURL = await uploadTournamentPhoto(
  'tournament123',
  fileObject,
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
);
```

**Parameters:**
- `tournamentId` (string): Tournament document ID
- `file` (File): Image file object
- `onProgress` (Function, optional): Progress callback (0-100)

**Returns:** `Promise<string>` - Download URL of uploaded photo

**Notes:**
- Images are automatically compressed to max 1920x1920px
- Maintains aspect ratio
- Reduces file size significantly

---

#### `deleteTournamentPhoto(photoURL)`

Delete a tournament photo from Firebase Storage.

```javascript
await deleteTournamentPhoto(photoURL);
```

**Parameters:**
- `photoURL` (string): Full Firebase Storage URL

**Returns:** `Promise<void>`

---

## Custom Hooks

Location: `src/hooks/`

### `useAutoSave(data, onSave, delay)`

Automatically save data after a delay when changes occur.

```javascript
import { useAutoSave } from '../hooks';

function MyComponent() {
  const [scores, setScores] = useState([]);

  const handleSave = async (dataToSave) => {
    await saveToFirebase(dataToSave);
  };

  const { triggerAutoSave, isSaving } = useAutoSave(
    scores,
    handleSave,
    2000  // 2 second delay
  );

  // Manually trigger save
  const handleScoreChange = (newScore) => {
    setScores([...scores, newScore]);
    triggerAutoSave([...scores, newScore]);
  };
}
```

**Parameters:**
- `data` (any): Data to auto-save
- `onSave` (Function): Async save function
- `delay` (number, optional): Debounce delay in ms (default: 2000)

**Returns:**
- `triggerAutoSave` (Function): Manually trigger save
- `isSaving` (boolean): Whether save is in progress

**Features:**
- Debounced saving (waits for pause in changes)
- Prevents duplicate saves
- Returns saving status

---

### `useTournamentRound(tournamentId, roundId)`

Subscribe to tournament and round data with loading states.

```javascript
import { useTournamentRound } from '../hooks';

function ScoringComponent() {
  const { tournamentId, roundId } = useParams();
  const { tournament, round, loading } = useTournamentRound(
    tournamentId,
    roundId
  );

  if (loading) return <div>Loading...</div>;

  return <div>{tournament.name} - {round.name}</div>;
}
```

**Parameters:**
- `tournamentId` (string): Tournament document ID
- `roundId` (string): Round ID within tournament

**Returns:**
- `tournament` (Object | null): Tournament data
- `round` (Object | null): Round data
- `loading` (boolean): Loading state

---

### `useSwipeGestures(onSwipeLeft, onSwipeRight, enabled)`

Detect and handle swipe gestures for touch devices.

```javascript
import { useSwipeGestures } from '../hooks/useSwipeGestures';

function HoleNavigator() {
  const [currentHole, setCurrentHole] = useState(0);

  const handleSwipeLeft = () => {
    if (currentHole < 17) setCurrentHole(currentHole + 1);
  };

  const handleSwipeRight = () => {
    if (currentHole > 0) setCurrentHole(currentHole - 1);
  };

  const swipeHandlers = useSwipeGestures(
    handleSwipeLeft,
    handleSwipeRight,
    true  // enabled
  );

  return (
    <div {...swipeHandlers}>
      Hole {currentHole + 1}
    </div>
  );
}
```

**Parameters:**
- `onSwipeLeft` (Function): Callback for left swipe
- `onSwipeRight` (Function): Callback for right swipe
- `enabled` (boolean, optional): Enable/disable gestures (default: true)

**Returns:** Object - Spread onto element to enable swipe detection

**Configuration:**
- Minimum swipe distance: 50px
- Maximum swipe duration: 500ms
- Touch-only (no mouse tracking)

---

### `useMobileOptimizations()`

Access mobile-specific features (PWA, pull-to-refresh).

```javascript
import { useMobileOptimizations } from '../hooks/useMobileOptimizations';

function App() {
  const {
    pullToRefreshDistance,
    showPWAPrompt,
    installPWA,
    dismissPWAPrompt
  } = useMobileOptimizations();

  return (
    <>
      <PullToRefresh distance={pullToRefreshDistance} />
      {showPWAPrompt && (
        <PWAInstallPrompt
          onInstall={installPWA}
          onDismiss={dismissPWAPrompt}
        />
      )}
    </>
  );
}
```

**Returns:**
- `pullToRefreshDistance` (number): Current pull distance
- `showPWAPrompt` (boolean): Whether to show PWA install prompt
- `installPWA` (Function): Trigger PWA installation
- `dismissPWAPrompt` (Function): Dismiss PWA prompt

---

### `useScoreEntry()`

Utilities for score input (increment/decrement).

```javascript
import { useScoreEntry } from '../hooks';

function ScoreInput() {
  const { increment, decrement, reset } = useScoreEntry();
  const [score, setScore] = useState(null);

  const handleIncrement = () => {
    const newScore = increment(score);
    setScore(newScore);
  };

  return (
    <button onClick={handleIncrement}>+</button>
  );
}
```

**Returns:**
- `increment(currentScore)` (Function): Increment score (null → 1, max 15)
- `decrement(currentScore)` (Function): Decrement score (min 1, 1 → null)
- `reset()` (Function): Reset to null

---

## Utility Functions

### Scoring Calculations

Location: `src/utils/`

#### `calculateStablefordPoints(grossScore, par, handicap, strokeIndex)`

Calculate Stableford points for a hole.

```javascript
import { calculateStablefordPoints } from '../utils/stablefordCalculations';

const points = calculateStablefordPoints(
  6,    // gross score
  4,    // par
  18,   // player handicap
  9     // hole stroke index
);
// Returns: 1 (one over adjusted par)
```

**Parameters:**
- `grossScore` (number): Actual strokes taken
- `par` (number): Hole par value
- `handicap` (number): Player's handicap
- `strokeIndex` (number): Hole's stroke index (1-18)

**Returns:** `number` - Stableford points (0-6+)

**Point System:**
- Albatross or better: 5 points
- Eagle: 4 points
- Birdie: 3 points
- Par: 2 points
- Bogey: 1 point
- Double bogey or worse: 0 points

---

#### `calculateStrokesReceived(handicap, strokeIndex)`

Calculate strokes received on a hole based on handicap.

```javascript
import { calculateStrokesReceived } from '../utils/stablefordCalculations';

const strokes = calculateStrokesReceived(18, 9);
// Returns: 1 (receives 1 stroke on this hole)
```

**Parameters:**
- `handicap` (number): Player's handicap
- `strokeIndex` (number): Hole's stroke index (1-18)

**Returns:** `number` - Strokes received (0, 1, or 2)

---

#### `calculateScrambleTeamHandicap(handicaps, method, customPercentages)`

Calculate team handicap for scramble/shamble formats.

```javascript
import { calculateScrambleTeamHandicap } from '../utils/scrambleCalculations';

const teamHandicap = calculateScrambleTeamHandicap(
  [10, 15, 20, 25],  // player handicaps
  'usga',            // method
  null               // no custom percentages
);
// Returns: 10.5 (25% of 10 + 20% of 15 + 15% of 20 + 10% of 25)
```

**Parameters:**
- `handicaps` (Array<number>): Array of player handicaps
- `method` (string): 'usga' or 'custom'
- `customPercentages` (Array<number>, optional): Custom percentages if method='custom'

**Returns:** `number` - Team handicap (rounded to 1 decimal)

**USGA Method:**
- 2 players: 35%, 15%
- 3 players: 30%, 20%, 10%
- 4 players: 25%, 20%, 15%, 10%

---

### Statistics

Location: `src/utils/statisticsUtils.js`

#### `calculatePlayerStatistics(playerId, tournaments, players)`

Calculate comprehensive statistics for a player.

```javascript
import { calculatePlayerStatistics } from '../utils/statisticsUtils';

const stats = calculatePlayerStatistics(
  'player123',
  tournamentsArray,
  playersArray
);
```

**Parameters:**
- `playerId` (string): Player's ID
- `tournaments` (Array): All tournaments
- `players` (Array): All players

**Returns:** Object with:
```javascript
{
  player: Object,          // Player object
  totalRounds: number,     // Total rounds played
  bestGross: number,       // Best gross score
  bestNet: number,         // Best net score
  averageGross: number,    // Average gross score
  averageNet: number,      // Average net score
  totalPoints: number,     // Total Stableford points
  scoreDistribution: {     // Score breakdown
    eagles: number,
    birdies: number,
    pars: number,
    bogeys: number,
    doubles: number
  }
}
```

---

#### `calculateTournamentAnalytics(tournament)`

Calculate analytics and insights for a tournament.

```javascript
import { calculateTournamentAnalytics } from '../utils/statisticsUtils';

const analytics = calculateTournamentAnalytics(tournamentObject);
```

**Parameters:**
- `tournament` (Object): Tournament object with rounds and scorecards

**Returns:** Object with:
```javascript
{
  totalPlayers: number,
  totalRounds: number,
  completedRounds: number,
  averageGross: number,
  averageNet: number,
  scoreDistribution: {
    eagles: number,
    birdies: number,
    pars: number,
    bogeys: number,
    doubles: number
  }
}
```

---

#### `calculateHoleDifficulty(tournament)`

Analyze hole difficulty across tournament rounds.

```javascript
import { calculateHoleDifficulty } from '../utils/statisticsUtils';

const holeDifficulty = calculateHoleDifficulty(tournamentObject);
```

**Parameters:**
- `tournament` (Object): Tournament object

**Returns:** Array of hole objects:
```javascript
[
  {
    holeNumber: number,
    par: number,
    averageScore: number,
    vsPar: number,          // Average vs par (+/-)
    difficulty: string,     // 'easy', 'medium', 'hard'
    totalScores: number     // Sample size
  }
]
```

**Difficulty Calculation:**
- Hard: Average > par + 0.5
- Medium: Average between par - 0.2 and par + 0.5
- Easy: Average < par - 0.2

---

### Scramble/Shamble Logic

Location: `src/utils/scrambleCalculations.js`

#### `ScrambleDriveTracker` Class

Track drive usage for scramble/shamble with minimum requirements.

```javascript
import { ScrambleDriveTracker } from '../utils/scrambleCalculations';

// Create tracker
const tracker = new ScrambleDriveTracker(
  teamPlayers,  // Array of player objects
  3,            // Min drives per player
  18            // Total holes
);

// Record drive selection
tracker.recordDriveUsed('player1');

// Check if player can be selected
const canSelect = tracker.canSelectPlayer('player1', 10);  // hole 10

// Get remaining drives needed
const remaining = tracker.getRemainingDrivesNeeded('player1');

// Validate completion
const isValid = tracker.validateMinimumsMet();
```

**Constructor Parameters:**
- `players` (Array): Team players
- `minDrivesPerPlayer` (number): Minimum drives required
- `totalHoles` (number): Total holes in round

**Methods:**

- `recordDriveUsed(playerId)`: Record a drive selection
- `canSelectPlayer(playerId, currentHole)`: Check if player can be selected
- `getRemainingDrivesNeeded(playerId)`: Get drives still needed for player
- `validateMinimumsMet()`: Check if all minimums are satisfied
- `getWarnings()`: Get array of warning messages
- `getStats()`: Get statistics object

---

## Error Handling

All Firebase operations may throw errors. Always wrap in try/catch:

```javascript
try {
  await updateTournament(tournamentId, updates);
} catch (error) {
  if (error.code === 'permission-denied') {
    console.error('Permission denied');
  } else if (error.code === 'not-found') {
    console.error('Document not found');
  } else {
    console.error('Error:', error.message);
  }
}
```

Common Firebase error codes:
- `permission-denied`: Firestore security rules rejection
- `not-found`: Document doesn't exist
- `unavailable`: Network issues
- `cancelled`: Operation cancelled
- `unauthenticated`: User not logged in

---

## TypeScript Support

While this is a JavaScript project, you can add type definitions for better IDE support:

```javascript
/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 * @property {number} handicap
 * @property {string} [teamId]
 * @property {boolean} isRegular
 */

/**
 * @param {string} playerId
 * @param {Partial<Player>} updates
 * @returns {Promise<void>}
 */
export async function updatePlayer(playerId, updates) {
  // ...
}
```

---

## Best Practices

### Subscriptions

Always unsubscribe when component unmounts:

```javascript
useEffect(() => {
  const unsubscribe = subscribeToTournament(tournamentId, setTournament);
  return () => unsubscribe();
}, [tournamentId]);
```

### Batch Operations

Use Firestore batch writes for multiple updates:

```javascript
import { writeBatch } from 'firebase/firestore';

const batch = writeBatch(db);
batch.update(doc1Ref, updates1);
batch.update(doc2Ref, updates2);
await batch.commit();
```

### Offline Support

Use service worker caching for offline functionality - already implemented in `public/service-worker.js`.

---

## Support

For questions or issues with the API:
1. Check this documentation
2. Review source code comments
3. Create an issue in the repository
