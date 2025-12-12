# Tournament Round Editing - Implementation Plan

## Executive Summary

Currently, tournament editing only allows changing name, dates, notes, and players. Rounds cannot be added, removed, or edited after tournament creation. This plan adds comprehensive round editing capabilities while protecting scored data.

---

## Current State Analysis

### What Exists ✅
- **Tournament Edit Modal**: Basic metadata editing (name, dates, notes, players)
- **Round Configuration Components**:
  - `RoundCourseConfig.js` - Configure course and holes
  - `RoundMatchSetup.js` - Configure match play pairings
  - `RoundScorecardSetup.js` - Generate individual scorecards
  - `RoundTeamScorecardSetup.js` - Generate team scorecards
- **Round Creation**: Works during tournament setup (TournamentCreation.js)

### What's Missing ❌
- Cannot add rounds to existing tournament
- Cannot remove rounds from existing tournament
- Cannot edit round metadata (name, date, format)
- Cannot reconfigure course settings
- Cannot modify match/scorecard setup

### Current Workaround
**Delete tournament → Recreate → Lose all data** 😞

---

## Proposed Solution

### Phase 1: Extend Edit Tournament Modal

**Add "Rounds" tab to edit modal** with three sections:

#### Section A: Round List Management
```
┌─────────────────────────────────────────────┐
│ Rounds (3)                    [+ Add Round] │
├─────────────────────────────────────────────┤
│ ▼ Round 1 - Saturday, Jan 1      [Edit]    │
│   Individual Stableford           [Delete]  │
│   Course: Pebble Beach | Par: 72 | Status: Completed │
│   ⚠️ Cannot delete - has scores              │
│                                              │
│ ▼ Round 2 - Sunday, Jan 2         [Edit]   │
│   Match Play Singles              [Delete]  │
│   Course: Not configured | Status: Setup    │
│   ✅ Can delete safely                       │
│                                              │
│ ▼ Round 3 - Monday, Jan 3         [Edit]   │
│   Team Stableford                 [Delete]  │
│   Course: Augusta | Par: 72 | Status: Setup│
│   ✅ Can delete safely                       │
└─────────────────────────────────────────────┘
```

#### Section B: Round Metadata Editor
When clicking "Edit" on a round:
```
┌─────────────────────────────────────────────┐
│ Edit Round 2                                │
├─────────────────────────────────────────────┤
│ Round Name: [Round 2____________]           │
│ Date:       [2025-01-02_________]           │
│                                              │
│ Format:     [Individual Stableford ▼]       │
│             ⚠️ Changing format will clear    │
│                scoring data if any exists    │
│                                              │
│ [Configure Course]  [Setup Scoring]         │
│                                              │
│           [Cancel]  [Save Changes]          │
└─────────────────────────────────────────────┘
```

#### Section C: Round Configuration
Deep configuration accessed via buttons:
- **"Configure Course"** → Opens RoundCourseConfig modal
- **"Setup Scoring"** → Opens appropriate setup modal based on format:
  - Match play → RoundMatchSetup
  - Individual → RoundScorecardSetup
  - Team → RoundTeamScorecardSetup

---

## Implementation Details

### 1. UI Components

#### A. Enhanced Edit Tournament Modal
**File**: `src/components/TournamentDetail.js`

**Changes**:
```javascript
// Add to state
const [editTab, setEditTab] = useState('details'); // 'details' | 'rounds'
const [expandedRounds, setExpandedRounds] = useState(new Set());
const [editingRound, setEditingRound] = useState(null);

// New modal structure
<div className="edit-modal-tabs">
  <button onClick={() => setEditTab('details')}>Details</button>
  <button onClick={() => setEditTab('rounds')}>Rounds</button>
</div>

{editTab === 'details' && <TournamentDetailsEditor />}
{editTab === 'rounds' && <RoundEditor />}
```

#### B. New Component: RoundEditor
**File**: `src/components/RoundEditor.js` (NEW)

**Props**:
```javascript
{
  tournament: Tournament object,
  rounds: Array of rounds,
  onAddRound: (round) => void,
  onUpdateRound: (roundId, updates) => void,
  onDeleteRound: (roundId) => void,
  onReorderRounds: (newOrder) => void
}
```

