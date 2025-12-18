# Player Statistics Guide

**Last Updated:** 2025-12-17

## Overview

The Ryder Cup Scoring App already has robust player statistics tracking. This guide documents:
- Currently implemented statistics
- Recommended statistics by format
- Tournament-level vs Overall statistics
- Future enhancement opportunities

---

## Current Implementation

### ✅ Already Implemented

#### Player Statistics (`/players/:playerId/statistics`)

**Individual Stats:**
- Best Gross Score
- Best Net Score
- Worst Gross Score
- Average Gross Score
- Average Net Score
- Average Stableford Points
- Total Rounds Played
- Completed Rounds

**Score Distribution:**
- Eagles (≤-2)
- Birdies (-1)
- Pars (0)
- Bogeys (+1)
- Double Bogey or Worse (≥+2)

#### Tournament Analytics (`/tournaments/:tournamentId/analytics`)

**Tournament-Level Stats:**
- Total Players
- Total Rounds
- Completed Rounds
- Score Distribution (Eagles, Birdies, Pars, Bogeys, Double+)
- Hardest Holes (Top 5 by average over par)
- Easiest Holes (Top 5 by average under/closest to par)

#### Honours Board
- Career Wins (by series)
- Runners-Up
- Third Place Finishes
- Best Score Achieved
- Years Won

---

## Recommended Statistics by Format

### 1. Individual Stroke Play

**Essential Stats:**
- ✅ Best/Worst/Average Gross
- ✅ Best/Worst/Average Net
- ✅ Score Distribution
- 🆕 Scoring Trend (graph over time)
- 🆕 Rounds Under Handicap %
- 🆕 Front 9 vs Back 9 Average
- 🆕 Par 3/4/5 Performance
- 🆕 Best Round by Course

**Advanced Stats:**
- 🆕 Putting Average (if tracked)
- 🆕 Fairways Hit % (if tracked)
- 🆕 Greens in Regulation % (if tracked)
- 🆕 Scrambling % (if tracked)
- 🆕 Sand Saves % (if tracked)

### 2. Individual Stableford

**Essential Stats:**
- ✅ Best/Worst/Average Points
- ✅ Score Distribution
- 🆕 Points per Hole Average
- 🆕 Consistency (std deviation of points)
- 🆕 % Rounds Above 36 Points
- 🆕 Best Stableford Round by Course
- 🆕 Par 3/4/5 Points Average

**Advanced Stats:**
- 🆕 Birdies+ per Round Average
- 🆕 Blow-up Holes % (0 or 1 points)
- 🆕 Solid Holes % (2+ points)

### 3. Match Play (Singles/Four-Ball/Foursomes)

**Essential Stats:**
- 🆕 Match Record (W-L-H)
- 🆕 Win Percentage
- 🆕 Average Margin of Victory
- 🆕 Comebacks (wins from down)
- 🆕 Holes Won vs Lost vs Halved %
- 🆕 Performance by Format (Singles/Four-Ball/Foursomes)

**Advanced Stats:**
- 🆕 Front 9 Record vs Back 9 Record
- 🆕 Record When Up vs When Down
- 🆕 Clutch Performance (15-18th hole record)
- 🆕 Head-to-Head Records
- 🆕 Best Winning Streak
- 🆕 Most Competitive Match (closest score)

### 4. Team Formats (Scramble/Shamble/Best Ball/Team Stableford)

**Essential Stats:**
- 🆕 Teams Played With
- 🆕 Team Win %
- 🆕 Contribution Rate (your score counted %)
- 🆕 Best Team Result
- 🆕 Preferred Partners (best record with)

**Advanced Stats:**
- 🆕 Drive Selection % (Scramble)
- 🆕 Clutch Contributions (critical holes)
- 🆕 Performance by Position (A/B/C/D player)

---

## Tournament vs Overall Statistics

### Tournament-Level Stats
Display statistics for **this specific tournament only**:
- Tournament best score
- Tournament average
- Round-by-round comparison
- Position changes
- Tournament-specific achievements
- Course-specific performance

**Where to Show:**
- Tournament detail page
- Individual leaderboards
- Player profile when viewing from tournament context

### Overall Stats
Display statistics **across all tournaments**:
- Career best/worst/average
- All-time score distribution
- Career win/loss record
- Long-term trends
- Series-specific performance
- Course records

