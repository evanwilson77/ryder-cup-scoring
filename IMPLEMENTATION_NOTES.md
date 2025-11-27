# Ryder Cup Scoring App - Implementation Notes

## Project Overview
A real-time golf tournament scoring application built with React and Firebase, supporting Ryder Cup match play formats with live scoring, handicapping, and leaderboard updates.

## Tech Stack
- **Frontend**: React 18 with React Router v6
- **Backend**: Firebase Firestore (NoSQL database)
- **Styling**: Custom CSS with mobile-responsive design
- **Real-time**: Firebase real-time subscriptions

---

## Key Architecture Decisions

### 1. Firebase Data Structure

```
Firestore Collections:
├── tournament/current          # Tournament metadata
├── teams/                      # Team 1 (Tawa Lads) & Team 2 (Rest of World)
├── players/                    # Players with handicaps, linked to teams
├── course/current              # Course name and total par
├── holes/                      # 18 holes with par and stroke index
├── matches/                    # Match configurations and live scores
├── scores/                     # (Currently unused, scores in matches)
└── savedCourses/               # Saved course configurations
```

### 2. Real-Time Updates Pattern

**All components use Firebase subscriptions** for real-time data:

```javascript
useEffect(() => {
  const unsubscribe = subscribeToCollection(setStateFunction);
  return () => unsubscribe(); // Cleanup on unmount
}, []);
```

**Key Services** (`src/firebase/services.js`):
- `subscribeToTeams()` - Real-time team updates
- `subscribeToPlayers()` - Real-time player roster
- `subscribeToMatches()` - Live match updates
- `subscribeToHoles()` - Course configuration changes
- `subscribeToMatch(matchId)` - Individual match scoring

### 3. Match Play Scoring System

**Three Match Formats Supported:**
1. **Singles** (1v1) - Individual match play
2. **Foursomes** (2v2) - Alternate shot, one ball per team
3. **Four-ball** (2v2) - Best ball, each player plays own ball

**Scoring Logic** (`src/utils/scoring.js`):

```javascript
// Key Functions:
- calculateNetScore(gross, handicap, strokeIndex)
  // Applies stroke-based handicapping per hole

- determineHoleWinner(format, scores, hole)
  // Returns 'team1', 'team2', or 'halved'

- calculateMatchStatus(holeScores, currentHole)
  // Returns: { team1Up, holesPlayed, holesRemaining, isComplete, status }

- getMatchResult(holeScores)
  // Returns: 'team1_win', 'team2_win', or 'halved'

- calculateTournamentPoints(matches)
  // Counts total points (1 for win, 0.5 for halve)
```

**Match State Management:**
- `status`: 'not_started' | 'in_progress' | 'completed'
- `currentHole`: Next hole to play (1-18)
- `holeScores[]`: Array of 18 hole results
- `result`: Final match result (set when complete)

### 4. Handicapping System

**Stroke Index Based:**
- Each hole has a stroke index (1-18, where 1 = hardest)
- Player with handicap 10 gets strokes on holes with stroke index 1-10
- Net score = Gross score - strokes received

**Example:**
```javascript
// Player: HCP 12
// Hole: SI 8, Par 4
// Gross Score: 5
// Strokes Received: 1 (because SI 8 <= HCP 12)
// Net Score: 5 - 1 = 4 (net par)
```

---

## Critical Implementation Details

### 1. React Hooks Rules (Fixed Bug)

**Problem:** Hook called after conditional return
```javascript
// ❌ WRONG - causes "Hook called conditionally" error
if (!data) return <Loading />;
useEffect(() => {...}, []); // Hook after return!
```

**Solution:** All hooks BEFORE any returns
```javascript
// ✅ CORRECT
useEffect(() => {...}, []); // Hooks first
if (!data) return <Loading />; // Returns after
```

### 2. Scoring State Bug (Fixed)

**Problem:** Current hole saving incorrectly (going back 1)

**Root Cause:**
```javascript
// Was saving currentHole, but local state already incremented
await updateMatch(matchId, {
  currentHole: currentHole, // ❌ This is already +1 in local state
});
setCurrentHole(currentHole + 1); // Then increment again
```

**Fix:**
```javascript
const nextHole = isComplete ? currentHole : Math.min(currentHole + 1, 18);
await updateMatch(matchId, {
  currentHole: nextHole, // ✅ Save the next hole explicitly
});
if (!isComplete && currentHole < 18) {
  setCurrentHole(currentHole + 1);
}
```

### 3. Environment Variables (.env)