**Features**:
- Expandable round list (accordion style)
- Add new round button
- Edit/Delete buttons per round
- Visual status indicators
- Safety checks before deletion
- Drag-to-reorder (optional enhancement)

#### C. New Component: RoundMetadataEditor
**File**: `src/components/RoundMetadataEditor.js` (NEW)

**Props**:
```javascript
{
  round: Round object,
  tournament: Tournament object,
  onSave: (updates) => void,
  onCancel: () => void,
  onConfigureCourse: () => void,
  onSetupScoring: () => void
}
```

**Fields**:
- Round name (text input)
- Date (date picker)
- Format (dropdown with format options)
- Course summary (read-only, button to configure)
- Scoring setup summary (read-only, button to configure)

### 2. Business Logic

#### A. Round Addition
**Function**: `handleAddRound()`

**Logic**:
```javascript
const handleAddRound = () => {
  const newRound = {
    id: `round-${Date.now()}`,
    roundNumber: rounds.length + 1,
    name: `Round ${rounds.length + 1}`,
    date: tournament.endDate, // Default to last day
    format: null,
    status: 'not_started',
    courseData: { holes: [], totalPar: 0 },
    matches: [],
    scorecards: [],
    teamScorecards: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedRounds = [...rounds, newRound];
  await updateTournament(tournamentId, { rounds: updatedRounds });
};
```

#### B. Round Deletion
**Function**: `handleDeleteRound(roundId)`

**Safety Checks**:
```javascript
const canDeleteRound = (round) => {
  // Check for scored data
  const hasScores =
    (round.scorecards?.some(sc => sc.status !== 'not_started')) ||
    (round.teamScorecards?.some(sc => sc.status !== 'not_started')) ||
    (round.matches?.some(m => m.status !== 'setup'));

  return !hasScores;
};

const handleDeleteRound = (roundId) => {
  const round = rounds.find(r => r.id === roundId);

  if (!canDeleteRound(round)) {
    alert('Cannot delete round with scored data. Please clear scores first.');
    return;
  }

  if (!confirm(`Delete ${round.name}? This cannot be undone.`)) {
    return;
  }

  // Remove round and renumber remaining
  const updatedRounds = rounds
    .filter(r => r.id !== roundId)
    .map((r, idx) => ({
      ...r,
      roundNumber: idx + 1,
      name: r.name.replace(/Round \d+/, `Round ${idx + 1}`)
    }));

  await updateTournament(tournamentId, { rounds: updatedRounds });
};
```

#### C. Round Update
**Function**: `handleUpdateRound(roundId, updates)`

**Logic**:
```javascript
const handleUpdateRound = async (roundId, updates) => {
  const roundIndex = rounds.findIndex(r => r.id === roundId);
  const existingRound = rounds[roundIndex];

  // Check if format is changing
  if (updates.format && updates.format !== existingRound.format) {
    const hasData = existingRound.scorecards?.length > 0 ||
                    existingRound.teamScorecards?.length > 0 ||
                    existingRound.matches?.length > 0;

    if (hasData) {
      const confirmed = confirm(
        'Changing format will clear all scoring configurations. Continue?'
      );
      if (!confirmed) return;

      // Clear format-specific data
      updates.scorecards = [];
      updates.teamScorecards = [];
      updates.matches = [];
    }
  }

  const updatedRounds = [...rounds];
  updatedRounds[roundIndex] = {
    ...existingRound,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await updateTournament(tournamentId, { rounds: updatedRounds });
};
```

#### D. Course Configuration
**Function**: `handleConfigureRoundCourse(roundId)`

**Logic**:
```javascript
const handleConfigureRoundCourse = (roundId) => {
  const round = rounds.find(r => r.id === roundId);
  setConfiguringRound(round);
  setShowCourseConfig(true);
};

const handleSaveCourseConfig = async (courseData) => {
  await handleUpdateRound(configuringRound.id, {
    ...courseData,
    updatedAt: new Date().toISOString()
  });
  setShowCourseConfig(false);
  setConfiguringRound(null);
};
```

#### E. Scoring Setup
**Function**: `handleSetupRoundScoring(roundId)`

