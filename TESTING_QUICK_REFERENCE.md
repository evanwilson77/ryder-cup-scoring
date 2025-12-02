# Testing Quick Reference

## Quick Commands

```bash
# Run all tests once
npm run test:once

# Run tests with coverage report
npm run test:coverage

# Run tests and generate human-readable report
npm run test:report

# Run tests in watch mode (for development)
npm test

# Run specific test file
npm test stablefordCalculations
```

## Test Files Created

1. **`src/utils/__tests__/stablefordCalculations.test.js`** (45 tests)
   - Point calculations for all score types
   - Handicap stroke allocation
   - Front 9/Back 9/Total calculations
   - Edge cases

2. **`src/utils/__tests__/scoring.test.js`** (35 tests)
   - Match play net score calculations
   - Hole winner determination (singles, fourball, foursomes)
   - Match status and completion
   - Tournament point allocation

3. **`src/firebase/__tests__/tournamentServices.test.js`** (12 tests)
   - CRUD operations for tournaments
   - Data validation
   - Team tournament handling

4. **`src/utils/__tests__/initializePlayers.test.js`** (6 tests)
   - Player initialization logic
   - Handicap validation

## What Gets Tested

### ✅ Stableford Scoring
- Correct points: Eagle (4pts), Birdie (3pts), Par (2pts), Bogey (1pt)
- Handicap strokes based on stroke index
- 18 handicap = 1 stroke per hole
- 36 handicap = 2 strokes per hole
- Net score calculations
- Round totals and splits

### ✅ Match Play
- Singles, Fourball, Foursomes scoring
- Stroke allocation (SI 1-18)
- Match status (who's up, dormie, halved)
- Early match completion (5&4, 3&2, etc.)
- Tournament points (win=1, halve=0.5 each)

### ✅ Tournament Management
- Create, read, update, delete operations
- Status transitions (setup → in_progress → completed)
- Player lists
- Team configurations
- Data sanitization

### ✅ Edge Cases
- Null/undefined scores
- Empty arrays
- Very high handicaps (54+)
- Partially completed rounds
- Invalid data handling

## Reading Test Results

### ✅ Passing Test
```
PASS  src/utils/__tests__/stablefordCalculations.test.js
  Stableford Calculations
    calculateHoleScore
      ✓ should calculate correct points for different scores (5ms)
```

### ❌ Failing Test
```
FAIL  src/utils/__tests__/scoring.test.js
  Match Play Scoring
    calculateNetScore
      ✕ should deduct handicap strokes (12ms)

    Expected: 4
    Received: 5

      24 |   expect(calculateNetScore(5, 18, 10)).toBe(4);
    > 25 |   expect(calculateNetScore(5, 9, 15)).toBe(5);
         |                                         ^
```

## Using Tests for Bug Fixing

### Scenario: Bug Found
1. Write a test that demonstrates the bug
2. Run test - it should fail
3. Fix the code
4. Run test again - it should pass

### Example
```javascript
test('bug: playoff not detecting tie correctly', () => {
  const tournament = {
    rounds: [{
      scorecards: [
        { playerId: 'p1', totalPoints: 36, status: 'completed' },
        { playerId: 'p2', totalPoints: 36, status: 'completed' }
      ]
    }]
  };

  const playoff = detectPlayoff(tournament);
  expect(playoff.tiedPlayers).toHaveLength(2);
});
```

## For AI Debugging

When reporting a bug with tests:

1. **Run the test suite:**
   ```bash
   npm run test:report
   ```

2. **Include in bug report:**
   - Test file name and line number
   - Expected vs Actual values
   - Relevant test code
   - Stack trace if available

3. **Example Bug Report:**
   ```
   Test: src/utils/__tests__/scoring.test.js:45
   Function: calculateNetScore
   Input: grossScore=5, handicap=9, strokeIndex=15
   Expected: 5 (no stroke on SI 15 for 9 hcp)
   Actual: 4 (incorrectly giving stroke)

   Issue: Handicap stroke allocation is applying strokes
   to SI values higher than the handicap value.
   ```

## Coverage Goals

- **Critical Path** (scoring logic): >90%
- **Business Logic**: >80%
- **Overall**: >70%

Current coverage (run `npm run test:coverage` to check):
- Statements: ___%
- Branches: ___%
- Functions: ___%
- Lines: ___%

## Adding Your Own Tests

Template:
```javascript
describe('My Feature', () => {
  test('should do something specific', () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });
});
```

Common assertions:
- `expect(value).toBe(expected)` - exact equality
- `expect(value).toEqual(expected)` - deep equality (objects/arrays)
- `expect(array).toHaveLength(n)` - array length
- `expect(value).toBeDefined()` - not undefined
- `expect(value).toBeNull()` - is null
- `expect(value).toBeGreaterThan(n)` - numeric comparison
- `expect(() => fn()).toThrow()` - throws error

## Continuous Improvement

- Add tests for every bug fix
- Update tests when changing business logic
- Review coverage reports monthly
- Refactor tests to reduce duplication
- Document complex test scenarios