**Critical Format Rules:**
```env
# ✅ CORRECT - No spaces, no commas, no quotes
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com

# ❌ WRONG - These break React's env parser
REACT_APP_FIREBASE_API_KEY=AIza...,
  REACT_APP_FIREBASE_API_KEY = AIza...
REACT_APP_FIREBASE_API_KEY="AIza..."
```

**Must restart dev server after .env changes!**

### 4. Firebase Security Rules

For development/private tournament:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Open for testing
    }
  }
}
```

**For production, implement authentication!**

---

## Feature Implementation Patterns

### 1. Course Setup Features

**Template Loading:**
```javascript
// Pre-configured courses in src/utils/courseSearch.js
export const COURSE_TEMPLATES = {
  'championship': { name, holes: [...] },
  'executive': { name, holes: [...] },
  'links': { name, holes: [...] }
};

// Load template updates all 18 holes in parallel
const updatePromises = template.holes.map((holeData) => {
  return setHole(`hole${holeData.number}`, holeData);
});
await Promise.all(updatePromises);
```

**Scorecard Text Parsing:**
```javascript
// Parses common formats:
// "Hole 1: Par 4, SI 7"
// "1 | 4 | 7"
// Or rows of numbers: holes, pars, stroke indexes
const parseScorecardText = (text) => {
  // Uses regex patterns to extract structured data
  // Returns: { holes: [...], found: 18, success: true }
};
```

**Save/Load Configurations:**
```javascript
// Saves current course setup to savedCourses collection
await saveCourseConfiguration(name, holes);

// Loads and applies saved configuration
await loadCourseConfiguration(courseId);
```

### 2. Mobile-Friendly Scoring

**Score Entry Pattern:**
```javascript
// Default to par when hole loads
useEffect(() => {
  if (currentHoleData) {
    setScores({
      team1Player1: currentHoleData.par,
      team2Player1: currentHoleData.par,
      // ... based on format
    });
  }
}, [currentHole, currentHoleData]);

// +/- Button handlers
const incrementScore = (field) => {
  setScores({ ...scores, [field]: (scores[field] || 0) + 1 });
};

const decrementScore = (field) => {
  setScores({ ...scores, [field]: Math.max(1, (scores[field] || 0) - 1) });
};
```

**UI Structure:**
```jsx
<div className="score-controls">
  <button className="score-button decrement" onClick={() => decrementScore('field')}>
    -
  </button>
  <input type="number" value={score} className="score-input" />
  <button className="score-button increment" onClick={() => incrementScore('field')}>
    +
  </button>
</div>
```

**Mobile CSS:**
```css
/* Larger touch targets on mobile */
@media (max-width: 768px) {
  .score-button {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }
}
```

### 3. Projected Scores (In-Flight Matches)

**Concept:** Show what scores WOULD be if all in-progress matches finished as currently standing

```javascript
const calculateProjectedPoints = () => {
  let team1Projected = team1Points; // Start with actual
  let team2Projected = team2Points;

  // Add potential points from in-progress matches
  inProgressMatches.forEach(match => {
    const projectedResult = getMatchResult(match.holeScores);
    if (projectedResult === 'team1_win') {
      team1Projected += 1;
    } else if (projectedResult === 'team2_win') {
      team2Projected += 1;
    } else if (projectedResult === 'halved') {
      team1Projected += 0.5;
      team2Projected += 0.5;
    }
  });

  return { team1Projected, team2Projected };
};
```

**Display Logic:**
```jsx
<div className="team-points">{team1Points}</div>
{inProgressMatches.length > 0 && team1Projected !== team1Points && (
  <div className="projected-points">
    Projected: {team1Projected}
  </div>
)}
```

### 4. Match Detail View

**Route:** `/match/:matchId`

**Key Features:**
- Hole-by-hole scorecard table
- Color-coded winners per hole
- Match statistics
- Player lineup with handicaps

**Scorecard Display:**
```jsx
{holes.map((hole, idx) => {
  const holeScore = match.holeScores[idx];
  const winner = holeScore?.winner; // 'team1' | 'team2' | 'halved'

  return (
    <div className={`scorecard-row ${winner}-win`}>
      <div>{hole.number}</div>
      <div>{hole.par}</div>
      <div>{team1Score}</div>
      <div>{team2Score}</div>
      <div>{getWinnerText(winner)}</div>
    </div>
  );
})}
```

---

## Common Issues & Solutions

### 1. Firebase Connection Issues
**Problem:** App hangs on "Loading Ryder Cup..."

**Solutions:**
- Check `.env` file format (no commas, spaces, quotes)
- Restart dev server after `.env` changes
- Verify Firebase console config matches `.env`
- Check Firestore security rules (should allow read/write)
- Enable Firestore Database in Firebase Console

### 2. Real-Time Updates Not Working
**Problem:** Changes not appearing across devices

**Check:**
- Firestore security rules allow read/write
- Subscriptions properly cleaned up in useEffect
- Using `onSnapshot` not `getDocs` for real-time
- No errors in browser console

### 3. Scoring Not Saving Correctly
**Fixed:** Ensure `nextHole` calculation happens BEFORE Firebase update

**Pattern:**
```javascript
// Calculate everything first
const nextHole = calculateNextHole();
const matchStatus = calculateMatchStatus();

