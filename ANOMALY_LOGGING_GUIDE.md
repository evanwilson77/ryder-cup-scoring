# Anomaly Logging System - Usage Guide

**Status:** ✅ Implemented
**Purpose:** Track suspicious activities without blocking them

---

## 🎯 What It Does

The anomaly logging system monitors and records:
- Players scoring matches they're not involved in
- Suspicious authentication patterns
- Unusual data modifications
- Rapid changes that might indicate errors

**Key Feature:** Logs anomalies but **doesn't block** actions - allows flexibility while maintaining awareness.

---

## 📊 How to Use

### For Admins:

1. **View Logs:**
   - Settings dropdown → "🔍 Anomaly Logs"
   - Or navigate to `/admin/anomaly-logs`

2. **Filter Logs:**
   - By type: Unauthorized Scoring, Authentication, Data Modifications
   - By time: Last 24 hours, 7 days, 30 days, or all time

3. **Interpret Results:**
   - **No logs** = Good! No suspicious activity
   - **Unauthorized scoring** = Player might be scoring wrong match
   - **Check metadata** = Click "View Metadata" for full details

---

## 💻 For Developers: Integration

### Example 1: Scoring Component

```javascript
import { useAuth } from '../contexts/AuthContext';
import { logScoringAnomaly, isPlayerInMatch } from '../utils/anomalyLogger';

function ScoringComponent() {
  const { currentUser, currentPlayer, isAdmin } = useAuth();

  const handleScoreUpdate = async (matchId, matchData, newScore) => {
    // Check if player is involved in this match
    const isInvolved = isPlayerInMatch(currentPlayer.id, matchData);

    // Log anomaly if player is scoring a match they're not in
    await logScoringAnomaly(currentUser, currentPlayer, {
      action: 'UPDATE_SCORE',
      targetType: 'match',
      targetId: matchId,
      targetName: `${matchData.player1Name} vs ${matchData.player2Name}`,
      metadata: { newScore }
    }, isInvolved);

    // Continue with scoring (don't block)
    await updateScore(matchId, newScore);
  };

  return (
    // ... your component JSX
  );
}
```

### Example 2: Match Scorecard

```javascript
import { logScoringAnomaly, isPlayerInScorecard } from '../utils/anomalyLogger';

const handleScorecardUpdate = async (scorecardId, scorecardData, roundData) => {
  const { currentUser, currentPlayer, isAdmin } = useAuth();

  // Check involvement
  const isInvolved = isPlayerInScorecard(
    currentPlayer.id,
    scorecardData,
    roundData
  );

  // Log if not involved
  await logScoringAnomaly(currentUser, currentPlayer, {
    action: 'UPDATE_SCORECARD',
    targetType: 'scorecard',
    targetId: scorecardId,
    targetName: scorecardData.playerName || scorecardData.teamName,
    metadata: {
      roundId: roundData.id,
      roundName: roundData.name
    }
  }, isInvolved);

  // Continue with update
  await updateScorecard(scorecardId, newData);
};
```

### Example 3: Data Modification Anomaly

```javascript
import { logDataAnomaly } from '../utils/anomalyLogger';

// Log when someone modifies a completed tournament
await logDataAnomaly(currentUser, 'MODIFY_COMPLETED_TOURNAMENT', {
  description: 'Score modified after tournament completion',
  tournamentId: tournamentId,
  tournamentName: tournament.name,
  originalScore: oldScore,
  newScore: newScore
});
```

---

## 🔍 Anomaly Types

| Type | Description | Severity | Notes |
|------|-------------|----------|-------|
| `UNAUTHORIZED_SCORING` | Player scoring match they're not in | MEDIUM | Most useful - catches wrong match selection |
| `AUTH_ANOMALY` | Suspicious login patterns | HIGH | Unusual login activity |
| `DATA_MODIFICATION` | Unusual data changes | LOW | e.g., modifying completed tournament |
| `SUSPICIOUS_PATTERN` | Unusual usage detected | MEDIUM | Custom patterns you define |

**Note:** "Rapid changes" is NOT tracked - players commonly enter all scores at end of match, which is normal behavior.

---

## 🔒 Security