**Where to Show:**
- Player profile page (`/players/:playerId/statistics`)
- Player management screen
- Honours board
- Series leaderboards

---

## Detailed Statistics Recommendations

### Core Stroke Play Statistics

#### 1. Scoring Statistics
```javascript
{
  // Currently Implemented ✅
  bestGross: 72,
  bestNet: 68,
  worstGross: 95,
  averageGross: 82.5,
  averageNet: 73.2,

  // Recommended Additions 🆕
  medianGross: 81,
  medianNet: 72,
  standardDeviation: 4.2,
  roundsUnderHandicap: 12,
  roundsUnderHandicapPct: 54.5,
  bestRoundByCourse: {
    'Greenacres': { gross: 78, net: 69, date: '2024-03-15' },
    'Manawatu': { gross: 82, net: 73, date: '2024-06-20' }
  }
}
```

#### 2. Scoring Distribution (Enhanced)
```javascript
{
  // Currently Implemented ✅
  eagles: 5,
  birdies: 48,
  pars: 234,
  bogeys: 189,
  doublePlus: 76,

  // Recommended Additions 🆕
  albatrosses: 0,
  doublesOnly: 52,
  triples: 18,
  quadPlus: 6,

  // Percentages
  eaglesPct: 0.9,
  birdiesPct: 8.7,
  parsPct: 42.5,
  bogeysPct: 34.3,
  doublePlusPct: 13.8,

  // Par-specific
  par3Stats: {
    eagles: 0,
    birdies: 8,
    pars: 72,
    bogeys: 48,
    doublePlus: 16,
    average: 3.25
  },
  par4Stats: {
    eagles: 2,
    birdies: 28,
    pars: 124,
    bogeys: 96,
    doublePlus: 42,
    average: 4.31
  },
  par5Stats: {
    eagles: 3,
    birdies: 12,
    pars: 38,
    bogeys: 45,
    doublePlus: 18,
    average: 5.42
  }
}
```

#### 3. Front 9 vs Back 9
```javascript
{
  front9: {
    averageGross: 41.2,
    averageNet: 36.8,
    bestGross: 35,
    worstGross: 52
  },
  back9: {
    averageGross: 41.3,
    averageNet: 36.4,
    bestGross: 36,
    worstGross: 51
  },
  strongerHalf: 'front',
  averageDifference: -0.1
}
```

#### 4. Scoring Trends
```javascript
{
  last5Rounds: [78, 82, 76, 81, 79],
  last10Rounds: [78, 82, 76, 81, 79, 84, 77, 80, 83, 78],
  trendDirection: 'improving', // 'improving', 'stable', 'declining'
  trendSlope: -0.3, // scores decreasing by 0.3 per round
  bestStreak: {
    rounds: 3,
    averageScore: 76.3,
    startDate: '2024-09-01',
    endDate: '2024-09-15'
  }
}
```

### Match Play Statistics

#### 1. Match Record
```javascript
{
  overall: {
    wins: 12,
    losses: 8,
    halves: 3,
    winPct: 52.2,
    playedMatches: 23
  },

  byFormat: {
    singles: { wins: 5, losses: 4, halves: 1 },
    fourBall: { wins: 4, losses: 2, halves: 1 },
    foursomes: { wins: 3, losses: 2, halves: 1 }
  },

  bySeries: {
    'chaps-cup': { wins: 8, losses: 5, halves: 2 },
    'winter-classic': { wins: 4, losses: 3, halves: 1 }
  }
}
```

#### 2. Match Performance
```javascript
{
  averageMargin: {
    wins: 3.2, // Average holes up when winning
    losses: -2.8 // Average holes down when losing
  },

  biggestWin: {
    margin: '6&5',
    opponent: 'Player X',
    date: '2024-06-15',
    tournamentId: 'abc123'
  },

  biggestLoss: {
    margin: '5&4',
    opponent: 'Player Y',
    date: '2024-03-20',
    tournamentId: 'xyz789'
  },

  comebacks: {
    total: 4,
    bestComeback: {
      from: '3 down after 12',
      margin: '1 up',
      opponent: 'Player Z',
      date: '2024-08-10'
    }
  },

  holePerformance: {
    holesWon: 156,
    holesLost: 143,
    holesHalved: 115,
    holeWinPct: 37.7
  },

  clutchPerformance: {
    holes15to18: {
      won: 28,
      lost: 22,
      halved: 15,
      winPct: 43.1
    }
  }
}
```