// Then save once
await updateMatch(matchId, {
  holeScores: updatedScores,
  currentHole: nextHole,
  status: matchStatus,
  result: finalResult
});

// Then update local state
if (!isComplete) {
  setCurrentHole(nextHole);
}
```

### 4. Build Errors
**Common causes:**
- React Hooks called conditionally
- Missing dependencies in useEffect
- Unused variables (eslint warnings)
- Import paths incorrect

**Fix:** Check console errors, they're usually very specific

---

## Performance Optimizations

### 1. Parallel Firebase Operations
```javascript
// ✅ Update multiple documents in parallel
const updatePromises = holes.map(hole => setHole(hole.id, hole));
await Promise.all(updatePromises);

// ❌ Don't do sequentially
for (const hole of holes) {
  await setHole(hole.id, hole); // Waits for each one
}
```

### 2. Subscription Cleanup
```javascript
// Always return cleanup function
useEffect(() => {
  const unsubscribe = subscribeToData(callback);
  return () => unsubscribe(); // Prevents memory leaks
}, []);
```

### 3. Conditional Rendering
```javascript
// Early return for loading states
if (!data) return <Loading />;

// Conditional sections
{matches.length > 0 && <MatchList matches={matches} />}
```

---

## Deployment Checklist

1. **Environment Setup:**
   - [ ] Create Firebase project
   - [ ] Enable Firestore Database
   - [ ] Copy config to `.env`
   - [ ] Update security rules

2. **Build & Deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

3. **Post-Deploy:**
   - [ ] Test on deployed URL
   - [ ] Verify real-time updates work
   - [ ] Check scoring flow end-to-end
   - [ ] Test on mobile devices

4. **Production Considerations:**
   - [ ] Implement authentication
   - [ ] Lock down security rules
   - [ ] Set up Firebase hosting custom domain
   - [ ] Enable Firebase Analytics (optional)

---

## Future Enhancement Ideas

1. **Authentication:**
   - Firebase Auth for scorers
   - Role-based access (admin, scorer, viewer)
   - Team captains can manage their roster

2. **Advanced Features:**
   - Live chat/commentary
   - Photo uploads per match
   - Weather integration
   - Player statistics tracking
   - Historical tournament data

3. **Social Features:**
   - Share match results
   - Public leaderboard URL
   - Match highlights
   - Player profiles

4. **Analytics:**
   - Performance tracking
   - Handicap trending
   - Course difficulty analysis
   - Head-to-head records

---

## Key Learnings

### React Patterns
1. **Always** declare hooks before conditional returns
2. Use Firebase subscriptions for real-time, not polling
3. Cleanup subscriptions in useEffect returns
4. State updates are asynchronous - plan accordingly

### Firebase Best Practices
1. Design data structure for your query patterns
2. Use real-time subscriptions sparingly (cost consideration)
3. Batch writes when updating multiple documents
4. Test security rules thoroughly

### Match Play Scoring
1. Match can end early (e.g., 5&4 = 5 up with 4 to play)
2. Handicapping uses stroke index per hole
3. Different formats have different scoring rules
4. Need both gross and net scores for proper records

### Mobile Development
1. Touch targets minimum 44x44px (60x60px better)
2. Font sizes larger on mobile
3. Avoid hover states (use :active instead)
4. Test on actual devices, not just browser resize

---

## Credits & Resources

- **React Documentation:** https://react.dev/
- **Firebase Documentation:** https://firebase.google.com/docs
- **Match Play Rules:** USGA Rules of Golf
- **Ryder Cup Format:** Official Ryder Cup scoring system

---

## Contact & Support

For issues or questions:
1. Check browser console for errors
2. Review this implementation guide
3. Check Firebase Console for data
4. Verify `.env` configuration

**Common Commands:**
```bash
npm start              # Dev server
npm run build          # Production build
firebase deploy        # Deploy to hosting
firebase login         # Login to Firebase
```

---

*Last Updated: 2025-01-28*
*Version: 1.0.0*
