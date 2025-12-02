# Tournament Format Configuration Reference

## Format IDs Used in Database

These are the exact format values stored in the database for `round.format`:

### Individual Formats (Scorecard-Based)
- `individual_stroke` - Individual Stroke Play
- `individual_stableford` - Individual Stableford

### Match Play Formats (Match-Based)
- `match_play_singles` - Match Play - Singles (head-to-head)
- `four_ball` - Four-Ball (Better Ball) - 2v2 teams
- `foursomes` - Foursomes (Alternate Shot) - 2v2 teams

### Team Stroke Play Formats (Team Scorecard-Based)
- `scramble` - Scramble / Ambrose
- `best_ball` - Best Ball (Stroke Play)
- `team_stableford` - Team Stableford
- `shamble` - Shamble

## Setup Requirements by Format

### Individual Scorecard Setup ("Setup Scorecards" button appears)
These formats require individual player scorecards:
- `individual_stroke`
- `individual_stableford`

**What happens:**
- Opens `RoundScorecardSetup` component
- Select individual players
- Generates scorecard for each player with 18 holes
- Tracks gross/net scores and stableford points (if applicable)
- Stores in `round.scorecards[]` array

### Team Scorecard Setup ("Setup Team Scorecards" button appears)
These formats require team scorecards:
- `scramble`
- `shamble`
- `best_ball`
- `team_stableford`

**What happens:**
- Opens `RoundTeamScorecardSetup` component
- Select teams (requires tournament to have teams configured)
- Generates team scorecard for each selected team with 18 holes
- Tracks team scores (varies by format - gross/net/points)
- Stores in `round.teamScorecards[]` array

**Navigation to scoring:**
- Scramble → `/tournaments/:id/rounds/:id/scramble/:teamId`
- Shamble → `/tournaments/:id/rounds/:id/shamble/:teamId`
- Best Ball → `/tournaments/:id/rounds/:id/bestball/:teamId`
- Team Stableford → `/tournaments/:id/rounds/:id/team-stableford/:teamId`

### Match Setup ("Setup Matches" button appears)
These formats require match pairings:
- `match_play_singles`
- `four_ball`
- `foursomes`

**What happens:**
- Opens `RoundMatchSetup` component
- **For Team Tournaments:** Creates matches between teams (Team 1 vs Team 2)
- **For Individual Tournaments:**
  - Singles: Direct player vs player pairing
  - Four Ball/Foursomes: Create temporary partnerships (2 players) vs (2 players)
- Each match tracks head-to-head results
- Stores in `round.matches[]` array

**Match Data Structure:**
- **Team Tournaments:** `match.team1Players` and `match.team2Players` arrays
- **Individual Tournaments (Singles):** `match.player1` and `match.player2` strings
- **Individual Tournaments (Partnerships):** `match.partnership1` and `match.partnership2` arrays

## Code Reference

### Format Definitions
**File:** `src/components/FormatExplainerModal.js:11-111`

### Format Checks in TournamentDetail.js

**Check if round uses individual scorecards:**
```javascript
// Individual stroke play
round.format === 'individual_stroke'

// Individual stableford
round.format === 'individual_stableford'
```

**Check if round uses team scorecards:**
```javascript
// Team formats helper function
isTeamScorecardFormat(round)
// Checks for: 'scramble', 'shamble', 'best_ball', 'team_stableford'
```

**Check if round uses matches:**
```javascript
round.format === 'match_play_singles' ||
round.format === 'four_ball' ||
round.format === 'foursomes'
```

### Display Format Name
```javascript
// Convert format ID to readable name
selectedRound.format.replace(/_/g, ' ')
// Example: 'match_play_singles' → 'match play singles'
```

## Tournament Type Considerations

### Match Play in Individual vs Team Tournaments

**Team Tournaments** (tournament.hasTeams = true):
- Match play represents Team 1 vs Team 2 competition
- Players are selected from their respective teams
- Classic Ryder Cup style format
- Each match contributes points to team total

**Individual Tournaments** (tournament.hasTeams = false):
- **Singles:** Any player can be matched against any other player
  - Use case: Knockout brackets, ladder tournaments, club championships
  - Example: Club Championship bracket with 16 players
- **Four Ball/Foursomes:** Players form temporary partnerships for that round only
  - Use case: Mixed competitions, fun formats without permanent teams
  - Example: Monthly "Mix & Match" where pairings change each round
  - Partnerships exist only for that specific round

**Key Difference:**
- Team tournaments require teams to be configured at tournament level
- Individual tournaments allow flexible pairing without permanent team structure
- Individual tournament partnerships are ephemeral (round-specific)

## Common Issues

### Issue: "Setup Scorecards" button doesn't appear
**Cause:** Round format is not set to an individual scorecard format
**Solution:** Check round format is one of: `individual_stroke` or `individual_stableford`

### Issue: "Setup Team Scorecards" button doesn't appear
**Cause:** Round format is not set to a team scorecard format, OR tournament doesn't have teams configured
**Solution:**
1. Check round format is one of: `scramble`, `shamble`, `best_ball`, or `team_stableford`
2. Ensure tournament has teams configured (tournament.teams[] is not empty)

### Issue: "Setup Matches" button doesn't appear
**Cause:** Round format is not set to a match play format
**Solution:** Check round format is one of: `match_play_singles`, `four_ball`, or `foursomes`

### Issue: Format displays as truncated (e.g., "individual stroke" instead of full name)
**Cause:** This is expected - the format ID uses underscores which are replaced with spaces for display
**Solution:** No action needed - this is the correct display format

### Issue: Team scorecard setup shows "No teams configured"
**Cause:** Tournament doesn't have teams set up
**Solution:** Use "Edit Teams" button in the Teams section to configure teams before setting up team scorecards

## Migration Notes

**Historical formats (pre-standardization):**
- Some old tournaments may have `individual_strokeplay` (with "play" suffix)
- Code includes backward compatibility checks for these legacy formats
- New tournaments should always use the standardized format IDs listed above
