import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  calculateHoleScore,
  calculateRoundScore,
  formatScoreToPar
} from '../utils/stablefordCalculations';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAutoSave, useScoreEntry } from '../hooks';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import {
  AutoSaveIndicator,
  ScoreCard,
  ScoreEntry,
  LeaderboardSummary,
  MediaButton,
  HoleInfo,
  ScorePreview
} from './shared';
import './StablefordScoring.css';

function StablefordScoring() {
  const { tournamentId, roundId, scorecardId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [round, setRound] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [player, setPlayer] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [scores, setScores] = useState([]);
  const [currentHole, setCurrentHole] = useState(0);
  const [roundSummary, setRoundSummary] = useState(null);

  // Custom hooks
  const courseHole = round?.courseData?.holes?.[currentHole];
  const { increment, decrement } = useScoreEntry(courseHole?.par || 4);

  const autoSaveScore = async (updatedScores) => {
    if (!round || !player || !tournament) return;

    try {
      // Calculate final summary
      const finalSummary = calculateRoundScore(
        updatedScores,
        round.courseData.holes,
        player.handicap
      );

      // Update scorecard in round
      const updatedRounds = tournament.rounds.map(r => {
        if (r.id === roundId) {
          return {
            ...r,
            scorecards: r.scorecards.map(sc => {
              if (sc.id === scorecardId) {
                return {
                  ...sc,
                  holes: updatedScores,
                  totalGross: finalSummary.totalGross,
                  totalNet: finalSummary.totalNet,
                  totalPoints: finalSummary.totalPoints,
                  holesCompleted: finalSummary.holesCompleted,
                  status: finalSummary.holesCompleted > 0 ? 'in_progress' : 'not_started',
                  updatedAt: new Date().toISOString()
                };
              }
              return sc;
            })
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

      await updateDoc(doc(db, 'tournaments', tournamentId), tournamentUpdate);

      // Refresh the tournament data
      const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));
      setTournament({ id: tournamentDoc.id, ...tournamentDoc.data() });
      const updatedRound = updatedRounds.find(r => r.id === roundId);
      setRound(updatedRound);
      const updatedScorecard = updatedRound.scorecards.find(s => s.id === scorecardId);
      setScorecard(updatedScorecard);
    } catch (error) {
      console.error('Error auto-saving score:', error);
    }
  };

  const { isSaving, save: triggerAutoSave } = useAutoSave(autoSaveScore, 1000);

  useEffect(() => {
    loadScoringData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, roundId, scorecardId]);

  useEffect(() => {
    if (scorecard && round?.courseData?.holes && player) {
      calculateRoundSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, scorecard, round, player]);

  const loadScoringData = async () => {
    try {
      // Load tournament
      const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));
      const tournamentData = { id: tournamentDoc.id, ...tournamentDoc.data() };
      setTournament(tournamentData);

      // Find round
      const roundData = tournamentData.rounds.find(r => r.id === roundId);
      setRound(roundData);

      // Find scorecard
      const scorecardData = roundData.scorecards.find(s => s.id === scorecardId);
      setScorecard(scorecardData);

      // Load all players for leaderboard
      const playerPromises = roundData.scorecards.map(sc =>
        getDoc(doc(db, 'players', sc.playerId))
      );
      const playerDocs = await Promise.all(playerPromises);
      const playersData = playerDocs.map(d => ({ id: d.id, ...d.data() }));
      setAllPlayers(playersData);

      // Load current player
      const playerDoc = await getDoc(doc(db, 'players', scorecardData.playerId));
      setPlayer({ id: playerDoc.id, ...playerDoc.data() });

      // Initialize scores array
      const initialScores = scorecardData.holes || Array.from({ length: 18 }, (_, i) => ({
        holeNumber: i + 1,
        grossScore: null
      }));
      setScores(initialScores);

      // Find first incomplete hole
      const firstIncomplete = initialScores.findIndex(h => !h.grossScore);
      setCurrentHole(firstIncomplete >= 0 ? firstIncomplete : 0);

      setLoading(false);
    } catch (error) {
      console.error('Error loading scoring data:', error);
      alert('Failed to load scoring data');
      setLoading(false);
    }
  };

  const calculateRoundSummary = () => {
    const summary = calculateRoundScore(
      scores,
      round.courseData.holes,
      player.handicap
    );
    setRoundSummary(summary);
  };

  const handleScoreChange = (holeIndex, grossScore) => {
    const newScores = [...scores];
    newScores[holeIndex] = {
      holeNumber: holeIndex + 1,
      grossScore: grossScore === '' ? null : parseInt(grossScore)
    };
    setScores(newScores);

    if (grossScore !== '') {
      triggerAutoSave(newScores);
    }
  };

  const incrementScore = () => {
    const currentScore = scores[currentHole].grossScore;
    const newScore = increment(currentScore);
    handleScoreChange(currentHole, newScore);
  };

  const decrementScore = () => {
    const currentScore = scores[currentHole].grossScore;
    const newScore = decrement(currentScore);
    handleScoreChange(currentHole, newScore);
  };

  const getHoleScore = (holeIndex) => {
    const score = scores[holeIndex];
    const courseHole = round.courseData.holes[holeIndex];

    if (!score.grossScore) {
      return null;
    }

    return calculateHoleScore({
      grossScore: score.grossScore,
      holePar: courseHole.par,
      holeStrokeIndex: courseHole.strokeIndex,
      playerHandicap: player.handicap
    });
  };

  const nextHole = () => {
    if (currentHole < 17) {
      setCurrentHole(currentHole + 1);
    }
  };

  const previousHole = () => {
    if (currentHole > 0) {
      setCurrentHole(currentHole - 1);
    }
  };

  // Swipe gesture handlers for hole navigation
  const swipeHandlers = useSwipeGestures(nextHole, previousHole);

  if (loading) {
    return (
      <div className="stableford-scoring loading">
        <div className="spinner"></div>
        <p>Loading scorecard...</p>
      </div>
    );
  }

  const currentScore = getHoleScore(currentHole);

  // Transform scores to include stablefordPoints for ScoreCard component
  const enrichedScores = scores.map((score, idx) => {
    const holeScore = getHoleScore(idx);
    return {
      ...score,
      stablefordPoints: holeScore ? holeScore.points : null
    };
  });

  return (
    <div className="stableford-scoring" {...swipeHandlers}>
      {/* Header */}
      <div className="scoring-header">
        <button onClick={() => navigate(`/tournaments/${tournamentId}`)} className="back-button">
          <ArrowLeftIcon className="icon" />
        </button>
        <div className="header-info">
          <h1>{player.name}</h1>
          <p className="tournament-name">{tournament.name} - {round.name}</p>
          <div className="player-handicap">HCP {player.handicap}</div>
        </div>
        <AutoSaveIndicator isSaving={isSaving} />
      </div>

      {/* FIRST: Current Hole Scoring */}
      <div className="hole-scoring">
        <HoleInfo
          holeNumber={currentHole + 1}
          par={courseHole.par}
          strokeIndex={courseHole.strokeIndex}
          yardage={courseHole.yardage}
          currentScore={currentScore}
        />

        {/* Score Input - Using shared ScoreEntry component */}
        <ScoreEntry
          value={scores[currentHole].grossScore || ''}
          onChange={(value) => handleScoreChange(currentHole, value)}
          onIncrement={incrementScore}
          onDecrement={decrementScore}
          label="Gross Score"
          min={1}
          max={15}
          className="stableford-score-entry"
        />

        <ScorePreview
          grossScore={scores[currentHole].grossScore ? parseInt(scores[currentHole].grossScore) : null}
          netScore={currentScore?.netScore}
          points={currentScore?.points}
          par={courseHole.par}
          format="stableford"
          strokesReceived={currentScore?.strokesReceived}
        />

        {/* Navigation Buttons */}
        <div className="hole-navigation-buttons">
          <button
            onClick={previousHole}
            disabled={currentHole === 0}
            className="nav-btn secondary"
          >
            ← Prev
          </button>
          <button
            onClick={nextHole}
            disabled={currentHole === 17}
            className="nav-btn secondary"
          >
            Next →
          </button>
        </div>
      </div>

      {/* SECOND: Score Summary */}
      {roundSummary && (
        <div className="score-summary">
          <div className="summary-card">
            <div className="summary-label">Points</div>
            <div className="summary-value points">{roundSummary.totalPoints}</div>
            <div className="summary-subtitle">
              {roundSummary.pointsVsTarget > 0 ? '+' : ''}{roundSummary.pointsVsTarget} vs target
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Gross</div>
            <div className="summary-value">{roundSummary.totalGross || '-'}</div>
            <div className="summary-subtitle">{roundSummary.holesCompleted}/18 holes</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Net</div>
            <div className="summary-value">{roundSummary.totalNet || '-'}</div>
            <div className="summary-subtitle">
              {roundSummary.totalNet ? formatScoreToPar(roundSummary.totalNet - round.courseData.totalPar) : '-'}
            </div>
          </div>
        </div>
      )}

      {/* THIRD: Scorecard with traditional golf symbols */}
      <div className="card scorecard-table-card">
        <ScoreCard
          holes={round.courseData?.holes || []}
          scoringData={[{
            label: player.name,
            scores: enrichedScores
          }]}
          format="stableford"
          currentHole={currentHole + 1}
        />
      </div>

      {/* Submit Scorecard Button - appears when all 18 holes are scored */}
      {roundSummary && roundSummary.holesCompleted === 18 && scorecard?.status !== 'completed' && (
        <div className="submit-scorecard-section">
          <button
            className="button primary large submit-scorecard-button"
            onClick={async () => {
              if (window.confirm('Complete and submit your scorecard? You won\'t be able to make changes after submission.')) {
                // Update scorecard status to completed
                const updatedRounds = tournament.rounds.map(r => {
                  if (r.id === roundId) {
                    return {
                      ...r,
                      scorecards: r.scorecards.map(sc => {
                        if (sc.id === scorecardId) {
                          return {
                            ...sc,
                            status: 'completed',
                            completedAt: new Date().toISOString()
                          };
                        }
                        return sc;
                      })
                    };
                  }
                  return r;
                });

                // Check if all scorecards are now completed
                const updatedRound = updatedRounds.find(r => r.id === roundId);
                const allCompleted = updatedRound.scorecards.every(sc => sc.status === 'completed');

                // If all scorecards are completed, mark the round as complete
                if (allCompleted) {
                  updatedRounds.forEach((r, idx) => {
                    if (r.id === roundId) {
                      updatedRounds[idx] = {
                        ...r,
                        status: 'completed',
                        completedAt: new Date().toISOString()
                      };
                    }
                  });
                }

                await updateDoc(doc(db, 'tournaments', tournamentId), {
                  rounds: updatedRounds
                });
                navigate(`/tournaments/${tournamentId}`);
              }
            }}
          >
            ✓ Complete & Submit Scorecard
          </button>
          <p className="submit-note">All 18 holes have been scored. Review your scorecard above before submitting.</p>
        </div>
      )}

      {/* FOURTH: Leaderboard Summary */}
      <LeaderboardSummary
        scorecards={round?.scorecards || []}
        players={allPlayers}
        currentScorecardId={scorecardId}
        format="stableford"
      />

      {/* Floating Media Button */}
      <MediaButton
        tournamentId={tournamentId}
        roundId={roundId}
        holeNumber={currentHole + 1}
        playerId={player?.id}
        category="action"
      />
    </div>
  );
}

export default StablefordScoring;