### Firestore Rules:
```javascript
match /anomalyLogs/{logId} {
  allow read: if isAdmin();           // Only admins can view
  allow create: if isSignedIn();      // Anyone can create logs
  allow update, delete: if false;     // Logs are immutable
}
```

### Why This Design?
- ✅ Players can trigger logs (transparency)
- ✅ Logs can't be tampered with (immutable)
- ✅ Only admins see logs (privacy)
- ✅ System can auto-log anomalies

---

## 📱 Mobile Considerations

The admin log viewer is responsive and works on mobile:
- Touch-friendly interface
- Collapsible metadata sections
- Readable on small screens

---

## 🎮 Real-World Scenarios

### Scenario 1: Wrong Match Selection
**What happens:**
1. Player accidentally opens wrong match
2. Enters scores
3. System logs: "Player not in match"

**Admin review:**
- Check log timestamp
- Contact player to verify
- Correct scores if needed

### Scenario 2: Admin Scoring for Others
**What happens:**
1. Admin enters scores on behalf of player
2. System logs: "Unauthorized scoring"
3. **But doesn't block it** (admin privilege)

**Result:**
- Scores saved successfully
- Log shows it was admin
- Clear audit trail

### Scenario 3: Testing/Practice
**What happens:**
1. Player testing scoring system
2. Multiple anomalies logged

**Admin review:**
- See pattern of test activity
- No action needed
- Clear logs if desired (future feature)

---

## 🚀 Future Enhancements

### Optional Features:
- **In-App Warnings:** Show dialog to player when anomaly detected
- **Automatic Blocking:** Option to block certain anomaly types
- **Email Notifications:** Alert admin on HIGH severity logs
- **Log Cleanup:** Batch delete old logs
- **Statistics Dashboard:** Anomaly trends over time

### Example Warning Dialog:
```javascript
if (!isInvolved && !isAdmin) {
  const confirmContinue = window.confirm(
    "⚠️ This doesn't appear to be your match. Continue anyway?"
  );
  if (!confirmContinue) return;
}
```

---

## 📋 Admin Checklist

### Weekly Review:
- [ ] Check anomaly logs for patterns
- [ ] Contact players with repeated unauthorized scoring
- [ ] Verify no authentication anomalies

### Monthly Review:
- [ ] Review all HIGH severity logs
- [ ] Update scoring instructions if needed
- [ ] Clean up resolved anomalies (manual)

### Tournament Start:
- [ ] Brief players on correct scoring procedure
- [ ] Mention anomaly monitoring (transparency)
- [ ] Provide help contacts

---

## 🆘 Troubleshooting

### "No logs showing"
- ✅ Good! No anomalies detected
- Try changing time range filter

### "Too many logs"
- Review player training
- Check if testing occurred
- Look for systematic issues

### "Can't access anomaly logs"
- Verify you're logged in as admin
- Check URL: `/admin/anomaly-logs`
- Verify Firestore rules deployed

### "Logs not recording"
- Check browser console for errors
- Verify Firestore rules allow `create`
- Test with known anomaly

---

## 📖 API Reference

### Functions:

#### `logAnomaly(anomalyData)`
Log a custom anomaly.

**Parameters:**
- `type` (string): Anomaly type
- `severity` (string): 'LOW', 'MEDIUM', 'HIGH'
- `description` (string): Human-readable description
- `metadata` (object): Additional data

#### `logScoringAnomaly(currentUser, currentPlayer, context, isInvolved)`
Log scoring-related anomaly.

**Parameters:**
- `currentUser`: Firebase Auth user
- `currentPlayer`: Player object
- `context`: { action, targetType, targetId, targetName, metadata }
- `isInvolved`: boolean - is player involved?

#### `isPlayerInMatch(playerId, match)`
Check if player is in a match.

**Returns:** boolean

#### `isPlayerInScorecard(playerId, scorecard, round)`
Check if player is in a scorecard.

**Returns:** boolean

---

## 🎉 Benefits

1. **Non-Intrusive:** Doesn't block legitimate actions
2. **Transparent:** Players know system is monitored
3. **Flexible:** Admin can review and decide
4. **Educational:** Helps identify training gaps
5. **Audit Trail:** Clear record of all activities
6. **Scalable:** Works for any tournament size

---

**Implementation:** Complete ✅
**Integration:** Easy - 2 lines of code
**Impact:** Improved security without friction
