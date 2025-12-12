# Ryder Cup Scoring App - Claude Context

**Project**: Golf tournament scoring application built for Ryder Cup format competitions
**Tech Stack**: React 18, Firebase (Firestore, Auth, Storage, Hosting)
**Owner**: Evan Wilson (@evanwilson77)
**Repository**: https://github.com/evanwilson77/ryder-cup-scoring

---

## 🎯 Project Overview

A real-time golf tournament scoring application supporting multiple tournament formats:
- **Team formats**: Ryder Cup (match play), Scramble, Shamble, Best Ball, Team Stableford
- **Individual formats**: Stroke Play, Stableford, Singles Match Play
- **Features**: Live scoring, handicap calculations, media uploads, leaderboards, honours board

---

## 🏗️ Critical Architecture Principles

### Tournament Structure Hierarchy

**CRITICAL: A TOURNAMENT consists of one or more ROUNDS. The ROUNDS have formats, NOT the tournament.**

```
Tournament (Container)
├── hasTeams: boolean (Individual vs Team tournament)
├── name, dates, players[]
├── teams[] (only if hasTeams = true)
└── Rounds[] (Each round is independent)
    ├── Round 1
    │   ├── format: 'four_ball'
    │   ├── courseData: { holes[], totalPar }
    │   └── matches[] or scorecards[]
    └── Round 2
        ├── format: 'individual_stableford'
        ├── courseData: { holes[], totalPar }
        └── scorecards[]
```

**Key Points:**
- Each round can have a different format
- Formats are selected PER ROUND, not at tournament level
- Tournament-level `hasTeams` determines if it's a team or individual competition
- **NEVER** send `undefined` to Firebase - use `null` or omit fields

**See**: `ARCHITECTURE_NOTES.md` for full details

---

## 🎮 Available Formats

### Individual Formats
- `individual_stroke` - Individual Stroke Play
- `individual_stableford` - Individual Stableford
- `match_play_singles` - Match Play - Singles

### Team Formats (Match Play)
- `four_ball` - Four-Ball (Better Ball) - 2v2
- `foursomes` - Foursomes (Alternate Shot) - 2v2

### Team Formats (Stroke Play)
- `scramble` - Scramble / Ambrose
- `best_ball` - Best Ball (Stroke Play)
- `team_stableford` - Team Stableford
- `shamble` - Shamble

**See**: `TOURNAMENT_FORMATS.md` for setup requirements by format

---

## 📊 Data Model

### Key Collections
- `tournaments` - Tournament documents with embedded rounds
- `players` - Player profiles with handicaps
- `savedCourses` - Course library (course name + tee box combinations)
- `tournamentSeries` - Recurring tournament types
- `honoursBoard` - Historical winners

### Tournament Document Structure
```javascript
{
  id, name, edition,
  startDate, endDate, status,
  hasTeams: boolean,
  players: string[],      // Player IDs
  teams: Object | null,   // Only if hasTeams=true

  rounds: [               // Array of rounds
    {
      id, roundNumber, name, date,
      format: 'four_ball',
      status: 'not_started' | 'in_progress' | 'completed',
      courseData: { holes: [], totalPar },
      matches: [],        // For match play formats
      scorecards: [],     // For individual formats
      teamScorecards: []  // For team stroke formats
    }
  ]
}
```

**See**: `TOURNAMENT_DATA_MODEL.md` for complete schema

---

## ⚛️ Component Architecture

### Shared Components (MUST be used)

All scoring screens MUST use these shared components:

1. **ScoreCard** (`src/components/shared/ScoreCard.js`)
   - Display golf scorecards with traditional symbols (circles, squares)
   - Used by: ScorecardScoring, StablefordScoring, Scoring, BestBallScoring

2. **ScoreEntry** (`src/components/shared/ScoreEntry.js`)
   - Score input widget with +/- buttons
   - First click defaults to par, then increments/decrements
   - Used by: ScorecardScoring, Scoring, StablefordScoring

