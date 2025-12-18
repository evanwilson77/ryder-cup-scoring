# Scoring Formats Cross-Format Consistency Checklist

**Last Updated**: 2025-12-17

## Purpose

This document ensures that any modification to scoring components is consistently applied across ALL relevant formats. The goal is to prevent inconsistencies where changes are made to one format but not propagated to others.

**CRITICAL RULE**: When making ANY change to a scoring component, you MUST evaluate whether that change applies to other formats and update them accordingly. Do NOT assume the user will test all formats individually.

---

## Scoring Component Files

### Team Formats (Stroke Play)
- `src/components/ScrambleScoring.js` - Scramble/Ambrose format
- `src/components/ShambleScoring.js` - Shamble format
- `src/components/BestBallScoring.js` - Best Ball (4BBB) and Team Stableford

### Individual Formats
- `src/components/ScorecardScoring.js` - Individual Stroke Play
- `src/components/StablefordScoring.js` - Individual Stableford Points

### Match Play Formats
- `src/components/Scoring.js` - All match play (Four-Ball, Foursomes, Singles)

---

## Standard Component Structure

### Team Formats (Scramble, Shamble, Best Ball)

**Expected Order:**
1. **Tournament Header Card** (tournament info, format, team handicap)
2. **AutoSaveIndicator** (at end of header)
3. **Current Hole Section** (hole info, scoring inputs)
4. **Drive Selection Section** (Scramble/Shamble only)
5. **Drive Totals** (displayed below scorecard)
6. **Navigation Controls** (Previous/Next Hole, Complete Round)
7. **ScoreCard Component** (full scorecard display)

**What NOT to include:**
- ❌ "Team Members" section between header and Current Hole
- ❌ Duplicate drive tracking panels
- ❌ Player lists with drive counts in header area

### Individual Formats (Scorecard, Stableford)

**Expected Order:**
1. **Tournament Header** (tournament info, format, player name)
2. **AutoSaveIndicator** (at end of header)
3. **Current Hole Scoring** (FIRST - before scorecard)
4. **ScorePreview** (gross, net, points breakdown)
5. **Navigation Controls** (Previous/Next Hole)
6. **ScoreCard Component** (full scorecard display)
7. **Complete Round Button** (at bottom)

---

## Cross-Format Consistency Checklist

When making ANY modification to a scoring component, complete this checklist:

### 1. Layout/CSS Changes
- [ ] **ScrambleScoring.js** - Applied?
- [ ] **ShambleScoring.js** - Applied?
- [ ] **BestBallScoring.js** - Applied?
- [ ] **ScorecardScoring.js** - Applied?
- [ ] **StablefordScoring.js** - Applied?
- [ ] **Scoring.js** (Match Play) - Applied?
- [ ] **Associated CSS files** - Updated consistently?

**Examples:**
- Score preview layout (gross/net/points display)
- Spacing between components
- Mobile responsiveness
- Button styling
- Card layouts

### 2. Shared Component Updates
- [ ] Identify which formats use the shared component
- [ ] Test each format that uses it
- [ ] Verify consistent behavior across all formats

**Commonly Shared Components:**
- `ScoreCard` (used by: ALL formats)
- `ScoreEntry` (used by: ScorecardScoring, StablefordScoring, BestBallScoring)
- `HoleInfo` (used by: ALL formats)
- `AutoSaveIndicator` (used by: ALL formats)
- `ScorePreview` (used by: Individual formats)
- `PlayerScoreEntry` (used by: Team formats)
- `SubmitScorecardButton` (used by: ALL formats)

### 3. Auto-Save Behavior
- [ ] All formats use consistent auto-save delay (1 second)
- [ ] All formats show AutoSaveIndicator consistently
- [ ] No layout jumping when indicator appears/disappears

### 4. Score Display
- [ ] Gross/Net scores display on single line (mobile)
- [ ] Points display included (Stableford formats only)
- [ ] Spacing consistent between score elements
- [ ] Font sizes consistent across formats

### 5. Drive Tracking (Scramble/Shamble only)
- [ ] Drive selection mandatory in both formats
- [ ] Drive totals displayed below scorecard in both
- [ ] Drive tracker class used consistently
- [ ] Warning messages consistent

### 6. Navigation
- [ ] Previous/Next hole buttons work consistently
- [ ] Hole navigation grid available in all formats
- [ ] Complete round flow consistent
- [ ] Confirmation dialogs consistent

