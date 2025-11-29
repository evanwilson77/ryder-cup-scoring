# Player Database - Initial Setup

## Regular Players

### Core Group
1. **Cyril** - HCP: ___ (to be entered)
2. **Stu** - HCP: ___ (to be entered)
3. **DC** - HCP: ___ (to be entered)
4. **Dodo** - HCP: ___ (to be entered)
5. **Dumpy** - HCP: ___ (to be entered)
6. **Guru** - HCP: ___ (to be entered)
7. **Poo** - HCP: ___ (to be entered)
8. **Hawk** - HCP: ___ (to be entered)
9. **Leaf** - HCP: ___ (to be entered)
10. **Jungle** - HCP: ___ (to be entered)
11. **Ciaran** - HCP: ___ (to be entered)
12. **Travis** - HCP: ___ (to be entered)
13. **Steve** - HCP: ___ (to be entered)

**Total Regular Players: 13**

## Handicap Format

**Precision:** 1 decimal place allowed
- Examples: 12.5, 9.0, 15.3, 8.7

**Rationale:**
- WHS (World Handicap System) uses decimal handicaps
- More accurate player differentiation
- Proper stroke allocation in team formats

## Data Entry Approach

**Phase 1 - Pre-populate Known Players:**
- Create player records for all 13 regular players
- Initial handicap can be 0.0 or placeholder
- Admin can update handicaps before first tournament

**Phase 2 - Historic Data Entry:**
- User will enter past tournament data via admin interface
- Historic handicaps can be entered/edited as data is added
- Handicap history will build up over time

## Player Profile Structure

```javascript
{
  id: "player_cyril",
  name: "Cyril",
  currentHandicap: 12.5, // decimal allowed
  handicapUpdatedAt: "2025-01-15",

  handicapHistory: [
    { handicap: 13.0, date: "2024-01-10", changedBy: "admin" },
    { handicap: 12.5, date: "2025-01-15", changedBy: "admin" }
  ],

  // Statistics (calculated from tournaments)
  totalTournaments: 15,
  tournamentsWon: 3,
  bestStableford: 42,

  // Optional fields
  email: "", // optional
  phone: "", // optional
  photoUrl: "", // optional

  // Tags
  tags: ["regular", "team-trump"]
}
```

## Handicap Validation

**Input Validation:**
- Range: 0.0 - 54.0 (WHS maximum)
- Format: One decimal place (XX.X)
- Examples:
  - ✅ 12.5
  - ✅ 9.0
  - ✅ 15.3
  - ❌ 12 (needs decimal)
  - ❌ 12.55 (too many decimals)

**UI Input:**
```html
<input
  type="number"
  step="0.1"
  min="0"
  max="54"
  placeholder="12.5"
/>
```

## Stroke Allocation with Decimal Handicaps

### Example Calculations:

**Player with HCP 12.5:**
- Gets 1 stroke on holes with SI 1-12
- Gets additional 0.5 stroke distributed by course rules
- Most common: 0.5 rounds down, so effectively 12 strokes

**Player with HCP 18.3:**
- Gets 1 stroke on all 18 holes
- Gets additional 0.3 strokes (rounds to 0 for most purposes)
- Effectively 18 strokes

**Team Handicap Calculations:**

**Scramble (USGA Method):**
```
Team: Cyril (12.5), Stu (15.3), DC (9.7), Dodo (18.2)
Sorted: 9.7, 12.5, 15.3, 18.2

Team HCP = (9.7 × 0.20) + (12.5 × 0.15) + (15.3 × 0.10) + (18.2 × 0.05)
         = 1.94 + 1.875 + 1.53 + 0.91
         = 6.255
         = 6.3 (rounded to 1 decimal)
```

## Storage Format

**Firestore:**
- Store as Number type (supports decimals natively)
- Display format: Always show 1 decimal place
- Sort: Numeric sort works correctly

**Display:**
```javascript
// Always format to 1 decimal place
function formatHandicap(hcp) {
  return hcp.toFixed(1);
}

// Examples:
formatHandicap(12.5) // "12.5"
formatHandicap(9)    // "9.0"
formatHandicap(15.3) // "15.3"
```

## Admin Interface for Handicap Updates

```
+──────────────────────────────────────+
|    Update Player Handicap            |
+──────────────────────────────────────+
| Player: Cyril                        |
| Current Handicap: 12.5               |
|                                      |
| New Handicap: [13.2___]              |
|   (Format: XX.X, e.g., 12.5)         |
|                                      |
| Effective Date: [2025-12-15]         |
|                                      |
| Reason (optional):                   |
| [Playing to a higher standard______] |
|                                      |
| [Cancel] [Update Handicap]           |
+──────────────────────────────────────+
```

## Initial Player Setup Script

When app starts, if no players exist, seed with these 13 players:

```javascript
const initialPlayers = [
  { name: "Cyril", handicap: 0.0 },
  { name: "Stu", handicap: 0.0 },
  { name: "DC", handicap: 0.0 },
  { name: "Dodo", handicap: 0.0 },
  { name: "Dumpy", handicap: 0.0 },
  { name: "Guru", handicap: 0.0 },
  { name: "Poo", handicap: 0.0 },
  { name: "Hawk", handicap: 0.0 },
  { name: "Leaf", handicap: 0.0 },
  { name: "Jungle", handicap: 0.0 },
  { name: "Ciaran", handicap: 0.0 },
  { name: "Travis", handicap: 0.0 },
  { name: "Steve", handicap: 0.0 }
];

// Admin can then update handicaps before creating tournaments
```

## Historic Tournament Participants

**Team Trump (Josef Memorial 2021-2024):**
- Cyril
- Stu
- DC
- Dodo

**Dodo Cup 2024 Winners:**
- Guru
- Cyril

**Chaps Cup October 2025:**
- Dumpy (winner)
- (Other participants TBD when entering historic data)

## Next Steps

1. ✅ Create player records on app initialization
2. Admin updates handicaps via UI
3. Admin enters historic tournament data
4. System links players to tournaments
5. Handicap history builds automatically
6. Player statistics calculate from tournament results

---

**Note:** User will enter other past tournament details directly in the app once it's built. No need to pre-populate all historic data - just the player list and current handicaps.