3. **HoleInfo** (`src/components/shared/HoleInfo.js`)
   - Display hole information (number, par, SI, distance)
   - Used by: Scoring, BestBallScoring

### Other Shared Components
- `LeaderboardSummary` - Reusable leaderboard (replaced 480 lines of duplication!)
- `AutoSaveIndicator` - "Saving..." indicator
- `ScorePreview` - Gross/net/points breakdown
- `SubmitScorecardButton` - Scorecard completion workflow
- `MediaButton` - Camera button with integrated modal
- `PlayerScoreEntry` - Player info + score entry for team formats
- `HoleNavigationGrid` - 18-hole button grid
- `QuickScoreButtons` - Numbered button grid for rapid entry

### Custom Hooks
- `useAutoSave` - Debounced auto-saving (1 second delay)
- `useScoreEntry` - Increment/decrement logic starting at par
- `useHoleNavigation` - Hole-by-hole navigation state

**Architecture Rule**: DO NOT create custom scorecard tables or +/- buttons. Use shared components.

**See**: `COMPONENT_ARCHITECTURE.md` for details

---

## ⛳ Golf Domain Knowledge

### Key Concepts

**Match Play**: Hole-by-hole competition (win/lose/halve each hole)
**Stroke Play**: Total strokes over entire round(s)
**Stableford**: Points-based scoring (Eagle=4, Birdie=3, Par=2, Bogey=1)

**Stroke Index (SI)**: Determines handicap stroke allocation (1=hardest, 18=easiest)
- Player with 12 handicap gets strokes on holes indexed 1-12
- Used to calculate net scores

**Course Rating**: Expected score for scratch golfer
**Slope Rating**: Relative difficulty (55-155, standard=113)

### Tee Boxes
- Black (Championship): 7200+ yards - Professionals
- Blue (Back): 6800-7200 yards - Low handicap
- White (Regular): 6200-6800 yards - Mid handicap
- Gold/Yellow (Senior): 5800-6200 yards - High handicap
- Red (Forward): 5000-5800 yards - Beginners

**Note**: This app uses meters for distances

**See**: `GOLF_CONCEPTS.md` for comprehensive golf terminology

---

## 🧪 Testing

### Quick Commands
```bash
npm run test:once          # Run all tests once
npm run test:coverage      # Coverage report
npm run test:report        # Human-readable report
npm test stablefordCalculations  # Run specific test
```

### Test Coverage
- **stablefordCalculations.test.js** (45 tests) - Point calculations, handicap strokes
- **scoring.test.js** (35 tests) - Match play scoring, net scores, match status
- **tournamentServices.test.js** (12 tests) - CRUD operations
- **initializePlayers.test.js** (6 tests) - Player initialization

**Goal**: >90% coverage on scoring logic

**See**: `TESTING_QUICK_REFERENCE.md` for details

---

## 🔐 Authentication

### User Types
- **Admin**: `admin@rydercup.local` / `Greenacres`
- **Players**: `firstname.lastname@rydercup.local` / `rydercup2025`

### Setup Process (IN ORDER)
1. Create admin Firebase Auth account manually in Firebase Console
2. Add players through UI (auto-creates Firebase Auth accounts)
3. OR migrate existing players: `/admin/migrate-players`

**Protected Routes**: All routes require authentication
**Player Login**: Visual card-based login at `/player-login`

**See**: `QUICK_START_GUIDE.md` for step-by-step authentication setup

---

## 📝 Player Database

### Regular Players (13 core members)
Cyril, Stu, DC, Dodo, Dumpy, Guru, Poo, Hawk, Leaf, Jungle, Ciaran, Travis, Steve

### Handicap System
- **Range**: 0.0 - 54.0
- **Format**: One decimal place (e.g., 12.5, 9.0, 15.3)
- **Storage**: Firestore Number type
- **History**: Tracked with date, reason, tournament ID

**See**: `PLAYER_DATABASE.md` for details

---

