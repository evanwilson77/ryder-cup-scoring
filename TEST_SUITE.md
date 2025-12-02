# Ryder Cup Scoring App - Test Suite Documentation

## Overview

This test suite provides comprehensive coverage of the Ryder Cup Scoring application, including:
- ✅ Stableford scoring calculations
- ✅ Match play scoring logic
- ✅ Tournament management
- ✅ Player initialization
- ✅ Edge cases and error handling

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode (recommended for development)
```bash
npm test -- --watch
```

### Run Tests with Coverage Report
```bash
npm test -- --coverage --watchAll=false
```

### Run Specific Test File
```bash
npm test stablefordCalculations.test.js
```

### Run Tests and Generate Report
```bash
npm test -- --coverage --watchAll=false --json --outputFile=test-results.json
```

## Test Organization

```
src/
├── utils/__tests__/
│   ├── stablefordCalculations.test.js  # Stableford scoring tests
│   ├── scoring.test.js                 # Match play scoring tests
│   └── initializePlayers.test.js       # Player initialization tests
└── firebase/__tests__/
    └── tournamentServices.test.js      # Tournament CRUD tests
```

## Test Coverage Areas

### 1. Stableford Calculations (`stablefordCalculations.test.js`)

**What it tests:**
- Point calculation for different scores (eagle, birdie, par, bogey, etc.)
- Handicap stroke allocation based on stroke index
- Net score calculations
- Front 9 / Back 9 / Total score aggregation
- Partially completed rounds
- Edge cases (null scores, empty arrays, invalid data)

**Key scenarios:**
- ✅ Player scoring par on every hole = 36 points
- ✅ 18 handicap getting 1 stroke per hole
- ✅ Different par values (par 3, 4, 5)
- ✅ Hole-in-one detection on par 3
- ✅ Albatross on par 5

### 2. Match Play Scoring (`scoring.test.js`)

**What it tests:**
- Net score calculation with handicap strokes
- Hole winner determination (singles, fourball, foursomes)
- Match status calculation (who's up, dormie, etc.)
- Match completion detection
- Tournament point allocation (win = 1pt, halve = 0.5pt each)

**Key scenarios:**
- ✅ Singles match play
- ✅ Fourball (best ball) scoring
- ✅ Foursomes (alternate shot) scoring
- ✅ Match won early (e.g., 5&4)
- ✅ Match halved (all square after 18)
- ✅ Stroke allocation based on stroke index
- ✅ Very high handicaps (54 = 3 strokes per hole)

### 3. Tournament Services (`tournamentServices.test.js`)

**What it tests:**
- Creating tournaments with required fields
- Updating tournament details
- Deleting tournaments
- Retrieving tournament data
- Data validation and sanitization
- Team tournament creation

**Key scenarios:**
- ✅ Tournament created with status = 'setup'
- ✅ Undefined values removed from saved data
- ✅ Players can be added/updated
- ✅ Team tournaments with team data
- ✅ Tournament not found returns null

### 4. Player Initialization (`initializePlayers.test.js`)

**What it tests:**
- Default player creation when database is empty
- Skipping initialization if players exist
- Handicap validation (0-54 range)
- Player data structure

**Key scenarios:**
- ✅ Creates default players on first run
- ✅ Skips if players already exist
- ✅ All players have valid handicaps
- ✅ All players marked as isRegular = true

## Understanding Test Results

### Success
```
PASS  src/utils/__tests__/stablefordCalculations.test.js
  ✓ calculates correct points (5ms)
  ✓ handles handicap strokes (3ms)
```

### Failure
```
FAIL  src/utils/__tests__/scoring.test.js
  ✕ calculates net score (12ms)
    Expected: 4
    Received: 5
```

## Coverage Report

Run with coverage to see:
- **Statements**: % of code statements executed
- **Branches**: % of if/else paths tested
- **Functions**: % of functions called
- **Lines**: % of lines executed

Target: **>80% coverage** for critical scoring logic

## Test-Driven Development Workflow

1. **Red**: Write a failing test for new feature
2. **Green**: Write minimal code to make test pass
3. **Refactor**: Improve code while keeping tests green

Example:
```javascript
// 1. RED - Write test first
test('should handle playoff scenarios', () => {
  const result = detectPlayoff(tournamentData);
  expect(result.tiedPlayers).toHaveLength(2);
});

// 2. GREEN - Implement feature
function detectPlayoff(tournament) {
  // ... implementation
}

// 3. REFACTOR - Improve if needed
```

## Adding New Tests

### Template for new test file:
```javascript
/**
 * [Feature Name] Test Suite
 * Tests [description of what's being tested]
 */

import { functionToTest } from '../yourFile';

describe('[Feature Name]', () => {
  describe('functionToTest', () => {
    test('should [expected behavior]', () => {
      const result = functionToTest(input);
      expect(result).toBe(expected);
    });

    test('should handle edge case', () => {
      expect(() => functionToTest(null)).not.toThrow();
    });
  });
});
```

## Common Test Patterns

### Testing calculations
```javascript
expect(calculateScore(4, 4, 0, 10)).toEqual({
  grossScore: 4,
  netScore: 4,
  points: 2
});
```

### Testing arrays
```javascript
expect(scores).toHaveLength(18);
expect(scores[0].grossScore).toBe(4);
```

### Testing null/undefined
```javascript
expect(calculateScore(null, 4, 0, 10).points).toBe(0);
```

### Testing errors
```javascript
expect(() => functionThatThrows()).toThrow('Error message');
```

## Continuous Integration

For CI/CD pipelines, add to your workflow:
```yaml
- name: Run tests
  run: npm test -- --coverage --watchAll=false
- name: Check coverage threshold
  run: npm test -- --coverage --coverageThreshold='{"global":{"statements":80}}'
```

## Debugging Failed Tests

1. **Run single test file**: `npm test scoring.test.js`
2. **Add console.log**: Insert in test to inspect values
3. **Use --verbose**: `npm test -- --verbose`
4. **Check test output**: Look for "Expected" vs "Received"

## Performance Testing

For performance-critical calculations:
```javascript
test('should calculate 1000 rounds in under 1 second', () => {
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    calculateRoundScore(scores, holes, handicap);
  }
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(1000);
});
```

## Integration with AI Debugging

When reporting bugs to AI:
1. Run tests: `npm test -- --coverage --watchAll=false`
2. Copy failing test output
3. Include test file path and line number
4. Provide expected vs actual values

Example bug report:
```
Test failed: calculateMatchStatus
File: src/utils/__tests__/scoring.test.js:45
Expected: "Team 1 wins 5&4"
Received: "Team 1 wins 4&5"

This appears to be a formatting issue in the match result string.
```

## Future Test Areas

**Not yet implemented but should be added:**
- Component rendering tests (React Testing Library)
- User interaction tests (button clicks, form submissions)
- Routing tests
- Firebase security rules tests
- Performance/load tests
- End-to-end tests (Cypress/Playwright)

## Maintenance

- **Update tests** when changing business logic
- **Add tests** for every bug fix
- **Review coverage** regularly (aim for >80%)
- **Refactor tests** to remove duplication
- **Document** complex test scenarios

## Questions?

For issues with tests:
1. Check test output for error messages
2. Review test file to understand what's being tested
3. Compare with actual implementation
4. Run tests in watch mode for instant feedback
