/**
 * Anomaly Logging System
 *
 * Tracks suspicious or unusual activities without blocking them.
 * Admins can review logs to identify errors or cheating attempts.
 */

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const ANOMALIES_COLLECTION = 'anomalyLogs';

/**
 * Log an anomaly event
 */
export const logAnomaly = async (anomalyData) => {
  try {
    const anomalyEntry = {
      ...anomalyData,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    await addDoc(collection(db, ANOMALIES_COLLECTION), anomalyEntry);
    console.warn('🚨 Anomaly logged:', anomalyData.type, anomalyData);
  } catch (error) {
    // Fail silently - don't break the app if logging fails
    console.error('Failed to log anomaly:', error);
  }
};

/**
 * Check if player is involved in a match
 */
export const isPlayerInMatch = (playerId, match) => {
  if (!playerId || !match) return false;

  // Check singles match
  if (match.player1 === playerId || match.player2 === playerId) {
    return true;
  }

  // Check partnerships (foursomes, fourballs)
  if (match.partnership1?.includes(playerId) || match.partnership2?.includes(playerId)) {
    return true;
  }

  // Check team matches
  if (match.team1Players?.includes(playerId) || match.team2Players?.includes(playerId)) {
    return true;
  }

  return false;
};

/**
 * Check if player is involved in a scorecard
 */
export const isPlayerInScorecard = (playerId, scorecard, round) => {
  if (!playerId || !scorecard) return false;

  // Individual scorecard
  if (scorecard.playerId === playerId) {
    return true;
  }

  // Team scorecard - check if player is on the team
  if (scorecard.teamId && round?.teams) {
    const team = round.teams.find(t => t.id === scorecard.teamId);
    if (team?.players?.includes(playerId)) {
      return true;
    }
  }

  // Check scoring data for player IDs
  if (scorecard.scoringData) {
    const playerIds = scorecard.scoringData.map(sd => sd.playerId);
    if (playerIds.includes(playerId)) {
      return true;
    }
  }

  return false;
};

/**
 * Log scoring anomaly
 */
export const logScoringAnomaly = async (currentUser, currentPlayer, context, isInvolved) => {
  if (!isInvolved && !context.isAdmin) {
    await logAnomaly({
      type: 'UNAUTHORIZED_SCORING',
      severity: 'MEDIUM',
      userId: currentUser?.uid,
      userEmail: currentUser?.email,
      playerName: currentPlayer?.name,
      playerId: currentPlayer?.id,
      action: context.action, // 'UPDATE_SCORE', 'UPDATE_MATCH', etc.
      targetType: context.targetType, // 'match', 'scorecard', etc.
      targetId: context.targetId,
      targetName: context.targetName,
      description: `${currentPlayer?.name} scored ${context.targetType} they are not involved in`,
      metadata: context.metadata || {}
    });
  }
};

/**
 * Log authentication anomaly
 */
export const logAuthAnomaly = async (type, details) => {
  await logAnomaly({
    type: 'AUTH_ANOMALY',
    severity: 'HIGH',
    subType: type, // 'MULTIPLE_LOGINS', 'SUSPICIOUS_LOGIN', etc.
    ...details
  });
};

/**
 * Log data modification anomaly
 */
export const logDataAnomaly = async (currentUser, action, details) => {
  await logAnomaly({
    type: 'DATA_MODIFICATION',
    severity: 'LOW',
    userId: currentUser?.uid,
    userEmail: currentUser?.email,
    action: action, // 'DELETE_PLAYER', 'MODIFY_PAST_SCORE', etc.
    ...details
  });
};

/**
 * Anomaly types for reference
 */
export const ANOMALY_TYPES = {
  UNAUTHORIZED_SCORING: 'Player scoring match/round they are not in',
  AUTH_ANOMALY: 'Suspicious authentication activity',
  DATA_MODIFICATION: 'Unusual data changes (e.g., modifying past scores)',
  // RAPID_CHANGES: Not used - players often enter all scores at end of match
  SUSPICIOUS_PATTERN: 'Unusual usage pattern detected'
};

export default logAnomaly;
