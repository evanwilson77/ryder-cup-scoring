import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToTournament, updateTournament } from '../firebase/tournamentServices';
import { subscribeToPlayers } from '../firebase/services';
import { ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { calculateNetScore } from '../utils/scoring';
import { useAuth } from '../contexts/AuthContext';
import { useAutoSave, useScoreEntry } from '../hooks';
import HoleInfo from './shared/HoleInfo';
import ScoreCard from './shared/ScoreCard';
import ScoreEntry from './shared/ScoreEntry';
import AutoSaveIndicator from './shared/AutoSaveIndicator';
import ScorePreview from './shared/ScorePreview';
import LeaderboardSummary from './shared/LeaderboardSummary';
import SubmitScorecardButton from './shared/SubmitScorecardButton';
import MediaButton from './shared/MediaButton';
import './ScorecardScoring.css';

function ScorecardScoring() {
  const { tournamentId, roundId, scorecardId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [round, setRound] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [player, setPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentHole, setCurrentHole] = useState(1);
  const [grossScore, setGrossScore] = useState('');
  const [loading, setLoading] = useState(true);

  // Custom hooks
  const getCurrentHole = () => round?.courseData?.holes?.find(h => h.number === currentHole);
  const holeData = getCurrentHole();
  const { increment, decrement } = useScoreEntry(holeData?.par || 4);

  const autoSaveScore = async (holeNumber, score) => {
    if (!score || !round || !player || !scorecard) return;

    const holeData = round.courseData.holes.find(h => h.number === holeNumber);
    const netScore = calculateNetScore(
      parseInt(score),
      player?.handicap || 0,
      holeData.strokeIndex
    );
    const stablefordPoints = calculateStablefordPoints(netScore, holeData.par);

    // Update scorecard
    const updatedHoles = [...scorecard.holes];
    updatedHoles[holeNumber - 1] = {
      ...updatedHoles[holeNumber - 1],
      grossScore: parseInt(score),
      netScore: netScore,
      stablefordPoints: stablefordPoints
    };

    // Calculate totals
    const totalGross = updatedHoles.reduce((sum, h) => sum + (h.grossScore || 0), 0);
    const totalNet = updatedHoles.reduce((sum, h) => sum + (h.netScore || 0), 0);
    const totalStableford = updatedHoles.reduce((sum, h) => sum + (h.stablefordPoints || 0), 0);
    const holesCompleted = updatedHoles.filter(h => h.grossScore !== null).length;

    // Update the round in the tournament
    const updatedRounds = tournament.rounds.map(r => {
      if (r.id === roundId) {
        return {
          ...r,
          scorecards: round.scorecards.map(sc => {
            if (sc.id === scorecardId) {
              return {
                ...sc,
                holes: updatedHoles,
                totalGross: totalGross,
                totalNet: totalNet,
                totalStableford: totalStableford,
                status: holesCompleted > 0 ? 'in_progress' : 'not_started'
              };
            }
            return sc;
          }),
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    const tournamentUpdate = {
      rounds: updatedRounds
    };

    if (tournament.status === 'setup') {
      tournamentUpdate.status = 'in_progress';
    }

    await updateTournament(tournamentId, tournamentUpdate);
  };

  const { isSaving, save: triggerAutoSave } = useAutoSave(autoSaveScore, 1000);

  useEffect(() => {
    const unsubTournament = subscribeToTournament(tournamentId, (tournamentData) => {
      setTournament(tournamentData);

      // Find the round
      const roundData = tournamentData.rounds.find(r => r.id === roundId);
      if (roundData) {
        setRound(roundData);

        // Find the scorecard
        const scorecardData = roundData.scorecards?.find(sc => sc.id === scorecardId);
        if (scorecardData) {
          setScorecard(scorecardData);

          // Find first unscored hole or default to hole 1
          const firstUnscoredHole = scorecardData.holes.findIndex(h => h.grossScore === null);
          setCurrentHole(firstUnscoredHole !== -1 ? firstUnscoredHole + 1 : 1);
        }
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
  }, [tournamentId, roundId, scorecardId]);

  useEffect(() => {
    if (scorecard && players.length > 0) {
      const playerData = players.find(p => p.id === scorecard.playerId);
      setPlayer(playerData);
    }
  }, [scorecard, players]);

  useEffect(() => {
    // Load existing score when hole changes
    if (scorecard && scorecard.holes[currentHole - 1]) {
      const holeData = scorecard.holes[currentHole - 1];
      setGrossScore(holeData.grossScore ||  '');
    }
  }, [currentHole, scorecard]);

  const calculateStablefordPoints = (netScore, par) => {
    if (!netScore || !par) return 0;
    const diff = par - netScore;
    if (diff >= 3) return 5; // Albatross or better
    if (diff === 2) return 4; // Eagle
    if (diff === 1) return 3; // Birdie
    if (diff === 0) return 2; // Par
    if (diff === -1) return 1; // Bogey
    return 0; // Double bogey or worse
  };

  const handleScoreChange = (newScore) => {
    setGrossScore(newScore);
    if (newScore) {
      triggerAutoSave(currentHole, newScore);
    }
  };

  const incrementScore = () => {
    const newScore = increment(grossScore);
    handleScoreChange(newScore.toString());
  };

  const decrementScore = () => {
    const newScore = decrement(grossScore);
    handleScoreChange(newScore.toString());
  };

  const nextHole = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
    }
  };

  const previousHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

  if (loading || !tournament || !round || !scorecard || !player) {
    return (
      <div className="scorecard-scoring">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const currentHoleScore = scorecard.holes[currentHole - 1];
  const isScorecardCompleted = scorecard.status === 'completed';
  const canEdit = isAdmin || !isScorecardCompleted;

  const netScore = grossScore ? calculateNetScore(
    parseInt(grossScore),
    player.handicap,
    holeData?.strokeIndex
  ) : null;

  const points = netScore && holeData ? calculateStablefordPoints(netScore, holeData.par) : null;

  return (
    <div className="scorecard-scoring">
      <div className="scoring-header-bar">
        <button
          onClick={() => navigate(`/tournaments/${tournamentId}`)}
          className="button secondary small"
        >
          <ArrowLeftIcon className="icon" />
          Back
        </button>
        <div className="header-title">
          <h2>{player.name}</h2>
          <span className="round-name">{round.name}</span>
        </div>
        <AutoSaveIndicator isSaving={isSaving} />
      </div>

      {/* Completed Scorecard Notice */}
      {isScorecardCompleted && (
        <div className={`card ${isAdmin ? 'admin-edit-notice' : 'completed-notice'}`}>
          <div className="notice-content">
            <LockClosedIcon className="notice-icon" />
            <div className="notice-text">
              {isAdmin ? (
                <>
                  <h4>Scorecard Completed</h4>
                  <p>This scorecard has been submitted. As an admin, you can still make edits if needed.</p>
                </>
              ) : (
                <>
                  <h4>Scorecard Completed & Submitted</h4>
                  <p>This scorecard has been submitted and can no longer be edited. Only admins can make changes to completed scorecards.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Hole Scoring - FIRST */}
      <div className="card current-hole-scoring">
        <HoleInfo
          holeNumber={currentHole}
          par={holeData?.par}
          strokeIndex={holeData?.strokeIndex}
        />

        <ScoreEntry
          value={grossScore}
          onChange={handleScoreChange}
          onIncrement={incrementScore}
          onDecrement={decrementScore}
          label="Gross Score"
          min={1}
          max={15}
          disabled={!canEdit}
        />

        <ScorePreview
          grossScore={grossScore ? parseInt(grossScore) : null}
          netScore={netScore}
          points={points}
          par={holeData?.par}
          format="stableford"
        />

        <div className="scoring-actions">
          <button
            className="button secondary"
            onClick={previousHole}
            disabled={currentHole === 1 || !canEdit}
          >
            ← Prev
          </button>
          {currentHole < 18 ? (
            <button
              className="button primary"
              onClick={nextHole}
              disabled={!canEdit}
            >
              Next →
            </button>
          ) : (
            // On hole 18, show Complete button if all holes are scored
            scorecard.holes.every(h => h.grossScore !== null) && !isScorecardCompleted ? (
              <button
                className="button primary complete-button"
                onClick={async () => {
                  if (window.confirm('Complete and submit your scorecard? You won\'t be able to make changes after submission.')) {
                    // Update scorecard status to completed
                    const roundIndex = tournament.rounds.findIndex(r => r.id === roundId);
                    const updatedRounds = [...tournament.rounds];
                    const scorecardIndex = updatedRounds[roundIndex].scorecards.findIndex(sc => sc.id === scorecardId);
                    updatedRounds[roundIndex].scorecards[scorecardIndex] = {
                      ...scorecard,
                      status: 'completed',
                      completedAt: new Date().toISOString()
                    };

                    // Check if all scorecards are now completed
                    const allCompleted = updatedRounds[roundIndex].scorecards.every(sc =>
                      sc.id === scorecardId ? true : sc.status === 'completed'
                    );

                    // If all scorecards are completed, mark the round as complete
                    if (allCompleted) {
                      updatedRounds[roundIndex] = {
                        ...updatedRounds[roundIndex],
                        status: 'completed',
                        completedAt: new Date().toISOString()
                      };
                    }

                    await updateTournament(tournamentId, { rounds: updatedRounds });
                    navigate(`/tournaments/${tournamentId}`);
                  }
                }}
              >
                ✓ Complete & Submit
              </button>
            ) : (
              <button
                className="button primary"
                onClick={nextHole}
                disabled
              >
                Next →
              </button>
            )
          )}
        </div>
      </div>

      {/* Score Summary - SECOND */}
      <div className="card score-summary-card">
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Points</span>
            <span className="value points">{scorecard.totalStableford || 0}</span>
          </div>
          <div className="summary-item">
            <span className="label">Gross</span>
            <span className="value">{scorecard.totalGross || 0}</span>
          </div>
          <div className="summary-item">
            <span className="label">Net</span>
            <span className="value">{scorecard.totalNet || 0}</span>
          </div>
        </div>

        {/* Submit Scorecard Button - appears when all 18 holes are scored */}
        {scorecard.holes.every(h => h.grossScore !== null) && !isScorecardCompleted && (
          <SubmitScorecardButton
            tournament={tournament}
            roundId={roundId}
            scorecardId={scorecardId}
            onComplete={() => navigate(`/tournaments/${tournamentId}`)}
          />
        )}
      </div>


      {/* Scorecard Table - THIRD */}
      <div className="card scorecard-table-card">
        <ScoreCard
          holes={round.courseData?.holes || []}
          scoringData={[{
            label: player.name,
            scores: scorecard.holes
          }]}
          format="stableford"
          currentHole={currentHole}
        />
      </div>

      {/* Leaderboard Summary - LAST */}
      <LeaderboardSummary
        scorecards={round?.scorecards || []}
        players={players}
        currentScorecardId={scorecardId}
        format="stableford"
      />

      {/* Floating Media Button */}
      <MediaButton
        tournamentId={tournamentId}
        roundId={roundId}
        holeNumber={currentHole}
        playerId={player?.id}
        category="action"
      />
    </div>
  );
}

export default ScorecardScoring;