**Logic**:
```javascript
const handleSetupRoundScoring = (roundId) => {
  const round = rounds.find(r => r.id === roundId);

  if (!round.format) {
    alert('Please select a format first');
    return;
  }

  if (!round.courseData?.holes?.length) {
    alert('Please configure course first');
    return;
  }

  setConfiguringRound(round);

  // Show appropriate setup modal based on format
  if (['match_play_singles', 'four_ball', 'foursomes'].includes(round.format)) {
    setShowMatchSetup(true);
  } else if (['scramble', 'shamble', 'best_ball', 'team_stableford'].includes(round.format)) {
    setShowTeamScorecardSetup(true);
  } else {
    setShowScorecardSetup(true);
  }
};
```

### 3. Data Validation

#### Required Checks Before Save:

**Round Level**:
- ✅ Round name is not empty
- ✅ Date is valid and within tournament date range
- ✅ Format is selected
- ✅ No duplicate round numbers

**Tournament Level**:
- ✅ At least one round exists
- ✅ Round dates are sequential (optional warning)
- ✅ All rounds have unique IDs

#### Safety Warnings:

**Deleting Round**:
- ⚠️ "This round has scored data and cannot be deleted"
- ⚠️ "This will permanently delete Round X"

**Changing Format**:
- ⚠️ "Changing format will clear all scoring configurations"
- ⚠️ "This round has active scorecards that will be lost"

**Tournament Dates**:
- ⚠️ "Round date is outside tournament date range"
- ⚠️ "Some rounds are scheduled on same date"

### 4. User Experience Flow

#### Scenario 1: Adding a New Round
```
1. User clicks "Edit Tournament" button
2. Clicks "Rounds" tab
3. Clicks "+ Add Round" button
4. New round appears in list with default values
5. User clicks "Edit" on new round
6. Sets name, date, format
7. Clicks "Configure Course"
8. Configures hole details
9. Clicks "Setup Scoring"
10. Configures matches/scorecards
11. Clicks "Save Changes"
12. Modal closes, round list refreshes
```

#### Scenario 2: Editing Existing Round
```
1. User clicks "Edit Tournament" button
2. Clicks "Rounds" tab
3. Clicks "Edit" on existing round
4. Changes name from "Round 2" to "Sunday Morning"
5. Changes date from Jan 2 to Jan 3
6. Clicks "Configure Course" to adjust hole pars
7. Clicks "Save Changes"
8. Round updated, modal closes
```

#### Scenario 3: Deleting Empty Round
```
1. User clicks "Edit Tournament" button
2. Clicks "Rounds" tab
3. Clicks "Delete" on Round 3
4. Sees: "Delete Round 3? This cannot be undone."
5. Confirms deletion
6. Round removed, Round 4 becomes Round 3
7. Modal updates with renumbered rounds
```

#### Scenario 4: Attempting to Delete Scored Round
```
1. User clicks "Delete" on Round 1 (completed)
2. Sees: "Cannot delete round with scored data"
3. Must go to round detail view to clear scores first
4. Then can return and delete
```

---

## Implementation Phases

### Phase 1: Core Round Management (Priority: HIGH)
**Time Estimate**: 4-6 hours

**Tasks**:
- [ ] Add "Rounds" tab to edit modal
- [ ] Create RoundEditor component with list view
- [ ] Implement handleAddRound function
- [ ] Implement handleDeleteRound with safety checks
- [ ] Add round expansion/collapse UI
- [ ] Basic styling to match existing modal

**Deliverable**: Can add and delete rounds

### Phase 2: Round Metadata Editing (Priority: HIGH)
**Time Estimate**: 3-4 hours

**Tasks**:
- [ ] Create RoundMetadataEditor component
- [ ] Implement handleUpdateRound function
- [ ] Add name/date/format editing
- [ ] Add format change warnings
- [ ] Integrate with existing validation

**Deliverable**: Can edit round name, date, format

### Phase 3: Course Configuration Integration (Priority: MEDIUM)
**Time Estimate**: 2-3 hours

**Tasks**:
- [ ] Add "Configure Course" button
- [ ] Wire up RoundCourseConfig modal for editing
- [ ] Handle course data updates
- [ ] Show course summary in round list
- [ ] Add validation for course requirement

**Deliverable**: Can reconfigure course for existing rounds

### Phase 4: Scoring Setup Integration (Priority: MEDIUM)
**Time Estimate**: 3-4 hours

