import React from 'react';
import './ScoreCard.css';

/**
 * Reusable ScoreCard component for displaying golf scores
 * Supports individual stroke play, stableford, and match play formats
 */
function ScoreCard({
  holes = [],
  scoringData = [],
  format = 'individual_stroke',
  currentHole = null,
  compact = false,
  className = ''
}) {
  // Calculate totals for a specific scoring row and nine
  const calculateNineTotal = (scores, startIdx, endIdx, field = 'grossScore') => {
    return scores
      .slice(startIdx, endIdx)
      .reduce((sum, hole) => sum + (hole?.[field] || 0), 0);
  };

  // Get color class based on score relative to par
  const getScoreColorClass = (score, par) => {
    if (!score || !par) return '';
    const diff = score - par;
    if (diff <= -2) return 'score-eagle';
    if (diff === -1) return 'score-birdie';
    if (diff === 0) return 'score-par';
    if (diff === 1) return 'score-bogey';
    if (diff >= 2) return 'score-double';
    return '';
  };

  const renderIndividualStroke = () => {
    // Support multiple players (for team formats) or single player (for individual formats)
    const players = scoringData.length > 0 ? scoringData : [{}];
    const isStableford = format === 'stableford';

    return (
      <div className={`scorecard ${compact ? 'compact' : ''} ${className}`}>
        <h4>Scorecard</h4>

        {/* Front 9 */}
        <div className="scorecard-table-container">
          <table className="scorecard-table">
            <thead>
              <tr>
                <th>Hole</th>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <th key={n} className={currentHole === n ? 'current-hole' : ''}>{n}</th>
                ))}
                <th className="total">Out</th>
              </tr>
            </thead>
            <tbody>
              <tr className="par-row">
                <td>Par</td>
                {holes.slice(0, 9).map((hole, idx) => (
                  <td key={idx}>{hole.par}</td>
                ))}
                <td className="total">
                  {holes.slice(0, 9).reduce((sum, h) => sum + h.par, 0)}
                </td>
              </tr>
              {players.map((player, playerIdx) => {
                const scores = player.scores || [];
                const front9Gross = calculateNineTotal(scores, 0, 9);
                const front9Points = isStableford ? calculateNineTotal(scores, 0, 9, 'stablefordPoints') : 0;

                return (
                  <React.Fragment key={playerIdx}>
                    <tr className="score-row">
                      <td>{player.label || 'Score'}</td>
                      {scores.slice(0, 9).map((hole, idx) => (
                        <td
                          key={idx}
                          className={`${hole?.grossScore ? 'scored' : ''} ${getScoreColorClass(hole?.grossScore, holes[idx]?.par)}`}
                        >
                          {hole?.grossScore || '-'}
                        </td>
                      ))}
                      <td className="total">{front9Gross || '-'}</td>
                    </tr>
                    {isStableford && (
                      <tr className="points-row">
                        <td>Pts</td>
                        {scores.slice(0, 9).map((hole, idx) => (
                          <td
                            key={idx}
                            className={`${hole?.stablefordPoints !== null && hole?.stablefordPoints !== undefined ? 'scored' : ''}`}
                          >
                            {hole?.stablefordPoints !== null && hole?.stablefordPoints !== undefined ? hole.stablefordPoints : '-'}
                          </td>
                        ))}
                        <td className="total">{front9Points || '-'}</td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Back 9 */}
          <table className="scorecard-table">
            <thead>
              <tr>
                <th>Hole</th>
                {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(n => (
                  <th key={n} className={currentHole === n ? 'current-hole' : ''}>{n}</th>
                ))}
                <th className="total">In</th>
                <th className="total">{isStableford ? 'Tot' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="par-row">
                <td>Par</td>
                {holes.slice(9, 18).map((hole, idx) => (
                  <td key={idx}>{hole.par}</td>
                ))}
                <td className="total">
                  {holes.slice(9, 18).reduce((sum, h) => sum + h.par, 0)}
                </td>
                <td className="total">
                  {holes.reduce((sum, h) => sum + h.par, 0)}
                </td>
              </tr>
              {players.map((player, playerIdx) => {
                const scores = player.scores || [];
                const front9Gross = calculateNineTotal(scores, 0, 9);
                const back9Gross = calculateNineTotal(scores, 9, 18);
                const totalGross = front9Gross + back9Gross;
                const front9Points = isStableford ? calculateNineTotal(scores, 0, 9, 'stablefordPoints') : 0;
                const back9Points = isStableford ? calculateNineTotal(scores, 9, 18, 'stablefordPoints') : 0;
                const totalPoints = front9Points + back9Points;

                return (
                  <React.Fragment key={playerIdx}>
                    <tr className="score-row">
                      <td>{player.label || 'Score'}</td>
                      {scores.slice(9, 18).map((hole, idx) => (
                        <td
                          key={idx}
                          className={`${hole?.grossScore ? 'scored' : ''} ${getScoreColorClass(hole?.grossScore, holes[idx + 9]?.par)}`}
                        >
                          {hole?.grossScore || '-'}
                        </td>
                      ))}
                      <td className="total">{back9Gross || '-'}</td>
                      <td className="total">{totalGross || '-'}</td>
                    </tr>
                    {isStableford && (
                      <tr className="points-row">
                        <td>Pts</td>
                        {scores.slice(9, 18).map((hole, idx) => (
                          <td
                            key={idx}
                            className={`${hole?.stablefordPoints !== null && hole?.stablefordPoints !== undefined ? 'scored' : ''}`}
                          >
                            {hole?.stablefordPoints !== null && hole?.stablefordPoints !== undefined ? hole.stablefordPoints : '-'}
                          </td>
                        ))}
                        <td className="total">{back9Points || '-'}</td>
                        <td className="total">{totalPoints || '-'}</td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMatchPlay = () => {
    // Handle both 2-row (singles/foursomes) and 4-row (fourball) formats
    const isFourball = scoringData.length === 4;

    let side1Data, side2Data, scores1, scores2;

    if (isFourball) {
      // For fourball: use best NET score from each team for match status
      const team1Player1 = scoringData[0] || {};
      const team1Player2 = scoringData[1] || {};
      const team2Player1 = scoringData[2] || {};
      const team2Player2 = scoringData[3] || {};

      side1Data = { label: team1Player1.label?.split('(')[1]?.replace(')', '') || 'Team 1' };
      side2Data = { label: team2Player1.label?.split('(')[1]?.replace(')', '') || 'Team 2' };

      // Calculate best NET scores for each team on each hole (for match status)
      scores1 = team1Player1.scores?.map((_, idx) => {
        const p1NetScore = team1Player1.scores?.[idx]?.netScore;
        const p2NetScore = team1Player2.scores?.[idx]?.netScore;
        if (!p1NetScore && !p2NetScore) return { netScore: null };
        if (!p1NetScore) return { netScore: p2NetScore };
        if (!p2NetScore) return { netScore: p1NetScore };
        return { netScore: Math.min(p1NetScore, p2NetScore) };
      }) || [];

      scores2 = team2Player1.scores?.map((_, idx) => {
        const p1NetScore = team2Player1.scores?.[idx]?.netScore;
        const p2NetScore = team2Player2.scores?.[idx]?.netScore;
        if (!p1NetScore && !p2NetScore) return { netScore: null };
        if (!p1NetScore) return { netScore: p2NetScore };
        if (!p2NetScore) return { netScore: p1NetScore };
        return { netScore: Math.min(p1NetScore, p2NetScore) };
      }) || [];
    } else {
      side1Data = scoringData[0] || {};
      side2Data = scoringData[1] || {};
      scores1 = side1Data.scores || [];
      scores2 = side2Data.scores || [];
    }

    // Calculate match status using NET scores and track totals
    let matchStatus = { side1: 0, side2: 0, halved: 0 };
    const front9Status = { side1: 0, side2: 0, halved: 0 };
    const back9Status = { side1: 0, side2: 0, halved: 0 };

    scores1.forEach((hole1, idx) => {
      const hole2 = scores2[idx];
      const score1 = hole1?.netScore ?? hole1?.grossScore;
      const score2 = hole2?.netScore ?? hole2?.grossScore;
      if (score1 && score2) {
        let winner = null;
        if (score1 < score2) {
          matchStatus.side1++;
          winner = 'side1';
        } else if (score2 < score1) {
          matchStatus.side2++;
          winner = 'side2';
        } else {
          matchStatus.halved++;
          winner = 'halved';
        }

        // Track front 9 and back 9 separately
        if (idx < 9) {
          front9Status[winner]++;
        } else {
          back9Status[winner]++;
        }
      }
    });

    const holesUp = matchStatus.side1 - matchStatus.side2;
    const holesRemaining = 18 - (matchStatus.side1 + matchStatus.side2 + matchStatus.halved);
    const front9Up = front9Status.side1 - front9Status.side2;
    const back9Up = back9Status.side1 - back9Status.side2;

    return (
      <div className={`scorecard match-play ${compact ? 'compact' : ''} ${className}`}>
        <div className="scorecard-header">
          <h4>Match Scorecard</h4>
          <div className="match-status-badge">
            {holesUp === 0 ? 'All Square' :
             holesUp > 0 ? `${side1Data.label} ${Math.abs(holesUp)} UP` :
             `${side2Data.label} ${Math.abs(holesUp)} UP`}
            {holesRemaining > 0 && ` • ${holesRemaining} to play`}
          </div>
        </div>

        {/* Front 9 */}
        <div className="scorecard-table-container">
          <table className="scorecard-table match-table">
            <thead>
              <tr>
                <th>Hole</th>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <th key={n} className={currentHole === n ? 'current-hole' : ''}>{n}</th>
                ))}
                <th className="total">Out</th>
              </tr>
            </thead>
            <tbody>
              <tr className="par-row">
                <td>Par</td>
                {holes.slice(0, 9).map((hole, idx) => (
                  <td key={idx}>{hole.par}</td>
                ))}
                <td className="total">
                  {holes.slice(0, 9).reduce((sum, h) => sum + h.par, 0)}
                </td>
              </tr>
              {scoringData.map((playerData, playerIdx) => {
                const isTeam1 = playerIdx < (isFourball ? 2 : 1);
                const playerScores = playerData.scores || [];
                const front9Total = playerScores.slice(0, 9)
                  .reduce((sum, hole) => sum + (hole?.grossScore || 0), 0);
                return (
                  <tr key={playerIdx} className={`score-row ${isTeam1 ? 'side1' : 'side2'}`}>
                    <td>{playerData.label || `Player ${playerIdx + 1}`}</td>
                    {playerScores.slice(0, 9).map((hole, idx) => {
                      // For fourball, check if this player's score contributed to winning the hole
                      let won = false;
                      if (hole?.netScore && scores1[idx]?.netScore && scores2[idx]?.netScore) {
                        const teamWon = scores1[idx].netScore < scores2[idx].netScore ? 'team1' :
                                       scores2[idx].netScore < scores1[idx].netScore ? 'team2' : null;
                        const isWinningTeam = (teamWon === 'team1' && isTeam1) || (teamWon === 'team2' && !isTeam1);
                        // Player contributed if they scored the best NET score for their winning team
                        if (isWinningTeam) {
                          const teamBestScore = isTeam1 ? scores1[idx].netScore : scores2[idx].netScore;
                          won = hole.netScore === teamBestScore;
                        }
                      }
                      return (
                        <td key={idx} className={`${hole?.grossScore ? 'scored' : ''} ${won ? 'won-hole' : ''}`}>
                          {hole?.grossScore || '-'}
                        </td>
                      );
                    })}
                    <td className="total">{front9Total || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Back 9 */}
          <table className="scorecard-table match-table">
            <thead>
              <tr>
                <th>Hole</th>
                {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(n => (
                  <th key={n} className={currentHole === n ? 'current-hole' : ''}>{n}</th>
                ))}
                <th className="total">In</th>
                <th className="total">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="par-row">
                <td>Par</td>
                {holes.slice(9, 18).map((hole, idx) => (
                  <td key={idx}>{hole.par}</td>
                ))}
                <td className="total">
                  {holes.slice(9, 18).reduce((sum, h) => sum + h.par, 0)}
                </td>
                <td className="total">
                  {holes.reduce((sum, h) => sum + h.par, 0)}
                </td>
              </tr>
              {scoringData.map((playerData, playerIdx) => {
                const isTeam1 = playerIdx < (isFourball ? 2 : 1);
                const playerScores = playerData.scores || [];
                const front9Total = playerScores.slice(0, 9)
                  .reduce((sum, hole) => sum + (hole?.grossScore || 0), 0);
                const back9Total = playerScores.slice(9, 18)
                  .reduce((sum, hole) => sum + (hole?.grossScore || 0), 0);
                const overallTotal = front9Total + back9Total;
                return (
                  <tr key={playerIdx} className={`score-row ${isTeam1 ? 'side1' : 'side2'}`}>
                    <td>{playerData.label || `Player ${playerIdx + 1}`}</td>
                    {playerScores.slice(9, 18).map((hole, idx) => {
                      const holeIdx = idx + 9;
                      // For fourball, check if this player's score contributed to winning the hole
                      let won = false;
                      if (hole?.netScore && scores1[holeIdx]?.netScore && scores2[holeIdx]?.netScore) {
                        const teamWon = scores1[holeIdx].netScore < scores2[holeIdx].netScore ? 'team1' :
                                       scores2[holeIdx].netScore < scores1[holeIdx].netScore ? 'team2' : null;
                        const isWinningTeam = (teamWon === 'team1' && isTeam1) || (teamWon === 'team2' && !isTeam1);
                        // Player contributed if they scored the best NET score for their winning team
                        if (isWinningTeam) {
                          const teamBestScore = isTeam1 ? scores1[holeIdx].netScore : scores2[holeIdx].netScore;
                          won = hole.netScore === teamBestScore;
                        }
                      }
                      return (
                        <td key={idx} className={`${hole?.grossScore ? 'scored' : ''} ${won ? 'won-hole' : ''}`}>
                          {hole?.grossScore || '-'}
                        </td>
                      );
                    })}
                    <td className="total">{back9Total || '-'}</td>
                    <td className="total">{overallTotal || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render based on format
  if (format === 'match_play' || format === 'singles' || format === 'fourball' || format === 'foursomes') {
    return renderMatchPlay();
  }

  // individual_stroke or stableford
  return renderIndividualStroke();
}

export default ScoreCard;
