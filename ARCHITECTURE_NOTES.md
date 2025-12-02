# Ryder Cup Scoring - Architecture Notes

## Critical Architecture Principles

### Tournament Structure Hierarchy

**CRITICAL: A TOURNAMENT consists of one or more ROUNDS. It is the ROUNDS that have a FORMAT, NOT the tournament.**

```
Tournament (Container)
├── hasTeams: boolean (Individual vs Team tournament)
├── name, dates, players[]
├── teams[] (only if hasTeams = true)
└── Rounds[] (Each round is independent)
    ├── Round 1
    │   ├── format: 'four_ball'
    │   ├── date, name
    │   ├── courseData
    │   └── matches[] or scorecards[]
    ├── Round 2
    │   ├── format: 'foursomes'
    │   ├── date, name
    │   ├── courseData
    │   └── matches[] or scorecards[]
    └── Round 3
        ├── format: 'individual_stroke'
        ├── date, name
        ├── courseData
        └── matches[] or scorecards[]
```

#### Real-World Example: The Ryder Cup
The Ryder Cup is a perfect example:
- **Tournament**: "2023 Ryder Cup at Marco Simone Golf Club" (hasTeams = true)
  - **Round 1 (Friday Morning)**: Four-ball format
  - **Round 2 (Friday Afternoon)**: Foursomes format
  - **Round 3 (Saturday Morning)**: Four-ball format
  - **Round 4 (Saturday Afternoon)**: Foursomes format
  - **Round 5 (Sunday)**: Singles match play format

Each ROUND has its own format. The tournament itself doesn't have a single format - it's a container for multiple rounds with different formats.

#### Real-World Example: Club Championship
Multi-day stroke play tournament:
- **Tournament**: "2024 Club Championship" (hasTeams = false)
  - **Round 1 (Saturday)**: Individual Stroke Play
  - **Round 2 (Sunday)**: Individual Stroke Play
  - Winner determined by total strokes across both rounds

#### Tournament-Level Properties
- **hasTeams**: Boolean indicating if this is a team tournament or individual tournament
  - If `true`: Tournament has teams (e.g., Ryder Cup, Scramble event)
  - If `false`: Individual competition (e.g., Club Championship)
- **name**: Tournament name
- **series**: Optional tournament series
- **dates**: Start and end dates
- **players**: List of participating players
- **teams**: (Only if hasTeams=true) Team assignments

#### Round-Level Properties
- **format**: The specific golf format for THIS round (e.g., 'four_ball', 'foursomes', 'individual_stroke', etc.)
- **name**: Round name (e.g., "Friday Morning", "Round 1")
- **date**: Round date
- **courseData**: Course configuration
- **status**: 'not_started', 'in_progress', 'completed'

### Format Selection
- Formats are selected PER ROUND using the FormatExplainerModal
- The tournament creation screen should NOT have a format dropdown
- Each round must have its format set before tournament creation

### Scoring Data Structure

#### Match Play (for team formats like Ryder Cup)
Rounds with match play formats store results in `matches[]`:
```javascript
matches: [
  {
    team1Players: ['player1', 'player2'],
    team2Players: ['player3', 'player4'],
    status: 'in_progress',
    holeScores: [
      { holeNumber: 1, team1Score: 4, team2Score: 5, winner: 'team1' },
      { holeNumber: 2, team1Score: 3, team2Score: 3, winner: 'halved' }
    ]
  }
]
```

#### Individual Play (stroke play, stableford)
Rounds with individual formats store results in `scorecards[]`:
```javascript
scorecards: [
  {
    playerId: 'player1',
    status: 'in_progress',
    holes: [
      {
        holeNumber: 1,
        grossScore: 4,
        netScore: 3,  // After handicap strokes
        stablefordPoints: 3  // Only for stableford format
      }
    ],
    totalGross: 72,
    totalNet: 68,
    totalStableford: 38  // Only for stableford format
  }
]
```

### Course Data Structure

Each round has a `courseData` object that defines the holes:
```javascript
courseData: {
  courseName: 'Akarana Golf Club',
  teeBox: 'White',
  totalPar: 72,
  holes: [
    {
      number: 1,
      par: 4,
      strokeIndex: 5,  // Handicap allocation (1-18)
      distance: 350    // meters
    }
    // ... 18 holes total
  ]
}
```

**Stroke Index**: Determines handicap stroke allocation (1 = hardest, 18 = easiest)

### Data Validation
- **CRITICAL**: Firebase does NOT accept `undefined` values
- Use `null` for optional fields, or omit them entirely
- When creating tournaments, carefully filter out undefined values
- Always validate that rounds have formats before saving

## Available Formats

### Individual Formats
- `individual_stroke`: Individual Stroke Play
- `individual_stableford`: Individual Stableford
- `match_play_singles`: Match Play - Singles

### Team Formats (Match Play)
- `four_ball`: Four-Ball (Better Ball)
- `foursomes`: Foursomes (Alternate Shot)

### Team Formats (Stroke Play)
- `scramble`: Scramble / Ambrose
- `best_ball`: Best Ball (Stroke Play)
- `team_stableford`: Team Stableford
- `shamble`: Shamble

## Tournament Creation Workflow

### Step-by-Step Process

**Step 1: Basic Information**
- Tournament name, edition/year, dates
- Select tournament series (optional)
- Choose Tournament Type: Individual or Team

**Step 2: Player Selection**
- Select all participants from player database
- All formats require players to be selected first

**Step 3: Team Setup (ONLY if hasTeams = true)**
- Create teams (typically 2 for Ryder Cup)
- Set team names and colors
- Assign players to teams
- **SKIP this step for individual tournaments**

**Step 4: Round Configuration**
- Add rounds (one per day/session)
- For EACH round independently:
  - Set round name (e.g., "Friday Morning", "Round 1")
  - Set date
  - **SELECT FORMAT** (using FormatExplainerModal)
  - Course configuration (done later in tournament detail)

**Step 5: Review & Create**
- Validate all rounds have formats
- Validate teams are properly configured (if team tournament)
- Create tournament in Firebase

### Format Selection Per Round

**Critical**: Each round gets its own format selection. Examples:

**Ryder Cup Tournament** (hasTeams = true):
- Round 1: Four-Ball (Better Ball)
- Round 2: Foursomes (Alternate Shot)
- Round 3: Four-Ball again
- Round 4: Foursomes again
- Round 5: Match Play Singles

**Multi-Day Stroke Play** (hasTeams = false):
- Round 1: Individual Stroke Play
- Round 2: Individual Stroke Play

**Mixed Format Event** (hasTeams = false):
- Round 1: Individual Stableford
- Round 2: Individual Stroke Play

## Common Mistakes to Avoid

1. ❌ DON'T add a format field to the tournament
2. ✅ DO add format to each individual round
3. ❌ DON'T send `undefined` values to Firebase
4. ✅ DO use `null` or omit optional fields
5. ❌ DON'T assume all rounds have the same format
6. ✅ DO allow different formats for different rounds
7. ❌ DON'T create matches[] for individual formats
8. ✅ DO use scorecards[] for individual formats and matches[] for team formats
9. ❌ DON'T forget to validate round formats before tournament creation
10. ✅ DO show clear validation errors if rounds lack formats
