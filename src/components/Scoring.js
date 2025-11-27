import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  subscribeToMatch,
  subscribeToHoles,
  subscribeToPlayers,
  subscribeToTeams,
  updateMatch
} from '../firebase/services';
import {
  calculateNetScore,
  determineHoleWinner,
  calculateMatchStatus,
  getMatchResult
} from '../utils/scoring';
import './Scoring.css';

function Scoring() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [holes, setHoles] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
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

    return () => {
      unsubMatch();
      unsubHoles();
      unsubPlayers();
      unsubTeams();
    };
  }, [matchId]);

  // Initialize scores with par values when hole changes
  useEffect(() => {
    if (match && holes.length > 0) {
      const currentHoleData = holes.find(h => h.number === currentHole);
      if (currentHoleData) {
        const defaultScores = {};
        if (match.format === 'singles') {
          defaultScores.team1Player1 = currentHoleData.par;
          defaultScores.team2Player1 = currentHoleData.par;
        } else if (match.format === 'foursomes') {
          defaultScores.team1Score = currentHoleData.par;
          defaultScores.team2Score = currentHoleData.par;
        } else if (match.format === 'fourball') {
          defaultScores.team1Player1 = currentHoleData.par;
          defaultScores.team1Player2 = currentHoleData.par;
          defaultScores.team2Player1 = currentHoleData.par;
          defaultScores.team2Player2 = currentHoleData.par;
        }
        setScores(defaultScores);
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
      [field]: (scores[field] || 0) + 1
    });
  };

  const decrementScore = (field) => {
    setScores({
      ...scores,
      [field]: Math.max(1, (scores[field] || 0) - 1)
    });
  };

  const submitHoleScore = async () => {
    const updatedHoleScores = [...match.holeScores];
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

    // Check if match is complete
    const matchStatus = calculateMatchStatus(updatedHoleScores, currentHole);
    const result = getMatchResult(updatedHoleScores);

    // Determine next hole
    const nextHole = matchStatus.isComplete ? currentHole : Math.min(currentHole + 1, 18);

    await updateMatch(matchId, {
      holeScores: updatedHoleScores,
      currentHole: nextHole,
      status: matchStatus.isComplete ? 'completed' : 'in_progress',
      result: result
    });

    // Move to next hole or finish
    if (matchStatus.isComplete) {
      alert(`Match completed! ${matchStatus.status}`);
      navigate('/');
    } else if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
    }
  };

  const goToPreviousHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
      setScores({});
    }
  };

  const matchStatus = calculateMatchStatus(match.holeScores, currentHole - 1);

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
          <button
            className="button"
            onClick={submitHoleScore}
            disabled={Object.keys(scores).length === 0}
          >
            {currentHole === 18 || matchStatus.isComplete ? 'Finish Match' : 'Next Hole →'}
          </button>
        </div>
      </div>

      {/* Score history */}
      <div className="card score-history">
        <h3>Score History</h3>
        <div className="holes-grid">
          {match.holeScores.slice(0, currentHole - 1).map((holeScore, idx) => (
            <div
              key={idx}
              className={`hole-result ${holeScore.winner === 'team1' ? 'team1-win' : holeScore.winner === 'team2' ? 'team2-win' : 'halved'}`}
            >
              <div className="hole-number">Hole {idx + 1}</div>
              <div className="hole-winner">
                {holeScore.winner === 'team1' ? team1?.name :
                 holeScore.winner === 'team2' ? team2?.name :
                 'Halved'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Scoring;
