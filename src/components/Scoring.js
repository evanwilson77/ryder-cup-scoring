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
import { subscribeToTournament, updateTournament } from '../firebase/tournamentServices';
import {
  calculateNetScore,
  determineHoleWinner,
  calculateMatchStatus,
  getMatchResult,
  getProvisionalResult,
  calculateTournamentPoints
} from '../utils/scoring';
import HoleInfo from './shared/HoleInfo';
import ScoreCard from './shared/ScoreCard';
import ScoreEntry from './shared/ScoreEntry';
import ScoringHeader from './shared/ScoringHeader';
import './Scoring.css';

function Scoring() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [round, setRound] = useState(null);
  const [holes, setHoles] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [currentHole, setCurrentHole] = useState(1);
  const [scores, setScores] = useState({});

  useEffect(() => {
    let unsubTournament = null;

    const unsubMatch = subscribeToMatch(matchId, (matchData) => {
      setMatch(matchData);
      setCurrentHole(matchData.currentHole || 1);

      // If match has tournamentId and roundId, load tournament/round data
      if (matchData.tournamentId) {
        // Subscribe to tournament to get round data
        unsubTournament = subscribeToTournament(matchData.tournamentId, (tournamentData) => {
          setTournament(tournamentData);

          // Find the round this match belongs to
          if (matchData.roundId && tournamentData.rounds) {
            const matchRound = tournamentData.rounds.find(r => r.id === matchData.roundId);
            if (matchRound) {
              setRound(matchRound);
              // Extract holes from round's courseData
              if (matchRound.courseData && matchRound.courseData.holes) {
                setHoles(matchRound.courseData.holes);
              } else if (matchRound.courseHoles) {
                // Alternative structure
                setHoles(matchRound.courseHoles);
              }
            }
          }
        });
      }
    });

    // Fallback to legacy holes collection
    const unsubHoles = subscribeToHoles((holesData) => {
      // Use legacy holes if we don't have holes yet
      setHoles(prevHoles => prevHoles.length === 0 ? holesData : prevHoles);
    });

    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubTeams = subscribeToTeams(setTeams);
    const unsubMatches = subscribeToMatches(setMatches);

    return () => {
      unsubMatch();
      if (unsubTournament) unsubTournament();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHole]);

  if (!match) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (holes.length === 0) {
    return (
      <div className="scoring">
        <div className="card">
          <h2>Course Not Configured</h2>
          <p>This match doesn't have course holes configured. Please configure the round's course before starting scoring.</p>
          <button className="button" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // Detect tournament type
  const isIndividualTournament = !tournament?.hasTeams;
  const isSinglesFormat = match.format === 'singles';
  const isPartnershipFormat = match.format === 'fourball' || match.format === 'foursomes';

  // Get teams (for team tournaments) or use defaults (for individual tournaments)
  const team1 = isIndividualTournament
    ? { name: 'Side 1', color: '#e53e3e' }
    : (teams.find(t => t.id === 'team1') || { name: 'Team 1', color: '#e53e3e' });
  const team2 = isIndividualTournament
    ? { name: 'Side 2', color: '#3182ce' }
    : (teams.find(t => t.id === 'team2') || { name: 'Team 2', color: '#3182ce' });

  const currentHoleData = holes.find(h => h.number === currentHole);

  const getPlayer = (playerId) => players.find(p => p.id === playerId);

  // Helper functions to get players based on tournament type and format
  const getSide1Players = () => {
    if (isIndividualTournament) {
      if (isSinglesFormat) {
        return [match.player1];
      } else if (isPartnershipFormat) {
        return match.partnership1 || [];
      }
    }
    return match.team1Players || [];
  };

  const getSide2Players = () => {
    if (isIndividualTournament) {
      if (isSinglesFormat) {
        return [match.player2];
      } else if (isPartnershipFormat) {
        return match.partnership2 || [];
      }
    }
    return match.team2Players || [];
  };

  const side1Players = getSide1Players();
  const side2Players = getSide2Players();

  const handleScoreChange = (field, value) => {
    setScores({
      ...scores,
      [field]: value ? parseInt(value) : null
    });
  };

  const incrementScore = (field) => {
    setScores({
      ...scores,
      [field]: scores[field] ? scores[field] + 1 : currentHoleData.par
    });
  };

  const decrementScore = (field) => {
    setScores({
      ...scores,
      [field]: scores[field] ? Math.max(1, scores[field] - 1) : currentHoleData.par
    });
  };

  // Calculate dynamic hole result as scores are entered
  const getDynamicHoleResult = () => {
    if (!currentHoleData || !scores) return null;

    try {
      if (match.format === 'singles') {
        const player1 = getPlayer(side1Players[0]);
        const player2 = getPlayer(side2Players[0]);

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
          (getPlayer(side1Players[0])?.handicap || 0) +
          (getPlayer(side1Players[1])?.handicap || 0)
        ) / 2;
        const avgHandicap2 = (
          (getPlayer(side2Players[0])?.handicap || 0) +
          (getPlayer(side2Players[1])?.handicap || 0)
        ) / 2;

        const team1Net = calculateNetScore(scores.team1Score, avgHandicap1, currentHoleData.strokeIndex);
        const team2Net = calculateNetScore(scores.team2Score, avgHandicap2, currentHoleData.strokeIndex);

        return determineHoleWinner(match.format, { team1Score: team1Net, team2Score: team2Net }, currentHoleData);
      } else if (match.format === 'fourball') {
        if (!scores.team1Player1 || !scores.team1Player2 || !scores.team2Player1 || !scores.team2Player2) return null;

        const player1a = getPlayer(side1Players[0]);
        const player1b = getPlayer(side1Players[1]);
        const player2a = getPlayer(side2Players[0]);
        const player2b = getPlayer(side2Players[1]);

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
      const player1 = getPlayer(side1Players[0]);
      const player2 = getPlayer(side2Players[0]);

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
        (getPlayer(side1Players[0])?.handicap || 0) +
        (getPlayer(side1Players[1])?.handicap || 0)
      ) / 2;
      const avgHandicap2 = (
        (getPlayer(side2Players[0])?.handicap || 0) +
        (getPlayer(side2Players[1])?.handicap || 0)
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
      const player1a = getPlayer(side1Players[0]);
      const player1b = getPlayer(side1Players[1]);
      const player2a = getPlayer(side2Players[0]);
      const player2b = getPlayer(side2Players[1]);

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
        currentHole: 18,
        status: 'in_progress'
      });

      // Update match data in the tournament's rounds array
      if (tournament && round) {
        const roundIndex = tournament.rounds.findIndex(r => r.id === round.id);
        if (roundIndex !== -1) {
          const updatedRounds = [...tournament.rounds];
          const currentRound = updatedRounds[roundIndex];

          if (currentRound.matches && currentRound.matches.length > 0) {
            updatedRounds[roundIndex].matches = currentRound.matches.map(m =>
              m.id === matchId ? {
                ...m,
                currentHole: 18,
                status: 'in_progress'
              } : m
            );

            // CRITICAL: Update round status based on all matches
            const roundMatches = updatedRounds[roundIndex].matches;
            const allNotStarted = roundMatches.every(m => m.status === 'not_started' || m.status === 'setup');
            const allCompleted = roundMatches.every(m => m.status === 'completed');

            if (allCompleted) {
              updatedRounds[roundIndex].status = 'completed';
            } else if (allNotStarted) {
              updatedRounds[roundIndex].status = 'not_started';
            } else {
              updatedRounds[roundIndex].status = 'in_progress';
            }

            // CRITICAL: Update tournament status based on all rounds
            const allRoundsNotStarted = updatedRounds.filter(r => !r.deleted).every(r =>
              r.status === 'not_started' || r.status === 'setup'
            );
            const allRoundsCompleted = updatedRounds.filter(r => !r.deleted).every(r =>
              r.status === 'completed'
            );

            let tournamentStatus;
            if (allRoundsCompleted) {
              tournamentStatus = 'completed';
            } else if (allRoundsNotStarted) {
              tournamentStatus = 'setup';
            } else {
              tournamentStatus = 'in_progress';
            }

            await updateTournament(tournament.id, {
              rounds: updatedRounds,
              status: tournamentStatus,
              updatedAt: new Date().toISOString()
            });
          }
        }
      } else if (tournament && tournament.status === 'setup') {
        await updateTournament(tournament.id, { status: 'in_progress' });
      }

      // Stay on hole 18, user will confirm to complete
      return;
    }

    // Check if match is complete (won early)
    const matchStatus = calculateMatchStatus(updatedHoleScores, currentHole, team1?.name, team2?.name);
    const result = getMatchResult(updatedHoleScores);

    // If we're editing a past hole, just save it without advancing
    // Only advance currentHole in the database if we're on the actual current hole
    const isOnCurrentHole = currentHole === match.currentHole;

    // Always advance to next hole, even if match is decided
    // This allows players to complete their scorecard for practice/handicap purposes
    const nextHole = isOnCurrentHole ? Math.min(currentHole + 1, 18) : match.currentHole;

    // Lock the result once it's determined - don't update if we already have a locked result
    const lockedResult = match.resultLocked ? match.result : result;
    const resultLocked = match.resultLocked || matchStatus.isComplete;

    await updateMatch(matchId, {
      holeScores: updatedHoleScores,
      currentHole: nextHole,
      status: 'in_progress', // Never auto-complete, always require user confirmation
      result: lockedResult,
      resultLocked: resultLocked // New flag to indicate result is locked
    });

    // Update match data in the tournament's rounds array
    if (tournament && round) {
      const roundIndex = tournament.rounds.findIndex(r => r.id === round.id);
      if (roundIndex !== -1) {
        const updatedRounds = [...tournament.rounds];
        const currentRound = updatedRounds[roundIndex];

        if (currentRound.matches && currentRound.matches.length > 0) {
          updatedRounds[roundIndex].matches = currentRound.matches.map(m =>
            m.id === matchId ? {
              ...m,
              currentHole: nextHole,
              status: 'in_progress',
              result: lockedResult,
              resultLocked: resultLocked
            } : m
          );

          // CRITICAL: Update round status based on all matches
          const roundMatches = updatedRounds[roundIndex].matches;
          const allNotStarted = roundMatches.every(m => m.status === 'not_started' || m.status === 'setup');
          const allCompleted = roundMatches.every(m => m.status === 'completed');

          if (allCompleted) {
            updatedRounds[roundIndex].status = 'completed';
          } else if (allNotStarted) {
            updatedRounds[roundIndex].status = 'not_started';
          } else {
            updatedRounds[roundIndex].status = 'in_progress';
          }

          // CRITICAL: Update tournament status based on all rounds
          const allRoundsNotStarted = updatedRounds.filter(r => !r.deleted).every(r =>
            r.status === 'not_started' || r.status === 'setup'
          );
          const allRoundsCompleted = updatedRounds.filter(r => !r.deleted).every(r =>
            r.status === 'completed'
          );

          let tournamentStatus;
          if (allRoundsCompleted) {
            tournamentStatus = 'completed';
          } else if (allRoundsNotStarted) {
            tournamentStatus = 'setup';
          } else {
            tournamentStatus = 'in_progress';
          }

          await updateTournament(tournament.id, {
            rounds: updatedRounds,
            status: tournamentStatus,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } else if (tournament && tournament.status === 'setup') {
      // If no round data, just update tournament status
      await updateTournament(tournament.id, { status: 'in_progress' });
    }

    // Always move to next hole (unless on hole 18)
    // This allows players to complete their scorecard even after match is decided
    if (isOnCurrentHole && currentHole < 18) {
      setCurrentHole(currentHole + 1);
    } else if (!isOnCurrentHole) {
      // If editing a past hole, return to the current hole
      setCurrentHole(match.currentHole);
    }
  };

  const confirmMatchComplete = async () => {
    // Use the locked result if available, otherwise calculate from scored holes
    const result = match.resultLocked ? match.result : getMatchResult(match.holeScores);

    await updateMatch(matchId, {
      currentHole: 18,
      status: 'completed',
      result: result,
      resultLocked: match.resultLocked
    });

    // Update match data in the tournament's rounds array and check if round is complete
    if (tournament && round) {
      const roundIndex = tournament.rounds.findIndex(r => r.id === round.id);
      if (roundIndex !== -1) {
        const updatedRounds = [...tournament.rounds];
        const currentRound = updatedRounds[roundIndex];

        // Update the match data in the rounds array
        if (currentRound.matches && currentRound.matches.length > 0) {
          updatedRounds[roundIndex].matches = currentRound.matches.map(m =>
            m.id === matchId ? {
              ...m,
              currentHole: 18,
              status: 'completed',
              result: result,
              resultLocked: match.resultLocked
            } : m
          );

          // Check if all matches are completed
          const allMatchesCompleted = updatedRounds[roundIndex].matches.every(m =>
            m.status === 'completed'
          );

          if (allMatchesCompleted) {
            updatedRounds[roundIndex] = {
              ...updatedRounds[roundIndex],
              status: 'completed',
              completedAt: new Date().toISOString()
            };
          }

          // CRITICAL: Update tournament status based on all rounds
          const allRoundsNotStarted = updatedRounds.filter(r => !r.deleted).every(r =>
            r.status === 'not_started' || r.status === 'setup'
          );
          const allRoundsCompleted = updatedRounds.filter(r => !r.deleted).every(r =>
            r.status === 'completed'
          );

          let tournamentStatus;
          if (allRoundsCompleted) {
            tournamentStatus = 'completed';
          } else if (allRoundsNotStarted) {
            tournamentStatus = 'setup';
          } else {
            tournamentStatus = 'in_progress';
          }

          await updateTournament(tournament.id, {
            rounds: updatedRounds,
            status: tournamentStatus,
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    alert(`Match completed! ${result}`);
    if (tournament && tournament.id) {
      navigate(`/tournaments/${tournament.id}`);
    } else {
      navigate('/');
    }
  };

  const goToPreviousHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
      // Scores will be loaded by useEffect
    }
  };

  // Calculate match status based on all scored holes (not currentHole - 1)
  // Count how many holes have actually been scored (have a winner)
  const holesActuallyScored = match.holeScores.filter(h => h?.winner !== undefined).length;
  const matchStatus = calculateMatchStatus(match.holeScores, holesActuallyScored, team1?.name, team2?.name);

  /*
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
      const team1Player = getPlayer(side1Players[0]);
      const team2Player = getPlayer(side2Players[0]);

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
          player: `${getPlayer(side1Players[0])?.name} & ${getPlayer(side1Players[1])?.name}`,
          gross: holeScore.team1Gross,
          net: holeScore.team1Score,
          stableford: calculateStableford(holeScore.team1Score, hole.par)
        },
        {
          team: team2?.name,
          player: `${getPlayer(side2Players[0])?.name} & ${getPlayer(side2Players[1])?.name}`,
          gross: holeScore.team2Gross,
          net: holeScore.team2Score,
          stableford: calculateStableford(holeScore.team2Score, hole.par)
        }
      ];
    } else if (match.format === 'fourball') {
      const team1Player1 = getPlayer(side1Players[0]);
      const team1Player2 = getPlayer(side1Players[1]);
      const team2Player1 = getPlayer(side2Players[0]);
      const team2Player2 = getPlayer(side2Players[1]);

      // Show all 4 players individually in fourball
      details.scores = [
        {
          team: team1?.name,
          player: team1Player1?.name,
          gross: holeScore.team1Player1Gross,
          net: holeScore.team1Player1,
          stableford: calculateStableford(holeScore.team1Player1, hole.par)
        },
        {
          team: team1?.name,
          player: team1Player2?.name,
          gross: holeScore.team1Player2Gross,
          net: holeScore.team1Player2,
          stableford: calculateStableford(holeScore.team1Player2, hole.par)
        },
        {
          team: team2?.name,
          player: team2Player1?.name,
          gross: holeScore.team2Player1Gross,
          net: holeScore.team2Player1,
          stableford: calculateStableford(holeScore.team2Player1, hole.par)
        },
        {
          team: team2?.name,
          player: team2Player2?.name,
          gross: holeScore.team2Player2Gross,
          net: holeScore.team2Player2,
          stableford: calculateStableford(holeScore.team2Player2, hole.par)
        }
      ];
    }

    return details;
  };*/

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
      <ScoringHeader
        match={match}
        tournament={tournament}
        matchStatus={matchStatus}
        team1={team1}
        team2={team2}
        team1Points={team1Points}
        team2Points={team2Points}
        team1Projected={team1Projected}
        team2Projected={team2Projected}
        isIndividualTournament={isIndividualTournament}
        onBack={() => {
          if (tournament && tournament.id) {
            navigate(`/tournaments/${tournament.id}`);
          } else {
            navigate('/matches');
          }
        }}
      />

      <div className="scoring-grid">
        <div className="card hole-info">
          <HoleInfo
            holeNumber={currentHole}
            par={currentHoleData?.par}
            strokeIndex={currentHoleData?.strokeIndex}
            compact={true}
          />
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
              <ScoreEntry
                value={scores.team1Player1 || ''}
                onChange={(value) => handleScoreChange('team1Player1', value)}
                onIncrement={() => incrementScore('team1Player1')}
                onDecrement={() => decrementScore('team1Player1')}
                label={`${getPlayer(side1Players[0])?.name} (HCP: ${getPlayer(side1Players[0])?.handicap})`}
                min={1}
                max={15}
              />
            </div>

            <div className="team-score-section" style={{ borderTopColor: team2?.color }}>
              <h4 style={{ color: team2?.color }}>{team2?.name}</h4>
              <ScoreEntry
                value={scores.team2Player1 || ''}
                onChange={(value) => handleScoreChange('team2Player1', value)}
                onIncrement={() => incrementScore('team2Player1')}
                onDecrement={() => decrementScore('team2Player1')}
                label={`${getPlayer(side2Players[0])?.name} (HCP: ${getPlayer(side2Players[0])?.handicap})`}
                min={1}
                max={15}
              />
            </div>
          </div>
        )}

        {match.format === 'foursomes' && (
          <div className="foursomes-scoring">
            <div className="team-score-section" style={{ borderTopColor: team1?.color }}>
              <h4 style={{ color: team1?.color }}>{team1?.name}</h4>
              <p className="team-players">
                {getPlayer(side1Players[0])?.name} & {getPlayer(side1Players[1])?.name}
              </p>
              <ScoreEntry
                value={scores.team1Score || ''}
                onChange={(value) => handleScoreChange('team1Score', value)}
                onIncrement={() => incrementScore('team1Score')}
                onDecrement={() => decrementScore('team1Score')}
                label="Team Score"
                min={1}
                max={15}
              />
            </div>

            <div className="team-score-section" style={{ borderTopColor: team2?.color }}>
              <h4 style={{ color: team2?.color }}>{team2?.name}</h4>
              <p className="team-players">
                {getPlayer(side2Players[0])?.name} & {getPlayer(side2Players[1])?.name}
              </p>
              <ScoreEntry
                value={scores.team2Score || ''}
                onChange={(value) => handleScoreChange('team2Score', value)}
                onIncrement={() => incrementScore('team2Score')}
                onDecrement={() => decrementScore('team2Score')}
                label="Team Score"
                min={1}
                max={15}
              />
            </div>
          </div>
        )}

        {match.format === 'fourball' && (
          <div className="fourball-scoring">
            <div className="team-score-section" style={{ borderTopColor: team1?.color }}>
              <h4 style={{ color: team1?.color }}>{team1?.name}</h4>
              <ScoreEntry
                value={scores.team1Player1 || ''}
                onChange={(value) => handleScoreChange('team1Player1', value)}
                onIncrement={() => incrementScore('team1Player1')}
                onDecrement={() => decrementScore('team1Player1')}
                label={`${getPlayer(side1Players[0])?.name} (HCP: ${getPlayer(side1Players[0])?.handicap})`}
                min={1}
                max={15}
              />
              <ScoreEntry
                value={scores.team1Player2 || ''}
                onChange={(value) => handleScoreChange('team1Player2', value)}
                onIncrement={() => incrementScore('team1Player2')}
                onDecrement={() => decrementScore('team1Player2')}
                label={`${getPlayer(side1Players[1])?.name} (HCP: ${getPlayer(side1Players[1])?.handicap})`}
                min={1}
                max={15}
              />
            </div>

            <div className="team-score-section" style={{ borderTopColor: team2?.color }}>
              <h4 style={{ color: team2?.color }}>{team2?.name}</h4>
              <ScoreEntry
                value={scores.team2Player1 || ''}
                onChange={(value) => handleScoreChange('team2Player1', value)}
                onIncrement={() => incrementScore('team2Player1')}
                onDecrement={() => decrementScore('team2Player1')}
                label={`${getPlayer(side2Players[0])?.name} (HCP: ${getPlayer(side2Players[0])?.handicap})`}
                min={1}
                max={15}
              />
              <ScoreEntry
                value={scores.team2Player2 || ''}
                onChange={(value) => handleScoreChange('team2Player2', value)}
                onIncrement={() => incrementScore('team2Player2')}
                onDecrement={() => decrementScore('team2Player2')}
                label={`${getPlayer(side2Players[1])?.name} (HCP: ${getPlayer(side2Players[1])?.handicap})`}
                min={1}
                max={15}
              />
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
                  : 'Next Hole →'}
            </button>
          )}
        </div>

        {/* Match Result Locked Notice */}
        {match.resultLocked && match.status !== 'completed' && (
          <div className="match-decided-notice info">
            <div className="notice-icon">🔒</div>
            <div className="notice-content">
              <h4>Match Result Locked</h4>
              <p><strong>{match.result}</strong></p>
              <p className="notice-subtext">
                The match result is locked and will not change. You can continue scoring the remaining holes to complete your scorecard.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Match Scorecard */}
      <div className="card">
        <ScoreCard
          holes={holes}
          scoringData={
            match.format === 'fourball' ? [
              {
                label: `${getPlayer(side1Players[0])?.name || 'P1'} (${team1?.name})`,
                scores: match.holeScores.map(holeScore => ({
                  grossScore: holeScore.team1Player1Gross,
                  netScore: holeScore.team1Player1
                }))
              },
              {
                label: `${getPlayer(side1Players[1])?.name || 'P2'} (${team1?.name})`,
                scores: match.holeScores.map(holeScore => ({
                  grossScore: holeScore.team1Player2Gross,
                  netScore: holeScore.team1Player2
                }))
              },
              {
                label: `${getPlayer(side2Players[0])?.name || 'P1'} (${team2?.name})`,
                scores: match.holeScores.map(holeScore => ({
                  grossScore: holeScore.team2Player1Gross,
                  netScore: holeScore.team2Player1
                }))
              },
              {
                label: `${getPlayer(side2Players[1])?.name || 'P2'} (${team2?.name})`,
                scores: match.holeScores.map(holeScore => ({
                  grossScore: holeScore.team2Player2Gross,
                  netScore: holeScore.team2Player2
                }))
              }
            ] : [
              {
                label: match.format === 'foursomes'
                  ? `${getPlayer(side1Players[0])?.name || 'P1'} & ${getPlayer(side1Players[1])?.name || 'P2'}`
                  : getPlayer(side1Players[0])?.name || team1?.name || 'Side 1',
                scores: match.holeScores.map((holeScore, idx) => ({
                  grossScore: holeScore.team1Gross,
                  netScore: match.format === 'singles'
                    ? holeScore.team1Player1
                    : holeScore.team1Score
                }))
              },
              {
                label: match.format === 'foursomes'
                  ? `${getPlayer(side2Players[0])?.name || 'P1'} & ${getPlayer(side2Players[1])?.name || 'P2'}`
                  : getPlayer(side2Players[0])?.name || team2?.name || 'Side 2',
                scores: match.holeScores.map((holeScore, idx) => ({
                  grossScore: holeScore.team2Gross,
                  netScore: match.format === 'singles'
                    ? holeScore.team2Player1
                    : holeScore.team2Score
                }))
              }
            ]
          }
          format="match_play"
          currentHole={currentHole}
        />
      </div>
    </div>
  );
}

export default Scoring;
