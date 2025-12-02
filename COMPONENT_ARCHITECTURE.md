# Component Architecture

## Shared Components (MUST be used by all scoring screens)

### 1. ScoreCard (`src/components/shared/ScoreCard.js`)
**Purpose:** Display golf scorecards with traditional symbols (circles, squares)
**Supports:** Individual stroke, stableford, match play formats
**CSS:** `src/components/shared/ScoreCard.css`

**Used By:**
- ✅ ScorecardScoring.js
- ✅ StablefordScoring.js - REFACTORED 2025-12-02
- ✅ Scoring.js (match play)
- ✅ BestBallScoring.js - REFACTORED 2025-12-02
- ❌ Scramble/Shamble components (not yet implemented)

### 2. ScoreEntry (`src/components/shared/ScoreEntry.js`)
**Purpose:** Score input widget with +/- buttons
**Behavior:** First click defaults to par, then increments/decrements
**CSS:** `src/components/shared/ScoreEntry.css`

**Used By:**
- ✅ ScorecardScoring.js
- ✅ Scoring.js (match play - all formats)
- ✅ StablefordScoring.js - REFACTORED 2025-12-02
- ⚠️ BestBallScoring.js - Uses custom quick-score buttons (appropriate for team format)

### 3. HoleInfo (`src/components/shared/HoleInfo.js`)
**Purpose:** Display hole information (number, par, SI, yardage)
**CSS:** `src/components/shared/HoleInfo.css`

**Used By:**
- ✅ Scoring.js (match play)
- ✅ BestBallScoring.js - REFACTORED 2025-12-02
- ⚠️ ScorecardScoring.js - Has custom hole display (consider refactor)
- ⚠️ StablefordScoring.js - Has custom hole display (consider refactor)

## Scoring Components

### Individual Formats
- `ScorecardScoring.js` - Individual stroke play scorecards
- `StablefordScoring.js` - Individual stableford scorecards

### Team Formats (NEED REFACTOR)
- `BestBallScoring.js` - Best ball team scoring
- `Scramble/Shamble` - Not yet implemented

### Match Play
- `Scoring.js` - All match play formats (singles, foursomes, fourball)

## Architecture Rules

1. **ALL scoring screens MUST use ScoreCard component** for displaying scorecards
2. **ALL scoring screens MUST use ScoreEntry component** for score input
3. **ALL scoring screens SHOULD use HoleInfo component** for hole information
4. **NO custom scorecard tables** - use ScoreCard with appropriate props
5. **NO custom +/- button implementations** - use ScoreEntry component

## Refactoring TODO

- [x] Refactor BestBallScoring.js to use shared components - COMPLETED 2025-12-02
- [x] Refactor StablefordScoring.js to use ScoreEntry instead of custom buttons - COMPLETED 2025-12-02
- [ ] Standardize hole information display across all screens (ScorecardScoring, StablefordScoring)
- [ ] Create Scramble/Shamble components using shared architecture