### 7. Media Integration
- [ ] Camera button available in all formats
- [ ] Media modal opens consistently
- [ ] Photos associated with correct hole/round

---

## Common Pitfalls to Avoid

### 1. Section Duplication
**Problem**: Adding a "Team Members" section to one team format but not others.

**Solution**: If you add a new section to one format, check if it should exist in related formats. If not, document WHY it's format-specific.

### 2. CSS Inconsistency
**Problem**: Fixing mobile layout in BestBallScoring but not ScrambleScoring.

**Solution**: All team formats should have identical mobile layout behavior for common elements (score display, spacing, buttons).

### 3. Shared Component Misuse
**Problem**: One format using outdated custom scorecard instead of shared ScoreCard component.

**Solution**: Audit all formats to ensure they use shared components. Never create format-specific versions of shared components.

### 4. Auto-Save Differences
**Problem**: Different formats showing "Saving..." text differently causing layout shifts.

**Solution**: All formats MUST use AutoSaveIndicator component with identical props and behavior.

### 5. Feature Flags Not Propagated
**Problem**: Making drive tracking mandatory in Scramble but leaving it optional in Shamble.

**Solution**: When changing feature behavior, evaluate if the same business rule applies to related formats.

---

## Testing Protocol

Before committing changes to ANY scoring component:

### Quick Test (Required)
1. Open the modified format in browser
2. Test on desktop and mobile (DevTools)
3. Navigate through holes
4. Test auto-save behavior
5. Complete a full round

### Full Test (Required for shared component changes)
1. Test ALL formats that use the shared component
2. Verify consistent behavior across formats
3. Test edge cases (first hole, last hole, completed rounds)
4. Test on actual mobile device if possible

### Cross-Format Audit (Required for layout changes)
1. Open two formats side-by-side
2. Compare visual appearance
3. Compare spacing and sizing
4. Compare mobile behavior
5. Compare interaction patterns

---

## Format-Specific Features

### Features ONLY in Scramble/Shamble
- Drive selection ("Select Best Drive")
- Drive tracking and totals
- Minimum drives per player requirements

### Features ONLY in Stableford Formats
- Points calculation and display
- Par/Birdie/Eagle point indicators
- Points-based leaderboard

### Features ONLY in Match Play
- Hole-by-hole match status (Win/Loss/Halve)
- Match score display (holes up/down)
- Early completion (mathematically decided)

---

## Change Review Questions

Before committing, ask yourself:

1. **Does this change affect layout?**
   - If YES → Check all 6 scoring components

2. **Does this change affect shared components?**
   - If YES → Check all components that use it

3. **Does this change affect mobile display?**
   - If YES → Test on mobile for all formats

4. **Does this change affect score calculation?**
   - If YES → Check related format calculation utilities

5. **Does this change remove a section?**
   - If YES → Verify it's removed from ALL formats unless format-specific

6. **Does this add a new feature?**
   - If YES → Evaluate which formats should have it

---

## Historical Issues

### Issue 1: Team Members Section (2025-12-17)
**Problem**: "Team Members" section removed from ShambleScoring and BestBallScoring but remained in ScrambleScoring, causing inconsistency.

**Root Cause**: Change was made to one format without evaluating other team formats.

**Resolution**: Removed from ScrambleScoring. Created this checklist to prevent recurrence.

**Lesson**: When removing UI sections, check ALL formats for similar sections.

### Issue 2: AutoSave Layout Jumping (2025-12-17)
**Problem**: "Saving..." text causing layout shifts in multiple formats.

**Root Cause**: AutoSaveIndicator implementation inconsistent across formats.

**Resolution**: Updated AutoSaveIndicator to use opacity transitions. Applied to all formats.

**Lesson**: Shared component changes must be verified across all consumers.

---

## Quick Reference: Format Groupings

When making changes, consider these groupings:

**Team Stroke Play Formats** (should be nearly identical):
- ScrambleScoring.js
- ShambleScoring.js
- BestBallScoring.js

**Individual Formats** (should be nearly identical):
- ScorecardScoring.js
- StablefordScoring.js

**Match Play** (unique structure):
- Scoring.js

---

## Maintenance

This checklist should be updated whenever:
1. A new scoring format is added
2. A new shared component is created
3. A cross-format consistency issue is discovered
4. The component structure changes significantly

---

**Remember**: The user should NEVER have to test all formats individually for a single change. It's the developer's responsibility to ensure cross-format consistency.
