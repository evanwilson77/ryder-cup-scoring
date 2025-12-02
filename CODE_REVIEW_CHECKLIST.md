# Code Review Checklist

## Before Committing Changes to Scoring Components

### Shared Component Usage
- [ ] Does this component display a scorecard? → Must use `ScoreCard.js`
- [ ] Does this component have score input with +/- buttons? → Must use `ScoreEntry.js`
- [ ] Does this component show hole information? → Should use `HoleInfo.js`
- [ ] Are you creating custom CSS for scorecards? → STOP - use shared CSS
- [ ] Are you duplicating scorecard table markup? → STOP - use ScoreCard component

### Consistency Checks
- [ ] Compare visual appearance with other scoring screens
- [ ] Verify +/- button behavior matches (first click = par)
- [ ] Check scorecard symbols (circles, squares) are displaying
- [ ] Confirm status badges match other screens
- [ ] Verify navigation patterns are consistent

### Architecture Validation
- [ ] Check `COMPONENT_ARCHITECTURE.md` for required shared components
- [ ] Run audit: `grep -r "scorecard-table" src/components/*.js` (should only find shared component)
- [ ] Run audit: `grep -r "score-button.*decrement" src/components/*.js` (should only find shared component)
- [ ] Verify no CSS duplication between component-specific and shared CSS files

## When Creating New Scoring Components

### Planning Phase
- [ ] Review existing shared components first
- [ ] Identify which shared components can be reused
- [ ] Document any NEW shared components needed
- [ ] Check if similar functionality exists elsewhere

### Implementation Phase
- [ ] Import and use shared components
- [ ] Pass appropriate props to shared components
- [ ] Only create custom UI for truly unique features
- [ ] Document any deviations from standard architecture

### Testing Phase
- [ ] Visual regression test against other scoring screens
- [ ] Verify shared component props work correctly
- [ ] Test on mobile and desktop
- [ ] Check browser cache isn't showing old styles

## Red Flags 🚩

These patterns indicate a problem:

1. **Creating `<table className="scorecard-table">`** → Should use ScoreCard component
2. **Creating `<button className="score-button increment">`** → Should use ScoreEntry component
3. **Copying CSS from another scoring component** → Should use shared CSS
4. **Implementing +/- button logic from scratch** → Should use ScoreEntry component
5. **Hard-coding hole information display** → Should use HoleInfo component

## Audit Commands

Run these to find inconsistencies:

```bash
# Find all custom scorecard tables (should only be in shared component)
grep -n "className=\"scorecard-table\"" src/components/*.js

# Find all custom score input buttons (should only be in ScoreEntry)
grep -n "className=\"score-button" src/components/*.js

# Find all components NOT importing shared components
grep -L "import.*shared" src/components/*Scoring.js

# Find CSS files with scorecard styles (should only be in shared CSS)
grep -l "scorecard-table" src/components/*.css
```

## Recovery Process

If you find an inconsistent component:

1. Create a refactoring task in the backlog
2. Document the discrepancy in `COMPONENT_ARCHITECTURE.md`
3. Add to the "Refactoring TODO" section
4. Prioritize based on user-facing impact
5. Refactor to use shared components
6. Test thoroughly
7. Update documentation
