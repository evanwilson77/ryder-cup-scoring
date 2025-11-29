# Ryder Cup Scoring App - FINAL Major Upgrade Plan

## Executive Summary

This final plan incorporates all feedback to create a modern, clean golf tournament management platform with a classic honours board aesthetic and proper support for all tournament types.

**Critical Design Updates:**
- ✅ **Modern UI** throughout the app (clean, minimal, mobile-first)
- ✅ **Classic aesthetic ONLY for Honours Board** (traditional golf club look)
- ✅ **Ryder Cup theming** (blue vs red teams) - isolated to Ryder Cup tournaments
- ✅ **Neutral theming** for all other tournaments
- ✅ **Team Stableford format** added (Dodo Cup)
- ✅ **Multiple tournaments per year** per series (e.g., 2x Chaps Cup annually)

---

## 1. Historic Tournament Data to Enter

### 1.1 Josef Memorial (Ambrose/Scramble)
**Format:** 4-person Ambrose/Scramble
**Recurring:** Annual
**Historic Winners:**
- **2024:** Team Trump (Cyril, Stu, DC, Dodo)
- **2023:** Team Trump (Cyril, Stu, DC, Dodo)
- **2022:** Team Trump (Cyril, Stu, DC, Dodo)
- **2021:** Team Trump (Cyril, Stu, DC, Dodo)

### 1.2 Dodo Cup (Team Stableford)
**Format:** 2-person Team Stableford over multiple rounds
**Recurring:** Annual (or periodic)
**Historic Winners:**
- **2024:** Guru & Cyril

**Notes:**
- NEW format to implement: Team Stableford
- Multi-round support required
- Each player plays their own ball
- Best Stableford score per hole counts for team

### 1.3 Chaps Cup (Individual Stableford)
**Format:** Individual Stableford, single round
**Recurring:** 2 per year (typically)
**Historic Winners:**
- **2025 October:** Dumpy (at Akarana Golf Course)
- _(Need 2021-2024 data)_

**Notes:**
- Historic series with multiple editions per year
- Each edition is separate tournament
- Different courses may be used

---

## 2. Tournament Types & Formats (UPDATED)