#### 3. Head-to-Head Records
```javascript
{
  headToHead: [
    {
      opponentId: 'player-x',
      opponentName: 'Player X',
      wins: 3,
      losses: 2,
      halves: 1,
      lastPlayed: '2024-09-15',
      lastResult: 'W 2&1'
    }
    // ... more opponents
  ]
}
```

### Team Format Statistics

#### 1. Team Performance
```javascript
{
  teamsPlayedWith: [
    {
      partnerId: 'player-y',
      partnerName: 'Player Y',
      roundsPlayed: 8,
      averageScore: 68.5,
      bestScore: 63,
      wins: 5, // If match play
      losses: 3
    }
    // ... more partners
  ],

  contributionRate: {
    scramble: {
      drivesUsed: 45,
      drivesUsedPct: 31.2,
      approachesUsed: 52,
      approachesUsedPct: 36.1,
      puttsUsed: 38,
      puttsUsedPct: 26.4
    },
    bestBall: {
      holesCountingScore: 78,
      holesCountingPct: 43.3
    },
    teamStableford: {
      pointsContributed: 145,
      pointsContributedPct: 40.3
    }
  }
}
```

### Stableford-Specific Statistics

```javascript
{
  stableford: {
    bestPoints: 42,
    worstPoints: 24,
    averagePoints: 34.6,

    roundsAbove36: 8,
    roundsAbove36Pct: 36.4,

    pointsPerHole: {
      average: 1.92,
      par3Avg: 1.85,
      par4Avg: 1.90,
      par5Avg: 2.05
    },

    consistency: {
      standardDeviation: 4.2,
      blowUpHoles: 24, // 0 or 1 points
      solidHoles: 312, // 2+ points
      solidHolesPct: 65.0
    },

    birdiesPlus: {
      total: 89,
      perRound: 4.05,
      fromPar3: 14,
      fromPar4: 48,
      fromPar5: 27
    }
  }
}
```

### Course-Specific Statistics

```javascript
{
  byCourse: [
    {
      courseName: 'Greenacres Golf Club',
      roundsPlayed: 12,
      bestGross: 78,
      bestNet: 69,
      averageGross: 84.2,
      averageNet: 75.2,
      bestStableford: 41,
      favoriteHole: {
        number: 7,
        par: 5,
        averageScore: 4.8,
        birdies: 4
      },
      troubleHole: {
        number: 14,
        par: 4,
        averageScore: 5.3,
        doublePlus: 6
      }
    }
    // ... more courses
  ]
}
```

---

## Implementation Priorities

### Phase 1: Essential Enhancements (High Priority)

1. **Match Play Records**
   - W-L-H record by format
   - Win percentage
   - Head-to-head records

2. **Scoring Trends**
   - Last 5/10 rounds graph
   - Trend direction indicator
   - Performance over time

3. **Tournament-Specific Stats**
   - Best score in this tournament
   - Round-by-round comparison
   - Position tracking

4. **Par-Specific Performance**
   - Par 3 average
   - Par 4 average
   - Par 5 average

### Phase 2: Advanced Stats (Medium Priority)

1. **Front 9 vs Back 9**
   - Half-round averages
   - Stronger half identification

2. **Team Performance**
   - Preferred partners
   - Contribution rates
   - Team win %

3. **Course Records**
   - Best score by course
   - Course-specific trends
   - Favorite/trouble holes

4. **Consistency Metrics**
   - Standard deviation
   - Rounds under handicap %
   - Blow-up hole tracking

### Phase 3: Pro-Level Analytics (Low Priority)

1. **Advanced Shot Statistics**
   - Driving accuracy/distance
   - GIR %
   - Putting average
   - Scrambling %
   - Sand saves %

2. **Predictive Analytics**
   - Expected score range
   - Win probability
   - Form rating

3. **Comparative Analysis**
   - Peer comparisons
   - Handicap bracket performance
   - Series rankings

---

## Data Structure Recommendations

### Player Document Enhancement

