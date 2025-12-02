# Tournament Data Model

This document describes the new multi-tournament data architecture for the Ryder Cup Scoring Application.

## Overview

The system is built around three main concepts:
1. **Tournament Series** - Recurring tournament types (e.g., Ryder Cup, Chaps Cup)
2. **Tournaments** - Individual tournament editions within a series
3. **Honours Board** - Historical winners and achievements

## Collections

### 1. Tournament Series (`tournamentSeries`)

Represents a recurring tournament type with specific format and rules.

```javascript
{
  id: string,                    // Auto-generated Firestore ID
  name: string,                  // "Ryder Cup", "Chaps Cup", etc.
  description: string,           // Tournament description
  format: string,                // Tournament format type (see below)
  theming: string,               // 'ryder_cup' or 'neutral'
  isRecurring: boolean,          // Is this a recurring series?
  frequency: string | null,      // '2_per_year', 'annual', etc.
  createdAt: string,             // ISO timestamp
  updatedAt: string              // ISO timestamp
}
```

#### Tournament Formats

- `ryder_cup` - Team match play (foursomes, fourball, singles)
- `individual_stableford` - Individual points-based competition
- `scramble` - Team ambrose/scramble format
- `team_stableford` - 2-person teams, best Stableford per hole
- `best_ball` - Four-ball best ball format
- `shamble` - Scramble drive, individual play after
- `multi_day` - Multi-day stroke play tournament

### 2. Tournaments (`tournaments`)

Individual tournament editions within a series, or standalone tournaments.

```javascript
{
  id: string,                    // Auto-generated Firestore ID
  seriesId: string | null,       // Reference to tournament series (null for standalone tournaments)
  name: string,                  // Tournament name
  edition: string | null,        // "2025" or "October 2025"

  // Course info
  courseName: string,            // Course name
  courseId: string | null,       // Reference to saved course

  // Dates
  startDate: string,             // ISO date
  endDate: string,               // ISO date

  // Status
  status: string,                // 'setup', 'in_progress', 'completed'
  format: string,                // Same as series format

  // Participants
  players: string[],             // Array of player IDs
  teams: Object | null,          // Team configuration (for team formats)

  // Results
  winner: string | null,         // Winner name/team
  winnerDetails: Object | null,  // Score, margin, etc.
  results: Array,                // All player/team results

  // Rounds (NEW)
  rounds: Array,                 // Array of round objects (see Round structure below)

  // Media
  photos: Array,                 // Array of photo URLs
  videos: Array,                 // Array of video URLs

  // Metadata
  notes: string,                 // Tournament notes
  createdAt: string,             // ISO timestamp
  updatedAt: string              // ISO timestamp
}
```

#### Tournament Status Flow

1. **setup** - Tournament created, configuring participants
2. **in_progress** - Tournament active, scores being recorded
3. **completed** - Tournament finished, winner declared

#### Round Structure

Each tournament can have one or more rounds. A round represents a single day/session of play.

```javascript
{
  id: string,                    // Unique round ID (e.g., "round1", "round2")
  roundNumber: number,           // 1, 2, 3, etc.
  name: string,                  // "Round 1", "Morning Foursomes", "Final Round", etc.
  date: string,                  // ISO date for this round
  status: string,                // 'not_started', 'in_progress', 'completed'

  // Course Information
  courseId: string | null,       // Reference to saved course (if using saved course)
  courseName: string,            // Course name for this round
  courseData: Object,            // Hole data (par, stroke index) for this round

  // Match/Scorecard Data (format-specific)
  matches: Array,                // For match play formats (Ryder Cup)
  scorecards: Array,             // For stroke/stableford formats

  // Round Results
  roundResults: Array,           // Results specific to this round

  createdAt: string,
  updatedAt: string
}
```

**Course Data Structure within Round:**
```javascript
courseData: {
  holes: [
    {
      number: 1,
      par: 4,
      strokeIndex: 7
    },
    // ... 18 holes total
  ],
  totalPar: 72
}
```

**Example - Single Round Tournament:**
```javascript
rounds: [
  {
    id: "round1",
    roundNumber: 1,
    name: "Round 1",
    date: "2025-11-29",
    status: "not_started",
    courseName: "Akarana Golf Course",
    courseData: { holes: [...], totalPar: 72 },
    matches: [],
    scorecards: []
  }
]
```