### 2.1 Ryder Cup Format
- **UI Theme:** Red vs Blue teams with team colors throughout
- **Existing functionality preserved**
- **Team colors:**
  - Team 1: Red (#DC2626)
  - Team 2: Blue (#2563EB)
- **Color applied to:**
  - Leaderboard team sections
  - Score entry sections
  - Match cards
  - Team badges

### 2.2 Chaps Cup (Individual Stableford Series)
- **UI Theme:** Neutral (no team colors)
- **2 tournaments per year** typical
- **Each edition:** Separate tournament in series
- **Naming convention:** "Chaps Cup October 2025", "Chaps Cup March 2025"

### 2.3 Individual Stableford (Generic)
- **UI Theme:** Neutral
- **One-off or recurring**

### 2.4 Josef Memorial (Ambrose/Scramble Series)
- **UI Theme:** Neutral
- **Annual recurring**
- **Team format:** 4-person Ambrose

### 2.5 Dodo Cup (Team Stableford) ⭐ NEW
- **UI Theme:** Neutral
- **Format:** 2-person teams
- **Scoring:** Stableford (best ball per hole)
- **Multi-round:** Typically 2-3 rounds
- **Each player:** Plays own ball
- **Team score:** Best Stableford points per hole

**Dodo Cup Scoring Logic:**
```javascript
Hole 1 - Par 4 - SI 10

Team: Guru (HCP 15) & Cyril (HCP 8)

Guru: Gross 5, Net 4 (1 stroke received), Points 2 (par)
Cyril: Gross 4, Net 4 (no stroke), Points 2 (par)

Team score for hole: 2 points (best of 2 and 2)

---

Hole 2 - Par 3 - SI 15

Guru: Gross 3, Net 2 (1 stroke received), Points 4 (eagle)
Cyril: Gross 4, Net 4 (no stroke), Points 1 (bogey)

Team score for hole: 4 points (best of 4 and 1)
```

**Multi-Round Cumulative:**
- Round 1: 72 points
- Round 2: 75 points
- Total: 147 points

### 2.6 Best Ball / Shamble / Multi-Day Stableford
- **UI Theme:** Neutral
- As previously planned

---

## 3. UI/UX Design System

### 3.1 Design Philosophy

**Main App: Modern & Clean**
- Minimal, uncluttered interfaces
- Generous white space
- Crisp typography (sans-serif: Inter, SF Pro, Roboto)
- Subtle shadows and borders
- Mobile-first responsive design
- Modern card-based layouts
- Smooth animations and transitions

**Honours Board: Classic Golf Club**
- Traditional aesthetic ONLY in honours board section
- Serif typography (Georgia, Playfair Display)
- Gold/brass engraving effect
- Dark wood background texture
- Shield or crest design
- Ornate borders and dividers
- Timeless, prestigious feel

### 3.2 Color System

**Global App Colors (Neutral):**
```css
--primary: #667eea (purple-blue)
--primary-dark: #5568d3
--secondary: #764ba2 (purple)

--success: #28a745 (green)
--warning: #ffc107 (amber)
--danger: #dc3545 (red)

--neutral-50: #f9fafb
--neutral-100: #f3f4f6
--neutral-200: #e5e7eb
--neutral-300: #d1d5db
--neutral-400: #9ca3af
--neutral-500: #6b7280
--neutral-600: #4b5563
--neutral-700: #374151
--neutral-800: #1f2937
--neutral-900: #111827

--text-primary: #111827
--text-secondary: #6b7280
--text-tertiary: #9ca3af

--background: #ffffff
--surface: #f9fafb
--border: #e5e7eb
```

**Ryder Cup Theme Colors (Applied ONLY to Ryder Cup tournaments):**
```css
--ryder-team1: #DC2626 (red)
--ryder-team1-light: #FEE2E2
--ryder-team1-dark: #991B1B

--ryder-team2: #2563EB (blue)
--ryder-team2-light: #DBEAFE
--ryder-team2-dark: #1E40AF
```

**Honours Board Colors:**
```css
--honours-wood: #2c1810 (dark walnut)
--honours-gold: #d4af37 (metallic gold)
--honours-brass: #b5a642
--honours-cream: #f5f5dc
```

### 3.3 Typography

**Main App:**
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

h1: 32px/1.2, font-weight: 700
h2: 24px/1.3, font-weight: 600
h3: 20px/1.4, font-weight: 600
body: 16px/1.5, font-weight: 400
small: 14px/1.5, font-weight: 400
```

**Honours Board:**
```css
--font-serif: 'Playfair Display', 'Georgia', 'Times New Roman', serif;

h1: 48px/1.2, font-weight: 700, letter-spacing: 0.02em
h2: 36px/1.3, font-weight: 600
body: 18px/1.6, font-weight: 400
```

### 3.4 Component Examples

**Modern App Card:**
```
┌─────────────────────────────────────┐
│  Tournament: Chaps Cup Oct 2025     │
│  ─────────────────────────────      │
│                                     │
│  Date: October 15, 2025             │
│  Course: Akarana Golf Course        │
│  Players: 16                        │
│                                     │
│  Winner: Dumpy (42 pts)             │
│                                     │
│  [View Details] [Photo Gallery]     │
│                                     │
└─────────────────────────────────────┘
```

**Honours Board Entry:**
```
╔═════════════════════════════════════╗
║          HONOURS BOARD              ║
║                                     ║
║         ⚜ CHAPS CUP ⚜              ║
║                                     ║
║  ═══════════════════════════════    ║
║                                     ║
║   2025 October                      ║
║   DUMPY                             ║
║   42 Points                         ║
║   Akarana Golf Course               ║
║                                     ║
║  ═══════════════════════════════    ║
║                                     ║
║   2024 [Previous Winners...]        ║
║                                     ║
╚═════════════════════════════════════╝
```

### 3.5 Theming System Implementation

**Theme Context:**
```javascript
const TournamentThemeContext = createContext();

function TournamentThemeProvider({ tournament, children }) {
  const theme = useMemo(() => {
    // Ryder Cup gets team colors
    if (tournament.type === 'ryder-cup') {
      return {
        type: 'ryder-cup',
        team1Color: '#DC2626',
        team2Color: '#2563EB',
        team1Name: tournament.team1Name,
        team2Name: tournament.team2Name
      };
    }

    // All other tournaments get neutral theme
    return {
      type: 'neutral',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2'
    };
  }, [tournament]);

  return (
    <TournamentThemeContext.Provider value={theme}>
      {children}
    </TournamentThemeContext.Provider>
  );
}
```

**Usage in Components:**
```javascript
function ScoreEntry() {
  const theme = useContext(TournamentThemeContext);

  return (
    <div className="score-entry">
      {theme.type === 'ryder-cup' ? (
        <>
          <div style={{ borderTopColor: theme.team1Color }}>
            <h4 style={{ color: theme.team1Color }}>
              {theme.team1Name}
            </h4>
            {/* ... */}
          </div>
          <div style={{ borderTopColor: theme.team2Color }}>
            <h4 style={{ color: theme.team2Color }}>
              {theme.team2Name}
            </h4>
            {/* ... */}
          </div>
        </>
      ) : (
        <>
          <div className="neutral-team-section">
            <h4>Team 1</h4>
            {/* ... */}
          </div>
          <div className="neutral-team-section">
            <h4>Team 2</h4>
            {/* ... */}
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 4. Team Stableford Format (Dodo Cup)

### 4.1 Format Specification

**Dodo Cup Rules:**
- 2-person teams
- Each player plays their own ball
- Stableford scoring for each player
- Best Stableford score per hole counts for team
- Multi-round tournament (typically 2-3 rounds)
- Cumulative team points determine winner

### 4.2 Scoring Interface

```
+──────────────────────────────────────+
|    Dodo Cup 2024 - Round 1           |
+──────────────────────────────────────+
| Team: Guru & Cyril                   |
| Hole 5 - Par 4 - SI 12               |
+──────────────────────────────────────+
| Guru (HCP 15):                       |
| Gross: [-] [5] [+]                   |
| Net: 4 (1 stroke received)           |
| Points: 2 (Par) •                    |
+──────────────────────────────────────+
| Cyril (HCP 8):                       |
| Gross: [-] [4] [+]                   |
| Net: 4 (no strokes)                  |
| Points: 2 (Par) •                    |
+──────────────────────────────────────+
| Team Score for Hole: 2 points        |
| (Best of: 2 and 2)                   |
+──────────────────────────────────────+
| Round Progress:                      |
| Holes: 5/18                          |
| Round Total: 12 points               |
+──────────────────────────────────────+
| [< Previous] [Next Hole →]           |
+──────────────────────────────────────+
```

### 4.3 Multi-Round Leaderboard

```
+──────────────────────────────────────+
|    Dodo Cup 2024 - Leaderboard       |
+──────────────────────────────────────+
| Round: [All Rounds ▼] [R1] [R2]      |
+──────────────────────────────────────+
| Pos | Team           | R1  | R2  | Tot|
+──────────────────────────────────────+
|  1  | Guru & Cyril   | 72  | 75  | 147|
|  2  | John & Mike    | 70  | 73  | 143|
|  3  | Dave & Tom     | 68  | 74  | 142|
|  4  | Andy & Bob     | 71* | --  | 71*|
+──────────────────────────────────────+
| * = Round in progress                |
+──────────────────────────────────────+
```

### 4.4 Data Structure

```javascript
/tournaments/{tournamentId}/
  type: "team-stableford-multi-round"
  format: "team-stableford"
  name: "Dodo Cup 2024"
  seriesId: "series_dodo_cup"

  rounds: [
    {
      roundId: "round_1",
      roundNumber: 1,
      courseId: "course_greenacres",
      date: "2024-10-15",
      status: "completed"
    },
    {
      roundId: "round_2",
      roundNumber: 2,
      courseId: "course_akarana",
      date: "2024-10-16",
      status: "completed"
    }
  ]

/tournaments/{tournamentId}/teams/
  {teamId}/
    teamName: "Guru & Cyril" // or just player names
    player1Id: "player_guru"
    player2Id: "player_cyril"

/tournaments/{tournamentId}/rounds/{roundId}/scores/
  {teamId}/
    teamId: "team_guru_cyril"
    holes: [
      {
        holeNumber: 1,
        player1Gross: 5,
        player1Net: 4,
        player1Points: 2,
        player2Gross: 4,
        player2Net: 4,
        player2Points: 2,
        teamPoints: 2 // best of player1Points and player2Points
      },
      // ... 18 holes
    ]
    roundTotal: 72

/tournaments/{tournamentId}/leaderboard/
  {teamId}/
    teamId: "team_guru_cyril"
    teamName: "Guru & Cyril"
    rounds: [
      { roundNumber: 1, points: 72 },
      { roundNumber: 2, points: 75 }
    ]
    totalPoints: 147
    position: 1
```

### 4.5 Team Stableford Calculation

```javascript
/**
 * Calculate team Stableford score for a hole
 */
function calculateTeamStablefordHole(
  player1Gross, player1Handicap,
  player2Gross, player2Handicap,
  holePar, holeStrokeIndex
) {
  // Calculate individual Stableford points
  const player1Points = calculateStablefordPoints(
    player1Gross,
    holePar,
    holeStrokeIndex,
    player1Handicap
  );

  const player2Points = calculateStablefordPoints(
    player2Gross,
    holePar,
    holeStrokeIndex,
    player2Handicap
  );

  // Team score is best of the two
  const teamPoints = Math.max(player1Points, player2Points);

  return {
    player1Points,
    player2Points,
    teamPoints
  };
}

/**
 * Calculate multi-round team total
 */
function calculateTeamTotalPoints(teamScores) {
  return teamScores.rounds.reduce((total, round) => {
    return total + round.points;
  }, 0);
}
```

---

## 5. Tournament Naming & Multiple Per Year

### 5.1 Series with Multiple Tournaments Per Year

**Chaps Cup - 2 per year typical:**
- Tournament 1: "Chaps Cup March 2025"
- Tournament 2: "Chaps Cup October 2025"

**Each is separate tournament in the series:**
```javascript
{
  id: "tournament_chaps_cup_oct_2025",
  name: "Chaps Cup October 2025",
  seriesId: "series_chaps_cup",
  seriesName: "Chaps Cup",
  seriesEdition: 15, // 15th edition overall
  yearEdition: 2, // 2nd edition in 2025
  date: "2025-10-15"
}

{
  id: "tournament_chaps_cup_mar_2025",
  name: "Chaps Cup March 2025",
  seriesId: "series_chaps_cup",
  seriesName: "Chaps Cup",
  seriesEdition: 14,
  yearEdition: 1,
  date: "2025-03-20"
}
```

### 5.2 Honours Board Display for Multiple Per Year

```
╔═══════════════════════════════════════╗
║         ⚜ CHAPS CUP ⚜                ║
║                                       ║
║   2025 October - Akarana             ║
║   DUMPY - 42 Points                  ║
║                                       ║
║   2025 March - Greenacres            ║
║   [Winner TBD]                       ║
║                                       ║
║   2024 October - Titirangi           ║
║   [Winner Name] - 40 Points          ║
║                                       ║
║   2024 March - Akarana               ║
║   [Winner Name] - 41 Points          ║
║                                       ║
╚═══════════════════════════════════════╝
```

### 5.3 Series Statistics

```javascript
/series/{seriesId}/
  id: "series_chaps_cup"
  name: "Chaps Cup"
  format: "individual-stableford"
  firstYear: 2010
  totalEditions: 30 // total tournaments ever
  tournamentsPerYear: 2 // typical

  statistics: {
    mostWins: {
      playerId: "player_dumpy",
      playerName: "Dumpy",
      wins: 4
    },
    recordScore: {
      score: 45,
      playerId: "player_john",
      tournament: "Chaps Cup March 2018"
    }
  }
```

---

## 6. Revised Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- Modern UI component library setup
- Player-centric architecture
- Admin auth (admin/Greenacres)
- Series concept
- Theming system (Ryder Cup vs Neutral)

### Phase 2: Tournament Management (Weeks 4-5)
- Tournament creation wizard
- Multiple tournaments per year support
- Series assignment
- Theme selection (Ryder Cup colors or neutral)

### Phase 3: Stableford Formats (Weeks 6-8)
- Individual Stableford (Chaps Cup)
- Team Stableford (Dodo Cup) ⭐ NEW
- Multi-round support
- Proper stroke index calculation
- Playoff system

### Phase 4: Scramble/Ambrose (Week 9)
- Drive tracking
- Handicap systems
- Josef Memorial setup

### Phase 5: Other Formats (Week 10)
- Best Ball, Shamble, Multi-day

### Phase 6: Honours Board (Weeks 11-12)
- Classic aesthetic design ⭐ DIFFERENT FROM REST
- Player/team aggregation
- Series views
- Historic data entry (Josef Memorial 2021-2024, Dodo Cup 2024, Chaps Cup)

### Phase 7: Media System (Weeks 13-14)
- Photo/video upload (modern UI)
- Galleries
- 50 photos, 10 videos per tournament

### Phase 8: Mobile & Polish (Week 15)
- Modern mobile UX
- Touch optimization
- PWA

### Phase 9-10: Testing (Weeks 16-18)
- All formats
- Historic data entry
- Real tournament test

**Total: 18 weeks**

---

## 7. Data to Collect Before Starting

### 7.1 Historic Tournament Data Needed

**Chaps Cup (2021-2024):**
- Winners for each edition (names, scores, courses, dates)
- Typically 2 per year = ~8 tournaments to enter

**Josef Memorial:**
- ✅ 2021: Team Trump (Cyril, Stu, DC, Dodo)
- ✅ 2022: Team Trump (Cyril, Stu, DC, Dodo)
- ✅ 2023: Team Trump (Cyril, Stu, DC, Dodo)
- ✅ 2024: Team Trump (Cyril, Stu, DC, Dodo)
- Course(s) used
- Scores (if available)

**Dodo Cup:**
- ✅ 2024: Guru & Cyril (winners)
- Score/points (if available)
- Number of rounds
- Course(s) used
- Other teams/results

**Chaps Cup 2025:**
- ✅ October 2025: Dumpy (winner), 42 points
- ✅ Course: Akarana Golf Course

### 7.2 Player Database

**Regular Players (to pre-populate):**
1. Cyril
2. Stu
3. DC
4. Dodo
5. Dumpy
6. Guru
7. Poo
8. Hawk
9. Leaf
10. Jungle
11. Ciaran
12. Travis
13. Steve

**Total: 13 regular players**

**Handicap Format:**
- Decimal handicaps with 1 decimal place (e.g., 12.5, 9.0, 15.3)
- Complies with WHS (World Handicap System)
- Range: 0.0 - 54.0

**Initial Setup:**
- Pre-populate all 13 players with placeholder handicaps (0.0)
- Admin updates handicaps via UI before creating tournaments
- Historic tournament data entered by admin in app
- Handicap history builds as admin enters past data

### 7.3 Course Database

**Known Courses:**
- Akarana Golf Course (need: par, stroke indexes)
- Greenacres (?) (need details if different)
- _(Other courses used)_

---

## 8. Handicap System (Decimal Support)

### 8.1 Handicap Format Specification

**Decimal Precision:**
- All handicaps support 1 decimal place
- Examples: 12.5, 9.0, 15.3, 8.7
- Complies with World Handicap System (WHS)

**Input Validation:**
```javascript
// HTML Input
<input
  type="number"
  step="0.1"
  min="0"
  max="54"
  placeholder="12.5"
  pattern="^\d{1,2}\.\d$"
/>

// Validation function
function validateHandicap(hcp) {
  const num = parseFloat(hcp);
  if (isNaN(num)) return false;
  if (num < 0 || num > 54) return false;
  // Check exactly 1 decimal place
  const decimal = hcp.toString().split('.')[1];
  if (!decimal || decimal.length !== 1) return false;
  return true;
}
```

**Display Formatting:**
```javascript
function formatHandicap(hcp) {
  return parseFloat(hcp).toFixed(1);
}

// Examples:
formatHandicap(12.5) // "12.5"
formatHandicap(9)    // "9.0"
formatHandicap(15)   // "15.0"
```

### 8.2 Stroke Allocation with Decimal Handicaps

**Stableford Calculation:**
```javascript
function calculateStablefordPoints(grossScore, holePar, holeStrokeIndex, playerHandicap) {
  // playerHandicap is decimal (e.g., 12.5)

  // Calculate full strokes (integer part)
  const fullStrokes = Math.floor(playerHandicap);

  // Standard stroke allocation
  let strokesReceived = 0;
  if (holeStrokeIndex <= fullStrokes) {
    strokesReceived = 1;
  }
  if (holeStrokeIndex <= (fullStrokes - 18)) {
    strokesReceived = 2; // For HCP > 18
  }

  // Note: Decimal portion (0.5, 0.3, etc.) typically rounds down
  // Some courses may apply specific rules for 0.5 handicaps

  const netScore = grossScore - strokesReceived;
  const scoreDiff = holePar - netScore;

  // Return Stableford points (0-5)
  if (scoreDiff >= 3) return 5;
  if (scoreDiff === 2) return 4;
  if (scoreDiff === 1) return 3;
  if (scoreDiff === 0) return 2;
  if (scoreDiff === -1) return 1;
  return 0;
}
```

**Team Handicap Calculation (Scramble):**
```javascript
// Example: Team with HCPs 9.7, 12.5, 15.3, 18.2
// USGA Method: 20%, 15%, 10%, 5%

const teamHandicap =
  (9.7 * 0.20) +   // 1.94
  (12.5 * 0.15) +  // 1.875
  (15.3 * 0.10) +  // 1.53
  (18.2 * 0.05);   // 0.91
  // Total: 6.255

// Round to 1 decimal place
const roundedTeamHCP = Math.round(teamHandicap * 10) / 10;
// Result: 6.3
```

### 8.3 Data Storage

**Firestore:**
```javascript
// Player document
{
  id: "player_cyril",
  name: "Cyril",
  currentHandicap: 12.5,  // Stored as Number
  handicapUpdatedAt: Timestamp,

  handicapHistory: [
    {
      handicap: 13.0,
      date: Timestamp,
      changedBy: "admin",
      reason: "WHS update"
    },
    {
      handicap: 12.5,
      date: Timestamp,
      changedBy: "admin",
      reason: "Recent tournament performance"
    }
  ]
}

// Tournament participant
{
  playerId: "player_cyril",
  handicapUsed: 12.5,  // Handicap at time of tournament
  result: {
    grossScore: 85,
    netScore: 72.5,  // Can also be decimal
    stablefordPoints: 38
  }
}
```

### 8.4 UI Components

**Handicap Input Component:**
```jsx
function HandicapInput({ value, onChange, label }) {
  const [inputValue, setInputValue] = useState(value?.toFixed(1) || "0.0");

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    // Validate and update parent
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 54) {
      onChange(parseFloat(num.toFixed(1)));
    }
  };

  return (
    <div className="handicap-input">
      <label>{label}</label>
      <input
        type="number"
        step="0.1"
        min="0"
        max="54"
        value={inputValue}
        onChange={handleChange}
        placeholder="12.5"
      />
      <span className="hint">Format: XX.X (e.g., 12.5)</span>
    </div>
  );
}
```

**Handicap Display Component:**
```jsx
function HandicapDisplay({ handicap, showLabel = true }) {
  return (
    <span className="handicap-display">
      {showLabel && "HCP "}
      {handicap.toFixed(1)}
    </span>
  );
}

// Usage:
<HandicapDisplay handicap={12.5} /> // "HCP 12.5"
<HandicapDisplay handicap={9} />    // "HCP 9.0"
```

### 8.5 Admin Handicap Update Interface

```
+──────────────────────────────────────+
|    Update Player Handicap            |
+──────────────────────────────────────+
| Player: Cyril                        |
| Current Handicap: 12.5               |
|                                      |
| New Handicap:                        |
| [-] [12.5] [+]                       |
|                                      |
| Effective Date: [2025-12-15]         |
|                                      |
| Reason (optional):                   |
| [Recent tournament performance_____] |
|                                      |
| Handicap History:                    |
| • 13.0 (2024-06-01)                 |
| • 12.5 (2025-01-15) ← Current       |
|                                      |
| [Cancel] [Update Handicap]           |
+──────────────────────────────────────+
```

### 8.6 Player List with Decimal Handicaps

```
+──────────────────────────────────────+
|    Players                           |
+──────────────────────────────────────+
| [Search players...] [+ Add Player]   |
+──────────────────────────────────────+
| Name        | HCP   | Last Played   |
+──────────────────────────────────────+
| Cyril       | 12.5  | 2 weeks ago   |
| Stu         | 15.3  | 1 month ago   |
| DC          | 9.7   | 2 weeks ago   |
| Dodo        | 18.2  | 3 weeks ago   |
| Dumpy       | 8.5   | 1 week ago    |
| Guru        | 14.0  | 2 weeks ago   |
| Poo         | 11.2  | 1 month ago   |
| Hawk        | 16.8  | 2 months ago  |
| Leaf        | 10.5  | 3 weeks ago   |
| Jungle      | 13.7  | 1 month ago   |
| Ciaran      | 12.0  | 2 weeks ago   |
| Travis      | 15.5  | 1 month ago   |
| Steve       | 9.3   | 3 weeks ago   |
+──────────────────────────────────────+
```

## 9. Key Technical Decisions

### 8.1 Modern UI Framework

**Component Library Options:**
1. **Headless UI** + Tailwind CSS (recommended)
   - Modern, clean aesthetic
   - Full control over styling
   - Excellent mobile support

2. **Material-UI** (MUI)
   - Pre-built components
   - Modern design
   - Extensive component library

3. **Chakra UI**
   - Accessible components
   - Clean design system
   - Easy theming

**Recommendation:** Headless UI + Tailwind for maximum control and modern aesthetic

### 8.2 Honours Board Implementation

**Classic Look Achievement:**
- CSS with background images (wood texture)
- Text shadows for engraved effect
- Google Fonts: Playfair Display (serif)
- Gold color: `#d4af37` with metallic gradient
- Border ornaments: SVG decorative elements

**Example CSS:**
```css
.honours-board {
  background: linear-gradient(135deg, #2c1810 0%, #3d2517 100%);
  background-image: url('/textures/wood.jpg');
  font-family: 'Playfair Display', serif;
  color: #d4af37;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  border: 4px solid #8b7355;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.honours-title {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: linear-gradient(180deg, #ffd700 0%, #d4af37 50%, #b8942a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.honours-entry {
  border-top: 2px solid rgba(212, 175, 55, 0.3);
  padding: 1.5rem 0;
}
```

---

## 9. Summary of Key Changes

### From Original Plan:

1. ✅ **UI Design:** Modern everywhere EXCEPT honours board
2. ✅ **Theming:** Ryder Cup blue/red, others neutral
3. ✅ **Team Stableford:** New format added (Dodo Cup)
4. ✅ **Multiple per year:** Chaps Cup 2x annually
5. ✅ **Historic data:** Josef Memorial 2021-2024, Dodo Cup 2024, Chaps Cup Oct 2025
6. ✅ **Course tracking:** Akarana specified for Chaps Cup

### Tournament Types (FINAL):
1. Ryder Cup (Team Match Play) - Blue/Red theme
2. Chaps Cup (Individual Stableford Series) - Neutral, 2/year
3. Individual Stableford (Generic) - Neutral
4. Josef Memorial (Ambrose Series) - Neutral, annual
5. Dodo Cup (Team Stableford Multi-Round) - Neutral, ⭐ NEW
6. Best Ball / Shamble / Multi-Day - Neutral

### Players to Add:
- Cyril, Stu, DC, Dodo (Team Trump)
- Dumpy (Chaps Cup Oct 2025 winner)
- Guru (Dodo Cup 2024 winner with Cyril)
- _(Others as you provide)_

---

## 10. Next Steps

### Before Implementation:

**Need from you:**
1. ✅ Chaps Cup 2021-2024 winners (8 tournaments if 2/year)
2. ✅ Player list with handicaps (Cyril, Stu, DC, Dodo, Dumpy, Guru + others)
3. ✅ Josef Memorial scores/details (optional but nice to have)
4. ✅ Dodo Cup 2024 scores/teams (optional)
5. ✅ Course details (Akarana par, stroke indexes)
6. ✅ Any other recurring tournaments to set up

**Ready to start:**
- Set up modern UI framework (Tailwind + Headless UI)
- Build component library with Ryder Cup theming
- Create classic honours board design
- Implement Team Stableford format
- Begin Phase 1: Foundation

---

## Conclusion

This FINAL plan creates a modern, clean golf tournament platform with:

✅ Modern UI throughout (except honours board)
✅ Classic honours board aesthetic
✅ Ryder Cup blue/red theming (isolated)
✅ All other tournaments neutral
✅ Team Stableford format (Dodo Cup)
✅ Support for multiple tournaments per year per series
✅ Historic data ready to enter

**Total Timeline:** 18 weeks (4.5 months)

**Testing:** All local until ready

**Ready to begin once you provide player/course/historic data!** 🚀
