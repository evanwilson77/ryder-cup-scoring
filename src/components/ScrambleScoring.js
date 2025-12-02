import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { subscribeToTournament } from '../firebase/tournamentServices';
import { subscribeToPlayers } from '../firebase/services';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import {
  calculateScrambleTeamHandicap,
  calculateTeamStrokesReceived,
  ScrambleDriveTracker
} from '../utils/scrambleCalculations';
import {
  QuickScoreButtons,
  HoleNavigationGrid
} from './shared';
import './ScrambleScoring.css';

function ScrambleScoring() {
  const { tournamentId, roundId, teamId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [round, setRound] = useState(null);
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentHole, setCurrentHole] = useState(0);
  const [scores, setScores] = useState([]);
  const [driveSelections, setDriveSelections] = useState([]);
  const [driveTracker, setDriveTracker] = useState(null);
  const [teamHandicap, setTeamHandicap] = useState(0);

  useEffect(() => {
    const unsubTournament = subscribeToTournament(tournamentId, (tournamentData) => {
      setTournament(tournamentData);

      // Find the specific round
      const foundRound = tournamentData.rounds?.find(r => r.id === roundId);
      setRound(foundRound);

      // Find the team
      const foundTeam = tournamentData.teams?.find(t => t.id === teamId);
      setTeam(foundTeam);

      // Find existing scorecard or create new one
      const existingScorecard = foundRound?.teamScorecards?.find(sc => sc.teamId === teamId);
      if (existingScorecard) {
        setScores(existingScorecard.holes || []);
        setDriveSelections(existingScorecard.driveSelections || []);
      } else {
        // Initialize empty scores
        const initialScores = Array(18).fill(null).map((_, index) => ({
          holeNumber: index + 1,
          grossScore: null
        }));
        setScores(initialScores);
        setDriveSelections(Array(18).fill(null));
      }

      setLoading(false);
    });

    const unsubPlayers = subscribeToPlayers((playersData) => {
      setPlayers(playersData);
    });

    return () => {
      unsubTournament();
      unsubPlayers();
    };
  }, [tournamentId, roundId, teamId]);

  // Setup team players and handicap calculation
  useEffect(() => {
    if (team && players.length > 0) {
      const foundTeamPlayers = (team.players || []).map(playerId =>
        players.find(p => p.id === playerId)
      ).filter(Boolean);

      setTeamPlayers(foundTeamPlayers);

      // Calculate team handicap
      const handicaps = foundTeamPlayers.map(p => p.handicap || 0);
      const config = round?.scrambleConfig || {};
      const calculatedHandicap = calculateScrambleTeamHandicap(
        handicaps,
        config.handicapMethod || 'usga',
        config.customPercentages
      );
      setTeamHandicap(calculatedHandicap);

      // Initialize drive tracker
      if (config.enforceDriveRequirements) {
        const tracker = new ScrambleDriveTracker(
          foundTeamPlayers,
          config.minDrivesPerPlayer || 3,
          18
        );

        // Restore saved drive selections
        driveSelections.forEach((selectedPlayerId, index) => {
          if (selectedPlayerId) {
            tracker.recordDriveUsed(selectedPlayerId);
          }
        });

        setDriveTracker(tracker);
      }
    }
  }, [team, players, round, driveSelections]);

  const handleScoreChange = (holeIndex, grossScore) => {
    const newScores = [...scores];
    newScores[holeIndex] = {
      ...newScores[holeIndex],
      grossScore: grossScore
    };
    setScores(newScores);
  };

  const handleDriveSelection = (holeIndex, playerId) => {
    const newSelections = [...driveSelections];
    newSelections[holeIndex] = playerId;
    setDriveSelections(newSelections);

    // Update drive tracker
    if (driveTracker) {
      // Create new tracker and recalculate from scratch
      const config = round?.scrambleConfig || {};
      const newTracker = new ScrambleDriveTracker(
        teamPlayers,
        config.minDrivesPerPlayer || 3,
        18
      );

      newSelections.forEach((selectedPlayerId) => {
        if (selectedPlayerId) {
          newTracker.recordDriveUsed(selectedPlayerId);
        }
      });

      setDriveTracker(newTracker);
    }
  };

  const handleQuickScore = (holeIndex, grossScore) => {
    handleScoreChange(holeIndex, grossScore);
    if (holeIndex < 17) {
      setTimeout(() => setCurrentHole(holeIndex + 1), 300);
    }
  };

  const calculateNetScore = (grossScore, holeStrokeIndex) => {
    if (!grossScore) return null;
    const strokesReceived = calculateTeamStrokesReceived(teamHandicap, holeStrokeIndex);
    return grossScore - strokesReceived;
  };

  const calculateTotalScore = () => {
    const gross = scores.reduce((sum, hole) => sum + (hole.grossScore || 0), 0);
    const net = scores.reduce((sum, hole, index) => {
      if (!hole.grossScore) return sum;
      const holeData = round?.courseData?.holes?.[index];
      if (!holeData) return sum;
      const netScore = calculateNetScore(hole.grossScore, holeData.strokeIndex);
      return sum + (netScore || 0);
    }, 0);

    return { gross, net };
  };

  const handleSaveScore = async () => {
    setSaving(true);

    try {
      // Validate drive requirements if enforced
      const config = round?.scrambleConfig || {};
      if (config.enforceDriveRequirements && driveTracker) {
        const validation = driveTracker.validate();
        if (!validation.isValid) {
          const message = validation.violations.map(v =>
            `${v.playerName}: ${v.used}/${v.required} drives (${v.missing} missing)`
          ).join('\n');

          if (!window.confirm(`Drive requirements not met:\n\n${message}\n\nSave anyway?`)) {
            setSaving(false);
            return;
          }
        }
      }

      const roundIndex = tournament.rounds.findIndex(r => r.id === roundId);
      const updatedRounds = [...tournament.rounds];

      const totalScore = calculateTotalScore();

      const scorecard = {
        teamId: teamId,
        teamName: team.name,
        holes: scores,
        driveSelections: driveSelections,
        totalGross: totalScore.gross,
        totalNet: totalScore.net,
        teamHandicap: teamHandicap,
        status: 'completed',
        completedAt: new Date().toISOString()
      };

      // Add or update team scorecard
      if (!updatedRounds[roundIndex].teamScorecards) {
        updatedRounds[roundIndex].teamScorecards = [];
      }

      const existingIndex = updatedRounds[roundIndex].teamScorecards.findIndex(
        sc => sc.teamId === teamId
      );

      if (existingIndex >= 0) {
        updatedRounds[roundIndex].teamScorecards[existingIndex] = scorecard;
      } else {
        updatedRounds[roundIndex].teamScorecards.push(scorecard);
      }

      await updateDoc(doc(db, 'tournaments', tournamentId), {
        rounds: updatedRounds
      });

      alert('Score saved successfully!');
      navigate(`/tournaments/${tournamentId}`);
    } catch (error) {
      console.error('Error saving score:', error);
      alert('Failed to save score. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !tournament || !round || !team) {
    return (
      <div className="scramble-scoring">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const currentHoleData = round.courseData?.holes?.[currentHole];
  const currentScore = scores[currentHole];
  const currentDriveSelection = driveSelections[currentHole];
  const config = round?.scrambleConfig || {};

  return (
    <div className="scramble-scoring">
      <div className="scoring-container">
        {/* Header */}
        <div className="scoring-header">
          <button
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
            className="button secondary small back-button"
          >
            <ArrowLeftIcon className="icon" />
            Back
          </button>

          <div className="header-info">
            <h1>{team.name}</h1>
            <p className="tournament-info">{tournament.name} - Round {roundIndex + 1}</p>
            <div className="team-handicap">Team Handicap: {teamHandicap}</div>
          </div>

          <button
            onClick={handleSaveScore}
            className="button primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Score'}
          </button>
        </div>

        {/* Team Players */}
        <div className="team-players-info">
          <h3>Team Members</h3>
          <div className="players-list">
            {teamPlayers.map(player => (
              <div key={player.id} className="player-info-card">
                <div className="player-name">{player.name}</div>
                <div className="player-handicap">HCP {player.handicap?.toFixed(1)}</div>
                {driveTracker && config.enforceDriveRequirements && (
                  <div className="drive-count">
                    {driveTracker.getPlayerStatus(player.id, currentHole + 1).used}/
                    {config.minDrivesPerPlayer} drives
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Hole */}
        <div className="current-hole-section">
          <div className="hole-header">
            <h2>Hole {currentHole + 1}</h2>
            <div className="hole-details">
              <span className="hole-par">Par {currentHoleData?.par}</span>
              <span className="hole-si">SI {currentHoleData?.strokeIndex}</span>
              {teamHandicap > 0 && calculateTeamStrokesReceived(teamHandicap, currentHoleData?.strokeIndex) > 0 && (
                <span className="strokes-received">
                  {calculateTeamStrokesReceived(teamHandicap, currentHoleData?.strokeIndex)} stroke
                  {calculateTeamStrokesReceived(teamHandicap, currentHoleData?.strokeIndex) > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Drive Selection */}
          {config.enforceDriveRequirements && (
            <div className="drive-selection-section">
              <h3>Select Best Drive</h3>
              <div className="drive-options">
                {teamPlayers.map(player => {
                  const status = driveTracker?.getPlayerStatus(player.id, currentHole + 1);
                  const needsMore = status && !status.isCompliant && status.warning;

                  return (
                    <label
                      key={player.id}
                      className={`drive-option ${currentDriveSelection === player.id ? 'selected' : ''} ${needsMore ? 'needs-drive' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`drive-hole-${currentHole}`}
                        value={player.id}
                        checked={currentDriveSelection === player.id}
                        onChange={() => handleDriveSelection(currentHole, player.id)}
                      />
                      <div className="drive-option-content">
                        <span className="player-name">{player.name}</span>
                        {needsMore && <span className="warning-badge">⚠️ Needs drives</span>}
                      </div>
                      {currentDriveSelection === player.id && (
                        <CheckIcon className="selected-icon" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Score Entry */}
          <QuickScoreButtons
            onSelect={(score) => handleQuickScore(currentHole, score)}
            selectedScore={currentScore?.grossScore}
            min={1}
            max={12}
            title="Team Score"
          />

          {currentScore?.grossScore && (
            <div className="score-summary">
              <div className="score-detail">
                <span className="label">Gross:</span>
                <span className="value">{currentScore.grossScore}</span>
              </div>
              <div className="score-detail">
                <span className="label">Net:</span>
                <span className="value">
                  {calculateNetScore(currentScore.grossScore, currentHoleData?.strokeIndex)}
                </span>
              </div>
              <div className="score-detail">
                <span className="label">vs Par:</span>
                <span className={`value ${
                  calculateNetScore(currentScore.grossScore, currentHoleData?.strokeIndex) < currentHoleData?.par
                    ? 'under-par'
                    : calculateNetScore(currentScore.grossScore, currentHoleData?.strokeIndex) > currentHoleData?.par
                    ? 'over-par'
                    : 'even-par'
                }`}>
                  {calculateNetScore(currentScore.grossScore, currentHoleData?.strokeIndex) === currentHoleData?.par
                    ? 'Par'
                    : calculateNetScore(currentScore.grossScore, currentHoleData?.strokeIndex) < currentHoleData?.par
                    ? `${currentHoleData?.par - calculateNetScore(currentScore.grossScore, currentHoleData?.strokeIndex)} under`
                    : `${calculateNetScore(currentScore.grossScore, currentHoleData?.strokeIndex) - currentHoleData?.par} over`
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hole Navigation Grid */}
        <HoleNavigationGrid
          currentHole={currentHole}
          onHoleSelect={setCurrentHole}
          completedHoles={scores.map(h => !!h.grossScore)}
          title="Holes"
        />

        {/* Total Score */}
        <div className="total-score-section">
          <h3>Total Score</h3>
          <div className="total-scores">
            <div className="total-item">
              <span className="label">Gross:</span>
              <span className="value">{calculateTotalScore().gross || 0}</span>
            </div>
            <div className="total-item">
              <span className="label">Net:</span>
              <span className="value">{calculateTotalScore().net || 0}</span>
            </div>
            <div className="total-item">
              <span className="label">Team HCP:</span>
              <span className="value">{teamHandicap}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScrambleScoring;