**Example - Multi-Day Ryder Cup:**
```javascript
rounds: [
  {
    id: "round1",
    roundNumber: 1,
    name: "Day 1 - Morning Foursomes",
    date: "2025-11-29",
    status: "completed",
    courseName: "Akarana Golf Course",
    courseData: { holes: [...], totalPar: 72 },
    matches: [/* 4 foursomes matches */]
  },
  {
    id: "round2",
    roundNumber: 2,
    name: "Day 1 - Afternoon Fourball",
    date: "2025-11-29",
    status: "in_progress",
    courseName: "Akarana Golf Course",
    courseData: { holes: [...], totalPar: 72 },
    matches: [/* 4 fourball matches */]
  },
  {
    id: "round3",
    roundNumber: 3,
    name: "Day 2 - Singles",
    date: "2025-11-30",
    status: "not_started",
    courseName: "Akarana Golf Course",
    courseData: { holes: [...], totalPar: 72 },
    matches: [/* 12 singles matches */]
  }
]
```

### 3. Honours Board (`honoursBoard`)

Historical winners for display on the honours board.

```javascript
{
  id: string,                    // Auto-generated Firestore ID
  seriesId: string,              // Reference to tournament series
  tournamentId: string | null,   // Reference to tournament (if exists)
  year: number,                  // Year (e.g., 2024)
  edition: string | null,        // Edition label (e.g., "October")

  // Winner info
  winner: string,                // Winner name(s)
  winnerDetails: Object,         // Score details, team members, etc.

  // Tournament info
  courseName: string,            // Course name
  date: string,                  // ISO date

  // Display
  photos: string[],              // Photo URLs for honours board
  summary: string,               // Summary text

  // Metadata
  createdAt: string,             // ISO timestamp
  updatedAt: string              // ISO timestamp
}
```

## Relationships

```
Tournament Series (1) ──→ (many) Tournaments
                     └──→ (many) Honours Board Entries

Players (many) ←──→ (many) Tournaments
```

## Default Tournament Series

Four tournament series are initialized on first app load:

1. **Ryder Cup**
   - Format: `ryder_cup`
   - Theming: `ryder_cup` (blue vs red)
   - Frequency: Annual

2. **Chaps Cup**
   - Format: `individual_stableford`
   - Theming: `neutral`
   - Frequency: 2 per year

3. **Josef Memorial**
   - Format: `scramble`
   - Theming: `neutral`
   - Frequency: Annual

4. **Dodo Cup**
   - Format: `team_stableford`
   - Theming: `neutral`
   - Frequency: Annual

## Theming

### Ryder Cup Theme
- Team 1 (Tawa Lads): Red (#DC2626)
- Team 2 (Rest of World): Blue (#2563EB)
- Dynamic team-based color scheme throughout UI

### Neutral Theme
- Primary: Purple (#667eea)
- Secondary: Purple (#764ba2)
- Modern gradient backgrounds

### Honours Board Theme
- Gold: #d4af37
- Wood: #2c1810
- Classic golf club aesthetic
- Serif fonts (Playfair Display)

## Player Data

Players are stored separately and referenced by ID in tournaments. Each player has:

```javascript
{
  id: string,
  name: string,
  handicap: number,              // Decimal (e.g., 12.5)
  teamId: string | null,         // Current team (for Ryder Cup)
  handicapHistory: Array,        // Historical handicap changes
  createdAt: string,
  updatedAt: string
}
```

### Handicap History Entry

```javascript
{
  handicap: number,              // Handicap value
  date: string,                  // ISO timestamp
  tournamentId: string | null,   // Associated tournament
  reason: string                 // Change reason
}
```

## Historic Data to Import

### Josef Memorial (2021-2024)
- Winner: Team Trump (Cyril, Stu, DC, Dodo)
- 4 consecutive wins

### Dodo Cup (2024)
- Winners: Guru & Cyril

### Chaps Cup (October 2025)
- Winner: Dumpy
- Score: 42 points
- Course: Akarana Golf Course

## Media Storage

Photos and videos are stored in Firebase Storage:
- Path: `/tournaments/{tournamentId}/photos/`
- Path: `/tournaments/{tournamentId}/videos/`
- Limits: 50 photos, 10 videos per tournament
- Optimization: Images compressed client-side before upload

## Queries

### Get all tournaments for a series
```javascript
const tournaments = await getTournaments(seriesId);
```

### Get honours board for a series
```javascript
const entries = await getHonoursBoardEntries(seriesId);
```

### Subscribe to tournament changes
```javascript
const unsubscribe = subscribeToTournament(tournamentId, (tournament) => {
  console.log('Tournament updated:', tournament);
});
```

## Migration Path

The existing Ryder Cup functionality will remain intact while new tournament features are added:

1. Current `tournament`, `matches`, `teams` collections remain for active Ryder Cup
2. New tournaments use the new architecture
3. Historic Ryder Cups can be imported into the new system
4. Gradual migration to new system over time