```javascript
// Firestore: players/{playerId}
{
  // Existing fields
  id: 'player-123',
  name: 'John Smith',
  email: 'john.smith@rydercup.local',
  handicap: 12.5,

  // New fields for caching (updated on scorecard completion)
  statistics: {
    lastUpdated: timestamp,

    allTime: {
      roundsPlayed: 24,
      roundsCompleted: 22,
      bestGross: 72,
      bestNet: 68,
      averageGross: 82.5,
      // ... other stats
    },

    last12Months: {
      roundsPlayed: 12,
      averageGross: 80.2,
      // ... other stats
    },

    matchPlay: {
      wins: 12,
      losses: 8,
      halves: 3,
      // ... other match stats
    }
  }
}
```

### Match Result Enhancement

```javascript
// In tournament rounds with match play
{
  rounds: [{
    format: 'four_ball',
    matches: [{
      id: 'match-123',
      team1Players: ['player-1', 'player-2'],
      team2Players: ['player-3', 'player-4'],
      result: 'team1',
      margin: '3&2',

      // Add detailed hole results
      holeResults: [
        { hole: 1, team1Score: 4, team2Score: 5, result: 'team1' },
        { hole: 2, team1Score: 3, team2Score: 3, result: 'halved' },
        // ... all 18 holes
      ],

      // Add match state tracking
      matchState: [
        { afterHole: 1, team1Up: 1 },
        { afterHole: 2, team1Up: 1 },
        { afterHole: 3, team1Up: 2 },
        // ... track match score after each hole
      ]
    }]
  }]
}
```

---

## UI/UX Recommendations

### 1. Player Profile Stats Page
- **Header**: Player name, handicap, total rounds
- **Key Stats Grid**: Best/Avg/Worst scores (4 cards)
- **Score Distribution Chart**: Visual bar chart
- **Tabs**:
  - Overview (all-time stats)
  - Match Play (if applicable)
  - By Course
  - Trends

### 2. Tournament Stats Integration
- Add "View Analytics" button to Tournament Detail page
- Show quick stats in leaderboard hover/tooltip
- Add player stats comparison view

### 3. Leaderboard Enhancements
- Show player's average score in tooltip
- Display recent form indicator (🔥🔴⚪)
- Add "vs Par 3/4/5" breakdown

### 4. Match Play Leaderboard
- Show W-L-H record
- Display head-to-head history on match detail
- Add "clutch player" badge (high win % in close matches)

---

## API/Service Methods Needed

### New Methods in `statisticsUtils.js`

```javascript
// Match play statistics
export const calculateMatchPlayStatistics = (playerId, tournaments) => { ... }

// Par-specific statistics
export const calculateParSpecificStats = (playerId, tournaments) => { ... }

// Front/back 9 statistics
export const calculateHalfRoundStats = (playerId, tournaments) => { ... }

// Team format statistics
export const calculateTeamStatistics = (playerId, tournaments) => { ... }

// Course-specific statistics
export const calculateCourseStatistics = (playerId, tournaments) => { ... }

// Scoring trends
export const calculateScoringTrends = (playerId, tournaments) => { ... }

// Tournament-specific statistics
export const calculateTournamentStatistics = (playerId, tournament) => { ... }
```

---

## Testing Considerations

### Statistics Calculation Tests

```javascript
describe('Match Play Statistics', () => {
  test('calculates W-L-H record correctly');
  test('calculates win percentage');
  test('tracks head-to-head records');
  test('calculates average margin');
});

describe('Par-Specific Statistics', () => {
  test('separates par 3/4/5 performance');
  test('calculates averages by par');
});

describe('Scoring Trends', () => {
  test('identifies improving trend');
  test('identifies declining trend');
  test('calculates trend slope');
});
```

---

## Summary

### Currently Implemented ✅
- Individual stroke play statistics
- Score distribution tracking
- Tournament analytics
- Honours board with career wins

### High Value Additions 🆕
1. **Match play records and statistics**
2. **Tournament-specific vs career stats separation**
3. **Scoring trends over time**
4. **Par 3/4/5 performance breakdown**
5. **Team format contribution tracking**
6. **Course-specific records**

### Quick Wins
- Add "View Stats" links from player cards
- Show recent form on leaderboards
- Display tournament best scores
- Add match play W-L-H records

---

## Next Steps

1. ✅ Document current implementation (this file)
2. Prioritize statistics enhancements
3. Design new statistics UI components
4. Implement Phase 1 enhancements
5. Add tests for new calculations
6. Update existing components with stat links
7. Deploy and gather user feedback

---

*For questions or suggestions about player statistics, see the development team or raise an issue on GitHub.*
