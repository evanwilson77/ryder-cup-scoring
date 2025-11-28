import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  subscribeToMatch,
  subscribeToHoles,
  subscribeToPlayers,
  subscribeToTeams,
  subscribeToMatches,
  updateMatch
} from '../firebase/services';
import {
  calculateNetScore,
  determineHoleWinner,
  calculateMatchStatus,
  getMatchResult,
  getProvisionalResult,
  calculateTournamentPoints
} from '../utils/scoring';
import './Scoring.css';

function Scoring() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [holes, setHoles] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [currentHole, setCurrentHole] = useState(1);
  const [scores, setScores] = useState({});

  useEffect(() => {
    const unsubMatch = subscribeToMatch(matchId, (matchData) => {
      setMatch(matchData);
      setCurrentHole(matchData.currentHole || 1);
    });
    const unsubHoles = subscribeToHoles(setHoles);
    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubTeams = subscribeToTeams(setTeams);
    const unsubMatches = subscribeToMatches(setMatches);

    return () => {
      unsubMatch();
      unsubHoles();
      unsubPlayers();
      unsubTeams();
      unsubMatches();
    };
  }, [matchId]);

  // Initialize scores when hole changes - blank for new holes, load existing scores if already recorded
  useEffect(() => {
    if (match && holes.length > 0) {
      const currentHoleData = holes.find(h => h.number === currentHole);
      const holeIndex = currentHole - 1;
      const existingHoleScore = match.holeScores[holeIndex];

      if (currentHoleData) {
        const loadedScores = {};

        // Only load scores if this hole has already been scored (has a winner)
        if (existingHoleScore && existingHoleScore.winner !== undefined) {
          if (match.format === 'singles') {
            loadedScores.team1Player1 = existingHoleScore.team1Gross || existingHoleScore.team1Player1;
            loadedScores.team2Player1 = existingHoleScore.team2Gross || existingHoleScore.team2Player1;
          } else if (match.format === 'foursomes') {
            loadedScores.team1Score = existingHoleScore.team1Gross || existingHoleScore.team1Score;
            loadedScores.team2Score = existingHoleScore.team2Gross || existingHoleScore.team2Score;
          } else if (match.format === 'fourball') {
            loadedScores.team1Player1 = existingHoleScore.team1Player1Gross || existingHoleScore.team1Player1;
            loadedScores.team1Player2 = existingHoleScore.team1Player2Gross || existingHoleScore.team1Player2;
            loadedScores.team2Player1 = existingHoleScore.team2Player1Gross || existingHoleScore.team2Player1;
            loadedScores.team2Player2 = existingHoleScore.team2Player2Gross || existingHoleScore.team2Player2;
          }
        }
        // Otherwise leave scores empty (blank) for new holes
        setScores(loadedScores);
      }
    }
  }, [currentHole, holes, match]);

  if (!match || holes.length === 0) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const team1 = teams.find(t => t.id === 'team1');
  const team2 = teams.find(t => t.id === 'team2');
  const currentHoleData = holes.find(h => h.number === currentHole);

  const getPlayer = (playerId) => players.find(p => p.id === playerId);

  const handleScoreChange = (field, value) => {
    setScores({
      ...scores,
      [field]: value ? parseInt(value) : null
    });
  };

  const incrementScore = (field) => {
    setScores({
      ...scores,
      [field]: scores[field] ? scores[field] + 1 : currentHoleData.par + 1
    });
  };

  const decrementScore = (field) => {
    setScores({
      ...scores,
      [field]: scores[field] ? Math.max(1, scores[field] - 1) : Math.max(1, currentHoleData.par - 1)
    });
  };

  // Calculate dynamic hole result as scores are entered
  const getDynamicHoleResult = () => {
    if (!currentHoleData || !scores) return null;

    try {
      if (match.format === 'singles') {
        const player1 = getPlayer(match.team1Players[0]);
        const player2 = getPlayer(match.team2Players[0]);

        if (!scores.team1Player1 || !scores.team2Player1) return null;

        const team1Net = calculateNetScore(
          scores.team1Player1,
          player1?.handicap || 0,
          currentHoleData.strokeIndex
        );
        const team2Net = calculateNetScore(
          scores.team2Player1,
          player2?.handicap || 0,
          currentHoleData.strokeIndex
        );

        return determineHoleWinner(match.format, { team1Player1: team1Net, team2Player1: team2Net }, currentHoleData);
      } else if (match.format === 'foursomes') {
        if (!scores.team1Score || !scores.team2Score) return null;

        const avgHandicap1 = (
          (getPlayer(match.team1Players[0])?.handicap || 0) +
          (getPlayer(match.team1Players[1])?.handicap || 0)
        ) / 2;
        const avgHandicap2 = (
          (getPlayer(match.team2Players[0])?.handicap || 0) +
          (getPlayer(match.team2Players[1])?.handicap || 0)
        ) / 2;

        const team1Net = calculateNetScore(scores.team1Score, avgHandicap1, currentHoleData.strokeIndex);
        const team2Net = calculateNetScore(scores.team2Score, avgHandicap2, currentHoleData.strokeIndex);

        return determineHoleWinner(match.format, { team1Score: team1Net, team2Score: team2Net }, currentHoleData);
      } else if (match.format === 'fourball') {
        if (!scores.team1Player1 || !scores.team1Player2 || !scores.team2Player1 || !scores.team2Player2) return null;

        const player1a = getPlayer(match.team1Players[0]);
        const player1b = getPlayer(match.team1Players[1]);
        const player2a = getPlayer(match.team2Players[0]);
        const player2b = getPlayer(match.team2Players[1]);

        const team1P1Net = calculateNetScore(scores.team1Player1, player1a?.handicap || 0, currentHoleData.strokeIndex);
        const team1P2Net = calculateNetScore(scores.team1Player2, player1b?.handicap || 0, currentHoleData.strokeIndex);
        const team2P1Net = calculateNetScore(scores.team2Player1, player2a?.handicap || 0, currentHoleData.strokeIndex);
        const team2P2Net = calculateNetScore(scores.team2Player2, player2b?.handicap || 0, currentHoleData.strokeIndex);

        return determineHoleWinner(match.format, {
          team1Player1: team1P1Net,
          team1Player2: team1P2Net,
          team2Player1: team2P1Net,
          team2Player2: team2P2Net
        }, currentHoleData);
      }
    } catch (error) {
      return null;
    }
  };

  const dynamicResult = getDynamicHoleResult();

  const submitHoleScore = async () => {
    // Ensure we maintain the full array length - initialize with empty objects if needed
    const updatedHoleScores = Array.from({ length: 18 }, (_, i) => match.holeScores[i] || {});
    const holeIndex = currentHole - 1;

    let holeResult = {};

    // Calculate based on format
    if (match.format === 'singles') {
      const player1 = getPlayer(match.team1Players[0]);
      const player2 = getPlayer(match.team2Players[0]);

      const team1Net = calculateNetScore(
        scores.team1Player1,
        player1?.handicap || 0,
        currentHoleData.strokeIndex
      );
      const team2Net = calculateNetScore(
        scores.team2Player1,
        player2?.handicap || 0,
        currentHoleData.strokeIndex
      );

      holeResult = {
        team1Gross: scores.team1Player1,
        team2Gross: scores.team2Player1,
        team1Player1: team1Net,
        team2Player1: team2Net,
        winner: determineHoleWinner(match.format, { team1Player1: team1Net, team2Player1: team2Net }, currentHoleData)
      };
    } else if (match.format === 'foursomes') {
      const avgHandicap1 = (
        (getPlayer(match.team1Players[0])?.handicap || 0) +
        (getPlayer(match.team1Players[1])?.handicap || 0)
      ) / 2;
      const avgHandicap2 = (
        (getPlayer(match.team2Players[0])?.handicap || 0) +
        (getPlayer(match.team2Players[1])?.handicap || 0)
      ) / 2;

      const team1Net = calculateNetScore(scores.team1Score, avgHandicap1, currentHoleData.strokeIndex);
      const team2Net = calculateNetScore(scores.team2Score, avgHandicap2, currentHoleData.strokeIndex);

      holeResult = {
        team1Gross: scores.team1Score,
        team2Gross: scores.team2Score,
        team1Score: team1Net,
        team2Score: team2Net,
        winner: determineHoleWinner(match.format, { team1Score: team1Net, team2Score: team2Net }, currentHoleData)
      };
    } else if (match.format === 'fourball') {
      const player1a = getPlayer(match.team1Players[0]);
      const player1b = getPlayer(match.team1Players[1]);
      const player2a = getPlayer(match.team2Players[0]);
      const player2b = getPlayer(match.team2Players[1]);

      const team1P1Net = calculateNetScore(scores.team1Player1, player1a?.handicap || 0, currentHoleData.strokeIndex);
      const team1P2Net = calculateNetScore(scores.team1Player2, player1b?.handicap || 0, currentHoleData.strokeIndex);
      const team2P1Net = calculateNetScore(scores.team2Player1, player2a?.handicap || 0, currentHoleData.strokeIndex);
      const team2P2Net = calculateNetScore(scores.team2Player2, player2b?.handicap || 0, currentHoleData.strokeIndex);

      holeResult = {
        team1Player1Gross: scores.team1Player1,
        team1Player2Gross: scores.team1Player2,
        team2Player1Gross: scores.team2Player1,
        team2Player2Gross: scores.team2Player2,
        team1Player1: team1P1Net,
        team1Player2: team1P2Net,
        team2Player1: team2P1Net,
        team2Player2: team2P2Net,
        winner: determineHoleWinner(match.format, {
          team1Player1: team1P1Net,
          team1Player2: team1P2Net,
          team2Player1: team2P1Net,
          team2Player2: team2P2Net
        }, currentHoleData)
      };
    }

    updatedHoleScores[holeIndex] = holeResult;

    // For hole 18, just save the score without completing the match
    if (currentHole === 18) {
      await updateMatch(matchId, {
        holeScores: updatedHoleScores,
        currentHole: 18
      });
      // Stay on hole 18, user will confirm to complete
      return;
    }

    // Check if match is complete (won early)
    const matchStatus = calculateMatchStatus(updatedHoleScores, currentHole, team1?.name, team2?.name);
    const result = getMatchResult(updatedHoleScores);

    // If we're editing a past hole, just save it without advancing
    // Only advance currentHole in the database if we're on the actual current hole
    const isOnCurrentHole = currentHole === match.currentHole;
    const nextHole = isOnCurrentHole ? (matchStatus.isComplete ? currentHole : Math.min(currentHole + 1, 18)) : match.currentHole;

    await updateMatch(matchId, {
      holeScores: updatedHoleScores,
      currentHole: nextHole,
      status: matchStatus.isComplete ? 'completed' : 'in_progress',
      result: result
    });

    // Move to next hole or finish only if we were on the current hole
    if (matchStatus.isComplete) {
      alert(`Match completed! ${matchStatus.status}`);
      navigate('/');
    } else if (isOnCurrentHole && currentHole < 18) {
      setCurrentHole(currentHole + 1);
    } else if (!isOnCurrentHole) {
      // If editing a past hole, return to the current hole
      setCurrentHole(match.currentHole);
    }
  };

  const confirmMatchComplete = async () => {
    // Final confirmation after hole 18
    const matchStatus = calculateMatchStatus(match.holeScores, 18, team1?.name, team2?.name);
    const result = getMatchResult(match.holeScores);

    await updateMatch(matchId, {
      currentHole: 18,
      status: 'completed',
      result: result
    });

    alert(`Match completed! ${matchStatus.status}`);
    navigate('/');
  };

  const goToPreviousHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
      // Scores will be loaded by useEffect
    }
  };

  const matchStatus = calculateMatchStatus(match.holeScores, currentHole - 1, team1?.name, team2?.name);

  // Calculate Stableford points (net score relative to par)
  const calculateStableford = (netScore, par) => {
    if (!netScore || !par) return 0;
    const diff = par - netScore;
    if (diff >= 3) return 5; // Albatross or better
    if (diff === 2) return 4; // Eagle
    if (diff === 1) return 3; // Birdie
    if (diff === 0) return 2; // Par
    if (diff === -1) return 1; // Bogey
    return 0; // Double bogey or worse
  };

  const getHoleScoreDetails = (holeScore, holeNumber) => {
    const hole = holes.find(h => h.number === holeNumber);
    if (!hole || !holeScore) return null;

    let details = { hole, scores: [] };

    if (match.format === 'singles') {
      const team1Player = getPlayer(match.team1Players[0]);
      const team2Player = getPlayer(match.team2Players[0]);

      details.scores = [
        {
          team: team1?.name,
          player: team1Player?.name,
          gross: holeScore.team1Gross,
          net: holeScore.team1Player1,
          stableford: calculateStableford(holeScore.team1Player1, hole.par)
        },
        {
          team: team2?.name,
          player: team2Player?.name,
          gross: holeScore.team2Gross,
          net: holeScore.team2Player1,
          stableford: calculateStableford(holeScore.team2Player1, hole.par)
        }
      ];
    } else if (match.format === 'foursomes') {
      details.scores = [
        {
          team: team1?.name,
          player: `${getPlayer(match.team1Players[0])?.name} & ${getPlayer(match.team1Players[1])?.name}`,
          gross: holeScore.team1Gross,
          net: holeScore.team1Score,
          stableford: calculateStableford(holeScore.team1Score, hole.par)
        },
        {
          team: team2?.name,
          player: `${getPlayer(match.team2Players[0])?.name} & ${getPlayer(match.team2Players[1])?.name}`,
          gross: holeScore.team2Gross,
          net: holeScore.team2Score,
          stableford: calculateStableford(holeScore.team2Score, hole.par)
        }
      ];
    } else if (match.format === 'fourball') {
      const team1Player1 = getPlayer(match.team1Players[0]);
      const team1Player2 = getPlayer(match.team1Players[1]);
      const team2Player1 = getPlayer(match.team2Players[0]);
      const team2Player2 = getPlayer(match.team2Players[1]);

      const team1BestNet = Math.min(holeScore.team1Player1 || 999, holeScore.team1Player2 || 999);
      const team2BestNet = Math.min(holeScore.team2Player1 || 999, holeScore.team2Player2 || 999);

      details.scores = [
        {
          team: team1?.name,
          player: `${team1Player1?.name} (${holeScore.team1Player1Gross}/${holeScore.team1Player1}), ${team1Player2?.name} (${holeScore.team1Player2Gross}/${holeScore.team1Player2})`,
          gross: Math.min(holeScore.team1Player1Gross || 999, holeScore.team1Player2Gross || 999),
          net: team1BestNet === 999 ? null : team1BestNet,
          stableford: calculateStableford(team1BestNet === 999 ? null : team1BestNet, hole.par)
        },
        {
          team: team2?.name,
          player: `${team2Player1?.name} (${holeScore.team2Player1Gross}/${holeScore.team2Player1}), ${team2Player2?.name} (${holeScore.team2Player2Gross}/${holeScore.team2Player2})`,
          gross: Math.min(holeScore.team2Player1Gross || 999, holeScore.team2Player2Gross || 999),
          net: team2BestNet === 999 ? null : team2BestNet,
          stableford: calculateStableford(team2BestNet === 999 ? null : team2BestNet, hole.par)
        }
      ];
    }

    return details;
  };

  // Calculate tournament standings
  const { team1Points, team2Points } = calculateTournamentPoints(matches);
  const calculateProjectedPoints = () => {
    let team1Projected = team1Points;
    let team2Projected = team2Points;

    const inProgressMatches = matches.filter(m => m.status === 'in_progress');
    inProgressMatches.forEach(match => {
      const projectedResult = getProvisionalResult(match.holeScores);
      if (projectedResult === 'team1_win') {
        team1Projected += 1;
      } else if (projectedResult === 'team2_win') {
        team2Projected += 1;
      } else if (projectedResult === 'halved') {
        team1Projected += 0.5;
        team2Projected += 0.5;
      }
    });

    return { team1Projected, team2Projected };
  };
  const { team1Projected, team2Projected } = calculateProjectedPoints();

  return (
    <div className="scoring">
      <div className="card">
        <div className="scoring-header">
          <button className="button secondary small" onClick={() => navigate('/matches')}>
            ← Back to Matches
          </button>
          <div>
            <h2>{match.name}</h2>
            <div className="match-status">
              <span className="format-badge">{match.format}</span>
              <span className="status-text">{matchStatus.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card mini-leaderboard">
        <h4>Tournament Standings</h4>
        <div className="mini-score-display">
          <div className="mini-team-score" style={{ backgroundColor: team1?.color }}>
            <div className="mini-team-name">{team1?.name || 'Team 1'}</div>
            <div className="mini-team-points">
              {team1Points}
              {team1Projected !== team1Points && (
                <span className="mini-provisional"> ({team1Projected})</span>
              )}
            </div>
          </div>
          <div className="mini-score-divider">-</div>
          <div className="mini-team-score" style={{ backgroundColor: team2?.color }}>
            <div className="mini-team-name">{team2?.name || 'Team 2'}</div>
            <div className="mini-team-points">
              {team2Points}
              {team2Projected !== team2Points && (
                <span className="mini-provisional"> ({team2Projected})</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="scoring-grid">
        <div className="card hole-info">
          <h3>Hole {currentHole}</h3>
          <div className="hole-details">
            <div className="detail">
              <span className="label">Par</span>
              <span className="value">{currentHoleData?.par}</span>
            </div>
            <div className="detail">
              <span className="label">Stroke Index</span>
              <span className="value">{currentHoleData?.strokeIndex}</span>
            </div>
          </div>
        </div>

        <div className="card match-progress">
          <h4>Match Status</h4>
          <div className="progress-info">
            <div className="score-status">{matchStatus.status}</div>
            <div className="holes-info">
              {matchStatus.holesPlayed} of 18 holes played
            </div>
          </div>
        </div>
      </div>

      <div className="card score-entry">
        <h3>Enter Scores</h3>

        {/* Dynamic hole result indicator */}
        {dynamicResult && (
          <div className={`dynamic-result ${dynamicResult === 'team1' ? 'team1-winning' : dynamicResult === 'team2' ? 'team2-winning' : 'hole-halved'}`}>
            <div className="result-icon">
              {dynamicResult === 'team1' ? '🔴' : dynamicResult === 'team2' ? '🔵' : '🟡'}
            </div>
            <div className="result-text">
              {dynamicResult === 'team1' ? (
                <><strong>{team1?.name}</strong> wins hole</>
              ) : dynamicResult === 'team2' ? (
                <><strong>{team2?.name}</strong> wins hole</>
              ) : (
                <>Hole <strong>Halved</strong></>
              )}
            </div>
          </div>
        )}

        {match.format === 'singles' && (
          <div className="singles-scoring">
            <div className="team-score-section" style={{ borderTopColor: team1?.color }}>
              <h4 style={{ color: team1?.color }}>{team1?.name}</h4>
              <div className="player-score">
                <label>{getPlayer(match.team1Players[0])?.name} (HCP: {getPlayer(match.team1Players[0])?.handicap})</label>
                <div className="score-controls">
                  <button
                    className="score-button decrement"
                    onClick={() => decrementScore('team1Player1')}
                    type="button"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={scores.team1Player1 || ''}
                    onChange={(e) => handleScoreChange('team1Player1', e.target.value)}
                    className="score-input"
                  />
                  <button
                    className="score-button increment"
                    onClick={() => incrementScore('team1Player1')}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="team-score-section" style={{ borderTopColor: team2?.color }}>
              <h4 style={{ color: team2?.color }}>{team2?.name}</h4>
              <div className="player-score">
                <label>{getPlayer(match.team2Players[0])?.name} (HCP: {getPlayer(match.team2Players[0])?.handicap})</label>
                <div className="score-controls">
                  <button
                    className="score-button decrement"
                    onClick={() => decrementScore('team2Player1')}
                    type="button"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={scores.team2Player1 || ''}
                    onChange={(e) => handleScoreChange('team2Player1', e.target.value)}
                    className="score-input"
                  />
                  <button
                    className="score-button increment"
                    onClick={() => incrementScore('team2Player1')}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {match.format === 'foursomes' && (
          <div className="foursomes-scoring">
            <div className="team-score-section" style={{ borderTopColor: team1?.color }}>
              <h4 style={{ color: team1?.color }}>{team1?.name}</h4>
              <p className="team-players">
                {getPlayer(match.team1Players[0])?.name} & {getPlayer(match.team1Players[1])?.name}
              </p>
              <div className="player-score">
                <label>Team Score</label>
                <div className="score-controls">
                  <button
                    className="score-button decrement"
                    onClick={() => decrementScore('team1Score')}
                    type="button"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={scores.team1Score || ''}
                    onChange={(e) => handleScoreChange('team1Score', e.target.value)}
                    className="score-input"
                  />
                  <button
                    className="score-button increment"
                    onClick={() => incrementScore('team1Score')}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="team-score-section" style={{ borderTopColor: team2?.color }}>
              <h4 style={{ color: team2?.color }}>{team2?.name}</h4>
              <p className="team-players">
                {getPlayer(match.team2Players[0])?.name} & {getPlayer(match.team2Players[1])?.name}
              </p>
              <div className="player-score">
                <label>Team Score</label>
                <div className="score-controls">
                  <button
                    className="score-button decrement"
                    onClick={() => decrementScore('team2Score')}
                    type="button"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={scores.team2Score || ''}
                    onChange={(e) => handleScoreChange('team2Score', e.target.value)}
                    className="score-input"
                  />
                  <button
                    className="score-button increment"
                    onClick={() => incrementScore('team2Score')}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {match.format === 'fourball' && (
          <div className="fourball-scoring">
            <div className="team-score-section" style={{ borderTopColor: team1?.color }}>
              <h4 style={{ color: team1?.color }}>{team1?.name}</h4>
              <div className="player-score">
                <label>{getPlayer(match.team1Players[0])?.name} (HCP: {getPlayer(match.team1Players[0])?.handicap})</label>
                <div className="score-controls">
                  <button
                    className="score-button decrement"
                    onClick={() => decrementScore('team1Player1')}
                    type="button"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={scores.team1Player1 || ''}
                    onChange={(e) => handleScoreChange('team1Player1', e.target.value)}
                    className="score-input"
                  />
                  <button
                    className="score-button increment"
                    onClick={() => incrementScore('team1Player1')}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="player-score">
                <label>{getPlayer(match.team1Players[1])?.name} (HCP: {getPlayer(match.team1Players[1])?.handicap})</label>
                <div className="score-controls">
                  <button
                    className="score-button decrement"
                    onClick={() => decrementScore('team1Player2')}
                    type="button"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={scores.team1Player2 || ''}
                    onChange={(e) => handleScoreChange('team1Player2', e.target.value)}
                    className="score-input"
                  />
                  <button
                    className="score-button increment"
                    onClick={() => incrementScore('team1Player2')}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="team-score-section" style={{ borderTopColor: team2?.color }}>
              <h4 style={{ color: team2?.color }}>{team2?.name}</h4>
              <div className="player-score">
                <label>{getPlayer(match.team2Players[0])?.name} (HCP: {getPlayer(match.team2Players[0])?.handicap})</label>
                <div className="score-controls">
                  <button
                    className="score-button decrement"
                    onClick={() => decrementScore('team2Player1')}
                    type="button"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={scores.team2Player1 || ''}
                    onChange={(e) => handleScoreChange('team2Player1', e.target.value)}
                    className="score-input"
                  />
                  <button
                    className="score-button increment"
                    onClick={() => incrementScore('team2Player1')}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="player-score">
                <label>{getPlayer(match.team2Players[1])?.name} (HCP: {getPlayer(match.team2Players[1])?.handicap})</label>
                <div className="score-controls">
                  <button
                    className="score-button decrement"
                    onClick={() => decrementScore('team2Player2')}
                    type="button"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={scores.team2Player2 || ''}
                    onChange={(e) => handleScoreChange('team2Player2', e.target.value)}
                    className="score-input"
                  />
                  <button
                    className="score-button increment"
                    onClick={() => incrementScore('team2Player2')}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="scoring-actions">
          <button
            className="button secondary"
            onClick={goToPreviousHole}
            disabled={currentHole === 1}
          >
            ← Previous Hole
          </button>
          {currentHole === 18 && match.holeScores[17] && match.holeScores[17].winner ? (
            // Hole 18 has been scored, show confirm button
            <button
              className="button"
              onClick={confirmMatchComplete}
            >
              Confirm & Complete Match
            </button>
          ) : (
            // Normal scoring button
            <button
              className="button"
              onClick={submitHoleScore}
              disabled={Object.keys(scores).length === 0}
            >
              {currentHole < match.currentHole
                ? 'Update & Return to Current Hole'
                : currentHole === 18
                  ? 'Submit Hole 18'
                  : matchStatus.isComplete
                    ? 'Complete Match'
                    : 'Next Hole →'}
            </button>
          )}
        </div>
      </div>

      {/* Score history */}
      <div className="card score-history">
        <div className="score-history-header">
          <h3>Score History</h3>
          {currentHole < match.currentHole && (
            <div className="viewing-past-notice">
              Viewing past hole - history shows submitted scores only
            </div>
          )}
        </div>
        <div className="score-history-list">
          {match.holeScores.slice(0, match.currentHole - 1).map((holeScore, idx) => {
            const details = getHoleScoreDetails(holeScore, idx + 1);
            if (!details) return null;

            return (
              <div
                key={idx}
                className={`hole-detail ${holeScore.winner === 'team1' ? 'team1-win' : holeScore.winner === 'team2' ? 'team2-win' : 'halved'}`}
              >
                <div className="hole-header">
                  <div className="hole-title">
                    <strong>Hole {idx + 1}</strong> (Par {details.hole.par}, SI {details.hole.strokeIndex})
                  </div>
                  <div className="hole-result-badge">
                    {holeScore.winner === 'team1' ? team1?.name :
                     holeScore.winner === 'team2' ? team2?.name :
                     'Halved'}
                  </div>
                </div>
                <div className="hole-scores">
                  {details.scores.map((score, scoreIdx) => (
                    <div key={scoreIdx} className="player-hole-score" style={{ borderLeftColor: scoreIdx === 0 ? team1?.color : team2?.color }}>
                      <div className="score-team">{score.team}</div>
                      <div className="score-details">
                        <span className="gross-score">Gross: {score.gross}</span>
                        <span className="net-score">Net: {score.net}</span>
                        <span className="stableford-score">Stableford: {score.stableford}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Scoring;