**Tasks**:
- [ ] Add "Setup Scoring" button
- [ ] Wire up appropriate setup modal based on format
- [ ] Handle scorecard/match updates
- [ ] Show scoring summary in round list
- [ ] Add warnings when clearing scored data

**Deliverable**: Can reconfigure matches/scorecards

### Phase 5: Polish and Edge Cases (Priority: LOW)
**Time Estimate**: 2-3 hours

**Tasks**:
- [ ] Add round reordering (drag and drop)
- [ ] Improve mobile responsiveness
- [ ] Add loading states
- [ ] Add success/error notifications
- [ ] Add keyboard shortcuts
- [ ] Add bulk operations (delete multiple)
- [ ] Improve accessibility (ARIA labels)

**Deliverable**: Production-ready UI

---

## Testing Checklist

### Functional Tests

**Round Addition**:
- [ ] Can add round to tournament with 0 rounds
- [ ] Can add round to tournament with existing rounds
- [ ] New round gets correct round number
- [ ] New round has default values
- [ ] New round appears in tournament detail

**Round Deletion**:
- [ ] Cannot delete round with scored data
- [ ] Can delete empty round
- [ ] Remaining rounds renumber correctly
- [ ] Deletion is permanent
- [ ] Confirmation dialog appears

**Round Editing**:
- [ ] Can change round name
- [ ] Can change round date
- [ ] Can change round format (with warning)
- [ ] Changes save correctly
- [ ] Changes appear immediately

**Course Configuration**:
- [ ] Can open course config for existing round
- [ ] Course changes save to correct round
- [ ] Course summary displays correctly
- [ ] Can copy from saved courses

**Scoring Setup**:
- [ ] Correct modal opens based on format
- [ ] Match setup saves correctly
- [ ] Scorecard setup saves correctly
- [ ] Cannot setup without course configured
- [ ] Cannot setup without format selected

### Edge Cases

- [ ] Tournament with 0 rounds
- [ ] Tournament with 10+ rounds
- [ ] Round with no format selected
- [ ] Round with no course configured
- [ ] Partially scored round
- [ ] Completed round with playoff data
- [ ] Changing format clears appropriate data
- [ ] Date validation with tournament dates
- [ ] Concurrent edits (multiple admins)

### Data Integrity

- [ ] Round IDs remain unique
- [ ] Round numbers stay sequential
- [ ] No orphaned scorecards
- [ ] No orphaned matches
- [ ] Tournament updatedAt updates
- [ ] Round updatedAt updates
- [ ] Firebase transactions succeed

---

## API Changes

### New Functions (tournamentServices.js)

```javascript
/**
 * Add a round to an existing tournament
 */
export const addRoundToTournament = async (tournamentId, roundData) => {
  // Implementation
};

/**
 * Update a specific round in a tournament
 */
export const updateTournamentRound = async (tournamentId, roundId, updates) => {
  // Implementation
};

/**
 * Delete a round from a tournament
 */
export const deleteTournamentRound = async (tournamentId, roundId) => {
  // Implementation
};

/**
 * Reorder rounds in a tournament
 */
export const reorderTournamentRounds = async (tournamentId, newOrder) => {
  // Implementation
};

/**
 * Check if round can be safely deleted
 */
export const canDeleteRound = (round) => {
  // Implementation
};
```

---

## UI Mockups

### Edit Modal - Rounds Tab

```
┌─────────────────────────────────────────────────────────────┐
│  Edit Tournament: Summer Championship 2025          [×]     │
├─────────────────────────────────────────────────────────────┤
│  [Details]  [Rounds]  [Teams]                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Rounds (3)                              [+ Add Round]       │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▼ Round 1 - Saturday, June 1, 2025      [Edit] [×] │   │
│  │   Individual Stableford                              │   │
│  │   📍 Pebble Beach | Par 72 | 18 Holes              │   │
│  │   👥 12 Scorecards | ✅ Completed                   │   │
│  │   ⚠️ Cannot delete - has scores                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▶ Round 2 - Sunday, June 2, 2025        [Edit] [×] │   │
│  │   Match Play Singles | Status: Setup                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▶ Round 3 - Monday, June 3, 2025        [Edit] [×] │   │
│  │   Team Stableford | Status: Not Started             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                           [Cancel]  [Save All Changes]      │
└─────────────────────────────────────────────────────────────┘
```