## 🚀 Deployment & Git Workflow

### Quick Deploy
```bash
# 1. Commit and push
git add .
git commit -m "Description"
git push origin main

# 2. Build and deploy to Firebase
npm run build
firebase deploy --only hosting
```

### Live URLs
- **Production**: https://ryderchapscup.web.app/
- **Firebase Console**: https://console.firebase.google.com/
- **GitHub**: https://github.com/evanwilson77/ryder-cup-scoring

### Commit Message Format
```
Type: Brief description (50 chars)

- What changed
- Why it changed
- Any side effects

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: Add, Fix, Update, Refactor, Docs, Test, Chore

**See**: `GIT_WORKFLOW.md` for comprehensive Git commands

---

## 📋 Code Review Checklist

Before committing scoring components:
- [ ] Uses ScoreCard for displaying scorecards
- [ ] Uses ScoreEntry for score input with +/- buttons
- [ ] Uses HoleInfo for hole information display
- [ ] NO custom scorecard tables
- [ ] NO custom +/- button implementations
- [ ] Visual appearance matches other scoring screens
- [ ] Tested on mobile and desktop

**Red Flags**:
- Creating `<table className="scorecard-table">` → Use ScoreCard
- Creating `<button className="score-button increment">` → Use ScoreEntry
- Copying CSS from another component → Use shared CSS

**See**: `CODE_REVIEW_CHECKLIST.md` for full checklist

---

## 🛣️ Routes Reference

### Critical Format Mapping

**Database formats use underscores, Route paths use hyphens:**

| Database Value | Route Path | Component |
|---|---|---|
| `best_ball` | `/bestball/` | BestBallScoring.js |
| `team_stableford` | `/team-stableford/` | BestBallScoring.js |
| `scramble` | `/scramble/` | ScrambleScoring.js |
| `shamble` | `/shamble/` | ShambleScoring.js |
| `four_ball` | N/A (uses match ID) | Scoring.js |
| `foursomes` | N/A (uses match ID) | Scoring.js |
| `individual_stableford` | N/A (uses scorecard ID) | StablefordScoring.js |

### Route Patterns

**Team Scoring Routes:**
```
/tournaments/:tournamentId/rounds/:roundId/scramble/:teamId
/tournaments/:tournamentId/rounds/:roundId/shamble/:teamId
/tournaments/:tournamentId/rounds/:roundId/bestball/:teamId
/tournaments/:tournamentId/rounds/:roundId/team-stableford/:teamId
```

**Match Play Routes:**
```
/scoring/:matchId                    # Fourball, Foursomes, Singles
/match/:matchId                      # Match detail view
```

**Individual Scoring Routes:**
```
/tournaments/:tournamentId/rounds/:roundId/scorecards/:scorecardId
/tournaments/:tournamentId/rounds/:roundId/stableford/:scorecardId
```

**Navigation Routes:**
```
/leaderboard                        # Main leaderboard (auto-routes to Stableford if applicable)
/tournaments                        # Tournament dashboard
/tournaments/:tournamentId          # Tournament detail
/tournaments/create                 # Tournament creation wizard
/player-login                       # Player login
/admin/login                        # Admin login
```

**⚠️ CRITICAL**: When building navigation URLs from database format values, ALWAYS map:
- `best_ball` → `bestball`
- `team_stableford` → `team-stableford`

---

## 🗂️ Key File Locations

### Core Firebase Services
- `src/firebase/config.js` - Firebase initialization
- `src/firebase/tournamentServices.js` - Tournament CRUD operations
- `src/firebase/playerServices.js` - Player management
- `src/firebase/authServices.js` - Authentication

### Main Components
- `src/components/TournamentDashboard.js` - Tournament list and series
- `src/components/TournamentDetail.js` - Tournament detail view with rounds
- `src/components/TournamentCreation.js` - Tournament creation wizard

### Scoring Components
- `src/components/ScorecardScoring.js` - Individual stroke play
- `src/components/StablefordScoring.js` - Individual stableford
- `src/components/Scoring.js` - Match play (all formats)
- `src/components/BestBallScoring.js` - Best ball team scoring
- `src/components/ScrambleScoring.js` - Scramble scoring
- `src/components/ShambleScoring.js` - Shamble scoring

### Shared Components & Hooks
- `src/components/shared/` - All shared UI components
- `src/hooks/` - Custom React hooks

### Utils
- `src/utils/scoring.js` - Match play calculations
- `src/utils/stablefordCalculations.js` - Stableford points logic

---

## 🎓 Recent Major Work

### Completed Refactorings
- ✅ **Shared Components** (Dec 2, 2025): Created 9 shared components, 3 custom hooks. Eliminated 561 lines (22% reduction).
- ✅ **BestBallScoring Refactor** (Dec 2, 2025): Now uses ScoreCard and HoleInfo components
- ✅ **StablefordScoring Refactor** (Dec 2, 2025): Now uses ScoreEntry component

### Current Architecture Status
- All scoring components now use shared component architecture
- Consistent UX across all formats
- LeaderboardSummary replaced 480 lines of duplication (98% reduction)

**Note**: Any `.md` files with "REFACTOR" in the name and marked COMPLETED are historical and can be referenced for patterns but don't need implementation.

---

## 📚 Additional Documentation

For deeper dives into specific topics, see:

- **GOLF_CONCEPTS.md** - Comprehensive golf terminology and scoring rules
- **TOURNAMENT_FORMATS.md** - Format IDs and setup requirements
- **TOURNAMENT_DATA_MODEL.md** - Complete database schema
- **ARCHITECTURE_NOTES.md** - Critical architecture principles and examples
- **COMPONENT_ARCHITECTURE.md** - Shared component requirements
- **TESTING_QUICK_REFERENCE.md** - Testing commands and examples
- **PLAYER_DATABASE.md** - Player data structure and handicap system
- **GIT_WORKFLOW.md** - Comprehensive Git commands and workflows
- **QUICK_START_GUIDE.md** - Authentication setup guide
- **CODE_REVIEW_CHECKLIST.md** - Pre-commit checklist
- **DEPLOYMENT_PLAN.md** - Deployment options and CI/CD setup

---

## 🎯 Common Tasks

### Adding a New Tournament Format
1. Add format ID to `TOURNAMENT_FORMATS.md`
2. Create scoring component in `src/components/`
3. Use shared components (ScoreCard, ScoreEntry, HoleInfo)
4. Add format to `FormatExplainerModal.js`
5. Update round setup logic in `TournamentDetail.js`
6. Write tests for scoring calculations

### Fixing a Scoring Bug
1. Write a test that demonstrates the bug
2. Run test - it should fail
3. Fix the code in appropriate service/util file
4. Run test again - it should pass
5. Test manually in UI
6. Commit with clear message

### Adding a New Player
1. Login as admin
2. Navigate to `/players`
3. Click "Add Player"
4. Enter name and handicap (format: XX.X)
5. Player gets auto-created Firebase Auth account
6. They appear on player login screen

---

## ⚠️ Important Gotchas

1. **Firebase doesn't accept undefined**: Use `null` or omit fields
2. **Round formats, not tournament formats**: Format is per-round
3. **Always use shared components**: Don't create custom scorecard tables
4. **Test on mobile**: Many users score on phones
5. **Handicap decimals**: Always one decimal place (12.5, not 12)
6. **Match play status**: Can complete early if mathematically certain
7. **Course data per round**: Each round can use different course
8. **Team tournaments need hasTeams=true**: Check this flag for team-specific logic

---

## 🆘 Getting Help

- **Project Issues**: https://github.com/evanwilson77/ryder-cup-scoring/issues
- **Firebase Console**: https://console.firebase.google.com/
- **Documentation**: See .md files listed above

---

*Last Updated: 2025-12-12*
*Generated for Claude Code assistance*
