import React, { useState, useEffect } from 'react';
import { updateTournament } from '../firebase/tournamentServices';
import { subscribeToPlayers } from '../firebase/services';
import { XMarkIcon, TrophyIcon, CheckIcon } from '@heroicons/react/24/outline';
import './PlayoffManager.css';

function PlayoffManager({ tournament, round, tiedPlayers, onClose, onComplete }) {
  const [players, setPlayers] = useState([]);
  const [playoffMethod, setPlayoffMethod] = useState('sudden_death'); // 'sudden_death', 'countback', 'manual'
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [countbackHoles, setCountbackHoles] = useState('last_9'); // 'last_9', 'last_6', 'last_3', 'last_1'
  const [countbackResults, setCountbackResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubPlayers = subscribeToPlayers((playersData) => {
      setPlayers(playersData);
    });

    return () => unsubPlayers();
  }, []);

  useEffect(() => {
    if (playoffMethod === 'countback' && round && tiedPlayers.length > 0) {
      calculateCountback();
    }
  }, [playoffMethod, countbackHoles, round, tiedPlayers]);

  const getPlayer = (playerId) => {
    return players.find(p => p.id === playerId);
  };

  const calculateCountback = () => {
    if (!round?.courseData?.holes) return;

    const results = tiedPlayers.map(tp => {
      const scorecard = round.scorecards?.find(sc => sc.playerId === tp.playerId);
      if (!scorecard || !scorecard.holes) {
        return { ...tp, countbackScore: null, breakdown: [] };
      }

      let holesToCheck = [];
      switch (countbackHoles) {
        case 'last_9':
          holesToCheck = scorecard.holes.slice(9, 18); // Holes 10-18
          break;
        case 'last_6':
          holesToCheck = scorecard.holes.slice(12, 18); // Holes 13-18
          break;
        case 'last_3':
          holesToCheck = scorecard.holes.slice(15, 18); // Holes 16-18
          break;
        case 'last_1':
          holesToCheck = scorecard.holes.slice(17, 18); // Hole 18 only
          break;
        default:
          holesToCheck = scorecard.holes.slice(9, 18);
      }

      const player = getPlayer(tp.playerId);
      const playerHandicap = player?.handicap || 0;

      // Calculate points for countback holes
      const countbackScore = holesToCheck.reduce((sum, hole) => {
        if (!hole.grossScore) return sum;
        const holeData = round.courseData.holes.find(h => h.number === hole.holeNumber);
        if (!holeData) return sum;

        const strokesReceived = calculateStrokesReceived(playerHandicap, holeData.strokeIndex);
        const netScore = hole.grossScore - strokesReceived;
        const points = calculateStablefordPoints(netScore, holeData.par);
        return sum + points;
      }, 0);

      const breakdown = holesToCheck.map(hole => {
        const holeData = round.courseData.holes.find(h => h.number === hole.holeNumber);
        const strokesReceived = calculateStrokesReceived(playerHandicap, holeData.strokeIndex);
        const netScore = hole.grossScore - strokesReceived;
        const points = calculateStablefordPoints(netScore, holeData.par);
        return {
          holeNumber: hole.holeNumber,
          grossScore: hole.grossScore,
          strokesReceived,
          netScore,
          points
        };
      });

      return {
        ...tp,
        countbackScore,
        breakdown
      };
    });

    // Sort by countback score descending
    results.sort((a, b) => (b.countbackScore || 0) - (a.countbackScore || 0));

    setCountbackResults(results);
  };

  const calculateStrokesReceived = (playerHandicap, holeStrokeIndex) => {
    const roundedHandicap = Math.round(playerHandicap);
    if (roundedHandicap <= 0) return 0;

    if (roundedHandicap >= 18) {
      const extraStrokes = roundedHandicap - 18;
      if (holeStrokeIndex <= extraStrokes) return 2;
      return 1;
    } else {
      return holeStrokeIndex <= roundedHandicap ? 1 : 0;
    }
  };

  const calculateStablefordPoints = (netScore, holePar) => {
    const scoreDiff = netScore - holePar;
    if (scoreDiff <= -3) return 5;
    if (scoreDiff === -2) return 4;
    if (scoreDiff === -1) return 3;
    if (scoreDiff === 0) return 2;
    if (scoreDiff === 1) return 1;
    return 0;
  };

  const getCountbackLabel = () => {
    switch (countbackHoles) {
      case 'last_9': return 'Last 9 Holes (10-18)';
      case 'last_6': return 'Last 6 Holes (13-18)';
      case 'last_3': return 'Last 3 Holes (16-18)';
      case 'last_1': return 'Last Hole (18)';
      default: return '';
    }
  };

  const handleDeclareWinner = async () => {
    if (!selectedWinner && playoffMethod !== 'countback') {
      alert('Please select a winner');
      return;
    }

    setLoading(true);

    try {
      let winnerId, winnerMethod;

      if (playoffMethod === 'countback') {
        // Auto-select countback winner
        if (countbackResults.length === 0 || countbackResults[0].countbackScore === null) {
          alert('Countback calculation failed. Please use manual selection.');
          setLoading(false);
          return;
        }

        // Check if countback resolved the tie
        const topScore = countbackResults[0].countbackScore;
        const stillTied = countbackResults.filter(r => r.countbackScore === topScore);

        if (stillTied.length > 1) {
          alert('Countback did not resolve the tie. Please try a different countback method or use manual selection.');
          setLoading(false);
          return;
        }

        winnerId = countbackResults[0].playerId;
        winnerMethod = `Countback (${getCountbackLabel()})`;
      } else if (playoffMethod === 'sudden_death') {
        winnerId = selectedWinner;
        winnerMethod = 'Sudden Death Playoff';
      } else {
        winnerId = selectedWinner;
        winnerMethod = 'Manual Selection';
      }

      const winnerPlayer = getPlayer(winnerId);
      const winnerData = tiedPlayers.find(tp => tp.playerId === winnerId);

      // Update tournament with winner information
      await updateTournament(tournament.id, {
        winner: winnerPlayer?.name,
        winnerDetails: {
          playerId: winnerId,
          points: winnerData?.points,
          method: winnerMethod,
          tiedPlayers: tiedPlayers.map(tp => ({
            playerId: tp.playerId,
            playerName: getPlayer(tp.playerId)?.name,
            points: tp.points
          })),
          resolvedAt: new Date().toISOString()
        }
      });

      onComplete(winnerId, winnerPlayer?.name, winnerMethod);
    } catch (error) {
      console.error('Error declaring winner:', error);
      alert('Failed to declare winner. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content playoff-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Playoff Required</h2>
            <p className="modal-subtitle">
              {tiedPlayers.length} players tied with {tiedPlayers[0]?.points} points
            </p>
          </div>
          <button onClick={onClose} className="modal-close">
            <XMarkIcon className="icon" />
          </button>
        </div>

        <div className="modal-body">
          {/* Tied Players */}
          <div className="tied-players-section">
            <h3>Tied Players</h3>
            <div className="tied-players-list">
              {tiedPlayers.map(tp => {
                const player = getPlayer(tp.playerId);
                return (
                  <div key={tp.playerId} className="tied-player-card">
                    <div className="player-info">
                      <div className="player-name">{player?.name || 'Unknown'}</div>
                      <div className="player-handicap">HCP {player?.handicap?.toFixed(1)}</div>
                    </div>
                    <div className="player-score">{tp.points} points</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Playoff Method Selection */}
          <div className="playoff-method-section">
            <h3>Resolution Method</h3>
            <div className="method-options">
              <label className={`method-option ${playoffMethod === 'countback' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="playoffMethod"
                  value="countback"
                  checked={playoffMethod === 'countback'}
                  onChange={(e) => setPlayoffMethod(e.target.value)}
                />
                <div className="method-content">
                  <div className="method-name">Countback</div>
                  <div className="method-description">
                    Compare scores from back 9, 6, 3, or 1 hole(s)
                  </div>
                </div>
              </label>

              <label className={`method-option ${playoffMethod === 'sudden_death' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="playoffMethod"
                  value="sudden_death"
                  checked={playoffMethod === 'sudden_death'}
                  onChange={(e) => setPlayoffMethod(e.target.value)}
                />
                <div className="method-content">
                  <div className="method-name">Sudden Death</div>
                  <div className="method-description">
                    Players replay holes until winner emerges
                  </div>
                </div>
              </label>

              <label className={`method-option ${playoffMethod === 'manual' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="playoffMethod"
                  value="manual"
                  checked={playoffMethod === 'manual'}
                  onChange={(e) => setPlayoffMethod(e.target.value)}
                />
                <div className="method-content">
                  <div className="method-name">Manual Selection</div>
                  <div className="method-description">
                    Manually select the winner
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Countback Options */}
          {playoffMethod === 'countback' && (
            <div className="countback-section">
              <h3>Countback Holes</h3>
              <div className="countback-options">
                <label className={`countback-option ${countbackHoles === 'last_9' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="countbackHoles"
                    value="last_9"
                    checked={countbackHoles === 'last_9'}
                    onChange={(e) => setCountbackHoles(e.target.value)}
                  />
                  <span>Last 9 Holes (10-18)</span>
                </label>
                <label className={`countback-option ${countbackHoles === 'last_6' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="countbackHoles"
                    value="last_6"
                    checked={countbackHoles === 'last_6'}
                    onChange={(e) => setCountbackHoles(e.target.value)}
                  />
                  <span>Last 6 Holes (13-18)</span>
                </label>
                <label className={`countback-option ${countbackHoles === 'last_3' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="countbackHoles"
                    value="last_3"
                    checked={countbackHoles === 'last_3'}
                    onChange={(e) => setCountbackHoles(e.target.value)}
                  />
                  <span>Last 3 Holes (16-18)</span>
                </label>
                <label className={`countback-option ${countbackHoles === 'last_1' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="countbackHoles"
                    value="last_1"
                    checked={countbackHoles === 'last_1'}
                    onChange={(e) => setCountbackHoles(e.target.value)}
                  />
                  <span>Last Hole (18)</span>
                </label>
              </div>

              {/* Countback Results */}
              {countbackResults.length > 0 && (
                <div className="countback-results">
                  <h4>Countback Results - {getCountbackLabel()}</h4>
                  <div className="countback-standings">
                    {countbackResults.map((result, index) => {
                      const player = getPlayer(result.playerId);
                      const isWinner = index === 0 && result.countbackScore !== countbackResults[1]?.countbackScore;

                      return (
                        <div key={result.playerId} className={`countback-player ${isWinner ? 'winner' : ''}`}>
                          <div className="countback-position">{index + 1}</div>
                          <div className="countback-player-info">
                            <div className="countback-player-name">
                              {player?.name}
                              {isWinner && <TrophyIcon className="winner-icon" />}
                            </div>
                            <div className="countback-breakdown">
                              {result.breakdown.map(hole => (
                                <span key={hole.holeNumber} className="hole-point">
                                  H{hole.holeNumber}: {hole.points}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="countback-score">{result.countbackScore} pts</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Winner Selection (for sudden death / manual) */}
          {(playoffMethod === 'sudden_death' || playoffMethod === 'manual') && (
            <div className="winner-selection-section">
              <h3>Select Winner</h3>
              <div className="winner-selection-list">
                {tiedPlayers.map(tp => {
                  const player = getPlayer(tp.playerId);
                  return (
                    <label
                      key={tp.playerId}
                      className={`winner-option ${selectedWinner === tp.playerId ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="winner"
                        value={tp.playerId}
                        checked={selectedWinner === tp.playerId}
                        onChange={(e) => setSelectedWinner(e.target.value)}
                      />
                      <div className="winner-option-content">
                        <div className="winner-name">{player?.name || 'Unknown'}</div>
                        <div className="winner-points">{tp.points} points</div>
                      </div>
                      {selectedWinner === tp.playerId && (
                        <CheckIcon className="selected-icon" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button secondary" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleDeclareWinner}
            className="button primary"
            disabled={loading || (playoffMethod !== 'countback' && !selectedWinner)}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Declaring Winner...
              </>
            ) : (
              <>
                <TrophyIcon className="icon" />
                Declare Winner
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayoffManager;