### Round Metadata Editor

```
┌─────────────────────────────────────────────────────────────┐
│  Edit Round 2                                       [×]     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Round Name                                                  │
│  [Sunday Singles________________________]                    │
│                                                               │
│  Date                                                        │
│  [2025-06-02_____]  📅                                      │
│                                                               │
│  Format                                                      │
│  [Match Play Singles                    ▼]                  │
│                                                               │
│  ⚠️ Warning: Changing format will clear scoring data        │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Course Configuration                                 │   │
│  │ 📍 Pebble Beach (Championship)                      │   │
│  │ Par: 72 | 18 Holes Configured                       │   │
│  │                           [Configure Course...]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Scoring Setup                                        │   │
│  │ 🎯 6 Matches Configured                             │   │
│  │ Status: Setup Complete                               │   │
│  │                           [Setup Scoring...]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                               [Cancel]  [Save Changes]      │
└─────────────────────────────────────────────────────────────┘
```

---

## Risks and Mitigation

### Risk 1: Data Loss
**Description**: User accidentally deletes round with scores

**Mitigation**:
- Prevent deletion of rounds with any scored data
- Require explicit confirmation dialog
- Log all deletions with admin info
- Consider soft delete (mark as deleted, hide from UI)

### Risk 2: Concurrent Edits
**Description**: Two admins editing same tournament

**Mitigation**:
- Use Firebase transactions for critical operations
- Show "last updated" timestamp
- Detect conflicts and prompt to refresh
- Consider optimistic locking

### Risk 3: Invalid State
**Description**: Round left in inconsistent state after failed save

**Mitigation**:
- Validate all data before saving
- Use transactions for multi-step operations
- Show clear error messages
- Add rollback capability

### Risk 4: UI Complexity
**Description**: Too many options overwhelm users

**Mitigation**:
- Progressive disclosure (show advanced options on demand)
- Clear visual hierarchy
- Helpful tooltips and hints
- "Undo" option for recent changes

### Risk 5: Mobile Usability
**Description**: Complex UI doesn't work on small screens

**Mitigation**:
- Test on mobile devices early
- Use responsive design patterns
- Consider mobile-specific layouts
- Touch-friendly tap targets

---

## Success Metrics

### User Experience
- ✅ Admin can add round in < 2 minutes
- ✅ Admin can edit round metadata in < 1 minute
- ✅ Admin can reconfigure course in < 3 minutes
- ✅ Clear feedback on all actions
- ✅ No confusion about what's editable

### Data Integrity
- ✅ Zero data loss incidents
- ✅ No orphaned records in database
- ✅ All round numbers remain sequential
- ✅ Tournament dates stay consistent

### Reliability
- ✅ 99.9% successful save operations
- ✅ Graceful handling of network errors
- ✅ No crashes or freezes
- ✅ Works on major browsers (Chrome, Safari, Firefox)

---

## Future Enhancements

**Phase 6** (Post-launch):
- Duplicate round functionality
- Round templates (save/reuse configurations)
- Bulk import from CSV
- Round scheduling suggestions
- Weather integration per round
- Round notes/description field
- Round-specific photo galleries
- Export round configuration as PDF

---

## Questions for User

Before implementing, clarify:

1. **Priority**: Which phase is most urgent?
   - Adding rounds?
   - Editing round metadata?
   - Reconfiguring course/scoring?

2. **Permissions**: Should all admins be able to edit rounds, or only tournament creator?

3. **Soft Delete**: Should deleted rounds be truly deleted or just hidden?

4. **Undo**: How important is an "undo" feature?

5. **Mobile**: How important is mobile editing vs. desktop-only?

6. **Notifications**: Should other admins be notified of round changes?

7. **Audit Log**: Should we track who made what changes and when?

---

## Conclusion

This implementation will:
- ✅ Allow admins to fully manage tournament rounds
- ✅ Prevent data loss with safety checks
- ✅ Reuse existing configuration components
- ✅ Maintain backward compatibility
- ✅ Provide clear user feedback
- ✅ Scale to tournaments with many rounds

**Estimated Total Time**: 14-20 hours for Phases 1-4

**Recommended Approach**: Implement Phase 1 first for quick wins, then prioritize based on user feedback.
