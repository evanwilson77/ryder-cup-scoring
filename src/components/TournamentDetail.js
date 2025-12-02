import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  subscribeToTournament,
  updateTournament,
  deleteTournament,
  getTournamentSeriesById
} from '../firebase/tournamentServices';
import { subscribeToPlayers, addMatch, updateMatch } from '../firebase/services';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckCircleIcon,
  CalendarIcon,
  UserGroupIcon,
  TrophyIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import RoundCourseConfig from './RoundCourseConfig';
import RoundMatchSetup from './RoundMatchSetup';
import RoundScorecardSetup from './RoundScorecardSetup';
import RoundTeamScorecardSetup from './RoundTeamScorecardSetup';
import MediaGallery from './media/MediaGallery';
import PlayoffManager from './PlayoffManager';
import './TournamentDetail.css';

function TournamentDetail() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, currentPlayer } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [series, setSeries] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(null);
  const [showCourseConfig, setShowCourseConfig] = useState(false);
  const [configuringRound, setConfiguringRound] = useState(null);
  const [showMatchSetup, setShowMatchSetup] = useState(false);
  const [showScorecardSetup, setShowScorecardSetup] = useState(false);
  const [showTeamScorecardSetup, setShowTeamScorecardSetup] = useState(false);
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  const [showPlayoffManager, setShowPlayoffManager] = useState(false);
  const [playoffData, setPlayoffData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    notes: '',
    players: []
  });
  const [holeConfigExpanded, setHoleConfigExpanded] = useState(false);

  useEffect(() => {
    const unsubTournament = subscribeToTournament(tournamentId, async (tournamentData) => {
      setTournament(tournamentData);

      // Load series info if tournament has a series
      if (tournamentData.seriesId) {
        const seriesData = await getTournamentSeriesById(tournamentData.seriesId);
        setSeries(seriesData);
      }

      // Select first incomplete round by default (or last round if all complete)
      if (tournamentData.rounds && tournamentData.rounds.length > 0 && !selectedRound) {
        const firstIncompleteRound = tournamentData.rounds.find(r => r.status !== 'completed');
        setSelectedRound(firstIncompleteRound || tournamentData.rounds[tournamentData.rounds.length - 1]);
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
  }, [tournamentId, selectedRound]);

  // Sync selectedRound with tournament data updates
  useEffect(() => {
    if (tournament && selectedRound) {
      const updatedRound = tournament.rounds.find(r => r.id === selectedRound.id);
      if (updatedRound && JSON.stringify(updatedRound) !== JSON.stringify(selectedRound)) {
        setSelectedRound(updatedRound);
      }
    }
  }, [tournament, selectedRound]);

  const getPlayer = (playerId) => players.find(p => p.id === playerId);

  const isTeamFormat = () => {
    return tournament.hasTeams === true;
  };

  // Helper to check if a specific round format is stableford
  const isStablefordRound = (round) => {
    return round && round.format && (round.format === 'individual_stableford' || round.format === 'team_stableford');
  };

  // Helper to check if round is a team format (requires team scorecards)
  const isTeamScorecardFormat = (round) => {
    return round && round.format && ['scramble', 'shamble', 'best_ball', 'team_stableford'].includes(round.format);
  };

  // Get ALL scorecards for current player across all rounds
  const getMyAllScorecards = () => {
    if (!currentPlayer || !tournament || !tournament.rounds) return [];

    const scorecards = [];

    // Find player's team (if any)
    const myTeam = tournament.teams?.find(
      team => team.players?.includes(currentPlayer.id)
    );

    tournament.rounds.forEach(round => {
      let scorecard = null;
      let type = null;

      // Check for individual scorecard
      const individualScorecard = round.scorecards?.find(
        sc => sc.playerId === currentPlayer.id
      );

      if (individualScorecard) {
        scorecard = individualScorecard;
        type = 'individual';
      }

      // Check for team scorecard
      if (!scorecard && myTeam) {
        const teamScorecard = round.teamScorecards?.find(
          sc => sc.teamId === myTeam.id
        );

        if (teamScorecard) {
          scorecard = teamScorecard;
          type = 'team';
        }
      }

      // Check for match
      if (!scorecard && round.matches) {
        const myMatch = round.matches.find(match => {
          // Singles match
          if (match.player1 === currentPlayer.id || match.player2 === currentPlayer.id) {
            return true;
          }

          // Partnership match
          if (match.partnership1?.includes(currentPlayer.id) ||
              match.partnership2?.includes(currentPlayer.id)) {
            return true;
          }

          // Team match
          if (match.team1Players?.includes(currentPlayer.id) ||
              match.team2Players?.includes(currentPlayer.id)) {
            return true;
          }

          return false;
        });

        if (myMatch) {
          scorecard = myMatch;
          type = 'match';
        }
      }

      if (scorecard) {
        scorecards.push({
          round,
          scorecard,
          type,
          team: type === 'team' ? myTeam : null
        });
      }
    });

    return scorecards;
  };

  // Navigate to appropriate scorecard based on type
  const navigateToScorecard = (scorecardData) => {
    const { round, scorecard, type, team } = scorecardData;

    switch (type) {
      case 'individual':
        if (round.format === 'individual_stableford') {
          navigate(`/tournaments/${tournamentId}/rounds/${round.id}/stableford/${scorecard.id}`);
        } else {
          navigate(`/tournaments/${tournamentId}/rounds/${round.id}/scorecards/${scorecard.id}`);
        }
        break;

      case 'team':
        if (round.format === 'scramble') {
          navigate(`/tournaments/${tournamentId}/rounds/${round.id}/scramble/${team.id}`);
        } else if (round.format === 'shamble') {
          navigate(`/tournaments/${tournamentId}/rounds/${round.id}/shamble/${team.id}`);
        } else if (round.format === 'best_ball') {
          navigate(`/tournaments/${tournamentId}/rounds/${round.id}/bestball/${team.id}`);
        } else if (round.format === 'team_stableford') {
          navigate(`/tournaments/${tournamentId}/rounds/${round.id}/team-stableford/${team.id}`);
        }
        break;

      case 'match':
        navigate(`/scoring/${scorecard.id}`);
        break;

      default:
        break;
    }
  };

  // Helper to count holes completed
  const getHolesCompleted = (scorecard) => {
    if (scorecard.holes) {
      return scorecard.holes.filter(h => h.grossScore !== null).length;
    }
    if (scorecard.currentHole) {
      return scorecard.currentHole - 1;
    }
    return 0;
  };

  const handleSaveTeams = async (updatedTeams) => {
    try {
      await updateTournament(tournamentId, {
        teams: updatedTeams
      });
      setShowTeamEditor(false);
    } catch (error) {
      console.error('Error saving teams:', error);
      alert('Failed to save teams. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      setup: { className: 'status-badge-setup', label: 'Setup' },
      in_progress: { className: 'status-badge-in-progress', label: 'In Progress' },
      completed: { className: 'status-badge-completed', label: 'Completed' }
    };
    return badges[status] || badges.setup;
  };

  const handleCompleteTournament = async () => {
    if (window.confirm('Mark this tournament as completed?')) {
      await updateTournament(tournamentId, { status: 'completed' });
    }
  };

  const handleRoundSelect = (round) => {
    setSelectedRound(round);
  };

  const updateRoundCourse = (round) => {
    console.log('updateRoundCourse called with round:', round);
    setConfiguringRound(round);
    setShowCourseConfig(true);
  };

  const handleSaveCourseConfig = async (configData) => {
    try {
      // Find the round index
      const roundIndex = tournament.rounds.findIndex(r => r.id === configuringRound.id);

      // Update the rounds array with new course data
      const updatedRounds = [...tournament.rounds];
      updatedRounds[roundIndex] = {
        ...updatedRounds[roundIndex],
        savedCourseId: configData.savedCourseId,
        courseName: configData.courseName,
        teeBox: configData.teeBox,
        teeColor: configData.teeColor,
        courseData: configData.courseData,
        ...(configData.matchFormat && { matchFormat: configData.matchFormat }),
        updatedAt: new Date().toISOString()
      };

      // Save to database
      await updateTournament(tournamentId, {
        rounds: updatedRounds
      });

      setShowCourseConfig(false);
      setConfiguringRound(null);
    } catch (error) {
      console.error('Error saving course configuration:', error);
      alert('Failed to save course configuration. Please try again.');
    }
  };

  const handleSaveMatchSetup = async (matchData) => {
    try {
      const roundIndex = tournament.rounds.findIndex(r => r.id === configuringRound.id);
      const updatedRounds = [...tournament.rounds];
      updatedRounds[roundIndex] = {
        ...updatedRounds[roundIndex],
        matches: matchData.matches,
        updatedAt: new Date().toISOString()
      };

      // Save to tournament document
      await updateTournament(tournamentId, {
        rounds: updatedRounds
      });

      // Also sync matches to matches collection for compatibility with existing scoring system
      // Matches are stored in both places:
      // 1. Within tournament.rounds[].matches for organizational purposes
      // 2. In matches collection for existing MatchSetup/Scoring components
      for (const match of matchData.matches) {
        const matchWithRefs = {
          ...match,
          tournamentId: tournament.id,
          roundId: configuringRound.id
        };

        if (match.id.startsWith('match-')) {
          // New match, add to collection - Firebase will generate a new ID
          const newMatchId = await addMatch(matchWithRefs);
          // Update the match ID in the round's matches array
          updatedRounds[roundIndex].matches = updatedRounds[roundIndex].matches.map(m =>
            m.id === match.id ? { ...m, id: newMatchId } : m
          );
        } else {
          // Existing match, update it
          await updateMatch(match.id, matchWithRefs);
        }
      }

      // Update tournament again with corrected match IDs if any were generated
      await updateTournament(tournamentId, {
        rounds: updatedRounds
      });

      setShowMatchSetup(false);
      setConfiguringRound(null);
    } catch (error) {
      console.error('Error saving match setup:', error);
      alert('Failed to save match setup. Please try again.');
    }
  };

  const openMatchSetup = (round) => {
    setConfiguringRound(round);
    setShowMatchSetup(true);
  };

  const handleSaveScorecardSetup = async (scorecardData) => {
    try {
      const roundIndex = tournament.rounds.findIndex(r => r.id === configuringRound.id);
      const updatedRounds = [...tournament.rounds];
      updatedRounds[roundIndex] = {
        ...updatedRounds[roundIndex],
        scorecards: scorecardData.scorecards,
        updatedAt: new Date().toISOString()
      };

      await updateTournament(tournamentId, {
        rounds: updatedRounds
      });

      setShowScorecardSetup(false);
      setConfiguringRound(null);
    } catch (error) {
      console.error('Error saving scorecard setup:', error);
      alert('Failed to save scorecard setup. Please try again.');
    }
  };

  const openScorecardSetup = (round) => {
    setConfiguringRound(round);
    setShowScorecardSetup(true);
  };

  const openTeamScorecardSetup = (round) => {
    // Check if teams are configured
    if (!tournament.teams || tournament.teams.length === 0) {
      const shouldSetupTeams = window.confirm(
        'No teams are configured for this tournament. Would you like to set up teams now?\n\n' +
        'Team-based formats like Best Ball, Scramble, and Shamble require teams to be configured.'
      );

      if (shouldSetupTeams) {
        // Update tournament to enable teams if needed
        if (!tournament.hasTeams) {
          updateTournament(tournamentId, { hasTeams: true }).catch(err => {
            console.error('Error enabling teams:', err);
          });
        }
        setShowTeamEditor(true);
      }
      return;
    }

    setConfiguringRound(round);
    setShowTeamScorecardSetup(true);
  };

  const handleSaveTeamScorecardSetup = async (teamScorecardData) => {
    try {
      const roundIndex = tournament.rounds.findIndex(r => r.id === configuringRound.id);
      const updatedRounds = [...tournament.rounds];
      updatedRounds[roundIndex] = {
        ...updatedRounds[roundIndex],
        teamScorecards: teamScorecardData.teamScorecards,
        updatedAt: new Date().toISOString()
      };

      await updateTournament(tournamentId, {
        rounds: updatedRounds
      });

      setShowTeamScorecardSetup(false);
      setConfiguringRound(null);
    } catch (error) {
      console.error('Error saving team scorecard setup:', error);
      alert('Failed to save team scorecard setup. Please try again.');
    }
  };

  const detectPlayoff = () => {
    // Only check for Stableford tournaments - check if any round has stableford format
    const hasStablefordRound = tournament.rounds?.some(round => isStablefordRound(round));
    if (!hasStablefordRound) return null;

    // Calculate final standings
    const playerTournamentPoints = new Map();

    tournament.rounds?.forEach(round => {
      round.scorecards?.forEach(scorecard => {
        if (scorecard.status === 'completed') {
          const current = playerTournamentPoints.get(scorecard.playerId) || 0;
          playerTournamentPoints.set(scorecard.playerId, current + (scorecard.totalPoints || 0));
        }
      });
    });

    // Sort by points
    const sortedResults = Array.from(playerTournamentPoints.entries())
      .map(([playerId, points]) => ({ playerId, points }))
      .sort((a, b) => b.points - a.points);

    if (sortedResults.length < 2) return null;

    // Check if top players are tied
    const topScore = sortedResults[0].points;
    const tiedPlayers = sortedResults.filter(r => r.points === topScore);

    if (tiedPlayers.length > 1) {
      return {
        tiedPlayers,
        topScore
      };
    }

    return null;
  };

  const handleOpenPlayoffManager = () => {
    const playoff = detectPlayoff();
    if (playoff && selectedRound) {
      setPlayoffData({
        tiedPlayers: playoff.tiedPlayers,
        round: selectedRound
      });
      setShowPlayoffManager(true);
    }
  };

  const handlePlayoffComplete = async (winnerId, winnerName, method) => {
    setShowPlayoffManager(false);
    setPlayoffData(null);
    // Tournament data will refresh automatically via subscription
  };

  const handleOpenEditModal = () => {
    setEditFormData({
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      notes: tournament.notes || '',
      players: tournament.players || []
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateTournament(tournamentId, {
        name: editFormData.name,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        notes: editFormData.notes,
        players: editFormData.players
      });
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating tournament:', error);
      alert('Failed to update tournament. Please try again.');
    }
  };

  const handleTogglePlayer = (playerId) => {
    setEditFormData(prev => ({
      ...prev,
      players: prev.players.includes(playerId)
        ? prev.players.filter(id => id !== playerId)
        : [...prev.players, playerId]
    }));
  };

  const handleDeleteTournament = async () => {
    if (!isAdmin) {
      alert('Only administrators can delete tournaments.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${tournament.name}"? This action cannot be undone and will delete all rounds, scorecards, and matches associated with this tournament.`)) {
      try {
        await deleteTournament(tournamentId);
        navigate('/tournaments');
      } catch (error) {
        console.error('Error deleting tournament:', error);
        alert('Failed to delete tournament. Please try again.');
      }
    }
  };

  if (loading || !tournament) {
    return (
      <div className="tournament-detail">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(tournament.status);

  return (
    <div className="tournament-detail">
      <div className="detail-container">
        {/* Header */}
        <div className="card detail-header">
          <button onClick={() => navigate('/tournaments')} className="button secondary small">
            <ArrowLeftIcon className="icon" />
            Back to Tournaments
          </button>

          <div className="tournament-title-section">
            <div className="title-row">
              <h1>{tournament.name}</h1>
              <span className={`status-badge ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>
            {tournament.edition && (
              <div className="tournament-edition">{tournament.edition}</div>
            )}
            {series && (
              <div className="tournament-series">Part of {series.name} Series</div>
            )}

            {/* Inline Info Stats */}
            <div className="header-stats">
              <div className="header-stat">
                <CalendarIcon className="stat-icon" />
                <span>
                  {new Date(tournament.startDate).toLocaleDateString()}
                  {tournament.startDate !== tournament.endDate &&
                    ` - ${new Date(tournament.endDate).toLocaleDateString()}`
                  }
                </span>
              </div>
              <div className="header-stat">
                <TrophyIcon className="stat-icon" />
                <span>{tournament.hasTeams ? 'Team Tournament' : 'Individual Tournament'}</span>
              </div>
              <div className="header-stat">
                <UserGroupIcon className="stat-icon" />
                <span>{tournament.players.length} Players</span>
              </div>
              <div className="header-stat">
                <CalendarIcon className="stat-icon" />
                <span>{tournament.rounds?.length || 0} Rounds</span>
              </div>
            </div>
          </div>

          <div className="header-actions">
            {tournament.status === 'in_progress' && (
              <button onClick={handleCompleteTournament} className="button primary">
                <CheckCircleIcon className="icon" />
                Complete Tournament
              </button>
            )}
            <button onClick={handleOpenEditModal} className="button secondary">
              <PencilIcon className="icon" />
              Edit Details
            </button>
          </div>
        </div>

        {/* Playoff Alert Banner */}
        {tournament.rounds?.some(round => isStablefordRound(round)) && tournament.status === 'in_progress' && detectPlayoff() && !tournament.winner && (
          <div className="card playoff-alert">
            <TrophyIcon className="playoff-icon" />
            <div className="playoff-content">
              <h3>Playoff Required!</h3>
              <p>
                {detectPlayoff().tiedPlayers.length} players are tied with {detectPlayoff().topScore} points.
                A playoff is needed to determine the winner.
              </p>
            </div>
            <button onClick={handleOpenPlayoffManager} className="button primary">
              Resolve Playoff
            </button>
          </div>
        )}

        {/* Tournament Winner Banner */}
        {tournament.winner && (
          <div className="card winner-banner">
            <TrophyIcon className="winner-trophy-icon" />
            <div className="winner-content">
              <div className="winner-label">Tournament Winner</div>
              <div className="winner-name">{tournament.winner}</div>
              {tournament.winnerDetails?.method && (
                <div className="winner-method">Resolved by: {tournament.winnerDetails.method}</div>
              )}
            </div>
          </div>
        )}

        {/* My Scorecards - Only for players */}
        {currentPlayer && !isAdmin && (() => {
          const myScorecards = getMyAllScorecards();
          const activeScorecard = myScorecards.find(sc => sc.scorecard.status === 'in_progress');

          if (myScorecards.length === 0) return null;

          return (
            <div className="card my-scorecards-section">
              <h2>My Scorecards</h2>

              {/* Active Scorecard (Priority) */}
              {activeScorecard && (
                <div
                  className="quick-action-card active-scorecard"
                  onClick={() => navigateToScorecard(activeScorecard)}
                >
                  <div className="action-badge">Active</div>
                  <div className="action-icon">⛳</div>
                  <div className="action-content">
                    <div className="action-title">
                      {activeScorecard.round.name}
                    </div>
                    <div className="action-subtitle">
                      {activeScorecard.type === 'team'
                        ? `${activeScorecard.team.name} • ${getHolesCompleted(activeScorecard.scorecard)}/18`
                        : `${getHolesCompleted(activeScorecard.scorecard)}/18 holes`
                      }
                    </div>
                    {activeScorecard.type === 'match' && activeScorecard.scorecard.result && (
                      <div className="action-meta">
                        {activeScorecard.scorecard.result}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* All Scorecards List */}
              <div className="my-scorecards-list">
                {myScorecards
                  .filter(sc => sc !== activeScorecard) // Don't duplicate active
                  .map((scorecardData, index) => {
                    const { round, scorecard, type, team } = scorecardData;
                    const isCompleted = scorecard.status === 'completed';

                    return (
                      <div
                        key={index}
                        className={`scorecard-item ${isCompleted ? 'completed' : ''}`}
                        onClick={() => navigateToScorecard(scorecardData)}
                      >
                        <div className="scorecard-item-header">
                          <span className="round-name">{round.name}</span>
                          <span className={`status-badge status-badge-${scorecard.status}`}>
                            {isCompleted ? '✓' : `${getHolesCompleted(scorecard)}/18`}
                          </span>
                        </div>

                        <div className="scorecard-item-details">
                          {type === 'team' && (
                            <>
                              <span className="team-indicator">
                                <span
                                  className="team-dot"
                                  style={{ backgroundColor: team.color }}
                                />
                                {team.name}
                              </span>
                              <span className="format-badge">{round.format.replace(/_/g, ' ')}</span>
                            </>
                          )}

                          {type === 'individual' && (
                            <>
                              <span className="individual-indicator">Individual</span>
                              <span className="format-badge">{round.format.replace(/_/g, ' ')}</span>
                            </>
                          )}

                          {type === 'match' && (
                            <>
                              <span className="match-indicator">Match Play</span>
                              {scorecard.result && (
                                <span className="match-result">{scorecard.result}</span>
                              )}
                            </>
                          )}
                        </div>

                        {isCompleted && scorecard.totalNet && (
                          <div className="scorecard-item-score">
                            Net: {scorecard.totalNet}
                            {scorecard.totalPoints && ` • ${scorecard.totalPoints} pts`}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })()}

        {/* Teams Section (for team formats only) */}
        {isTeamFormat() && (
          <div className="card teams-section">
            <div className="section-header">
              <div>
                <h2>Teams</h2>
                <p className="section-subtitle">Manage team configuration and player assignments</p>
              </div>
              <button onClick={() => setShowTeamEditor(true)} className="button secondary small">
                <PencilIcon className="icon" />
                Edit Teams
              </button>
            </div>

            {tournament.teams && tournament.teams.length > 0 ? (
              <div className="teams-grid">
                {tournament.teams.map((team) => {
                  const teamPlayers = players.filter(p => team.players?.includes(p.id));
                  return (
                    <div key={team.id} className="team-card">
                      <div className="team-card-header">
                        <div className="team-info">
                          <span className="team-color-dot" style={{ backgroundColor: team.color }}></span>
                          <h3>{team.name}</h3>
                        </div>
                        <span className="team-count">{teamPlayers.length} player{teamPlayers.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="team-players-list">
                        {teamPlayers.map(player => (
                          <div key={player.id} className="team-player">
                            <span className="player-name">{player.name}</span>
                            <span className="player-handicap">HCP {player.handicap?.toFixed(1)}</span>
                          </div>
                        ))}
                        {teamPlayers.length === 0 && (
                          <div className="empty-team-message">No players assigned</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p>No teams configured</p>
                <button onClick={() => setShowTeamEditor(true)} className="button primary">
                  <UserGroupIcon className="icon" />
                  Setup Teams
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rounds Section */}
        <div className="card rounds-section">
          <h2>Rounds</h2>
          <p className="section-subtitle">Configure and manage tournament rounds</p>

          {tournament.rounds && tournament.rounds.length > 0 ? (
            <div className="rounds-layout">
              {/* Round List */}
              <div className="rounds-list">
                {tournament.rounds.map((round, index) => (
                  <div
                    key={round.id}
                    className={`round-item ${selectedRound?.id === round.id ? 'selected' : ''}`}
                    onClick={() => handleRoundSelect(round)}
                  >
                    <div className="round-item-header">
                      <div className="round-number">Round {round.roundNumber}</div>
                      <span className={`status-badge ${getStatusBadge(round.status).className}`}>
                        {getStatusBadge(round.status).label}
                      </span>
                    </div>
                    <div className="round-item-name">{round.name}</div>
                    <div className="round-item-date">
                      {new Date(round.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Round Details */}
              {selectedRound && (
                <div className="round-details">
                  <div className="round-details-header">
                    <h3>{selectedRound.name}</h3>
                    <div className="round-actions">
                      <button
                        onClick={() => updateRoundCourse(selectedRound)}
                        className="button secondary small"
                      >
                        <PencilIcon className="icon" />
                        Configure Course
                      </button>
                      {(selectedRound.format === 'match_play_singles' || selectedRound.format === 'four_ball' || selectedRound.format === 'foursomes') && (
                        <button
                          onClick={() => openMatchSetup(selectedRound)}
                          className="button secondary small"
                        >
                          <UserGroupIcon className="icon" />
                          Setup Matches
                        </button>
                      )}
                      {(selectedRound.format === 'individual_stroke' || selectedRound.format === 'individual_stableford') && (
                        <button
                          onClick={() => openScorecardSetup(selectedRound)}
                          className="button secondary small"
                        >
                          <UserGroupIcon className="icon" />
                          Setup Scorecards
                        </button>
                      )}
                      {isTeamScorecardFormat(selectedRound) && (
                        <button
                          onClick={() => openTeamScorecardSetup(selectedRound)}
                          className="button secondary small"
                        >
                          <UserGroupIcon className="icon" />
                          Setup Team Scorecards
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="round-info-grid">
                    <div className="round-info-item">
                      <span className="round-info-label">Date:</span>
                      <span className="round-info-value">
                        {new Date(selectedRound.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="round-info-item">
                      <span className="round-info-label">Format:</span>
                      <span className="round-info-value" style={{ textTransform: 'capitalize' }}>
                        {selectedRound.format ? selectedRound.format.replace(/_/g, ' ') : 'Not set'}
                      </span>
                    </div>
                    <div className="round-info-item">
                      <span className="round-info-label">Course:</span>
                      <span className="round-info-value">{selectedRound.courseName}</span>
                    </div>
                    <div className="round-info-item">
                      <span className="round-info-label">Par:</span>
                      <span className="round-info-value">
                        {selectedRound.courseData?.totalPar || 'Not set'}
                      </span>
                    </div>
                    <div className="round-info-item">
                      <span className="round-info-label">Holes Configured:</span>
                      <span className="round-info-value">
                        {selectedRound.courseData?.holes?.length || 0} / 18
                      </span>
                    </div>
                  </div>

                  {selectedRound.courseData?.holes?.length > 0 ? (
                    <div className="holes-table-section">
                      <button
                        onClick={() => setHoleConfigExpanded(!holeConfigExpanded)}
                        className="holes-table-toggle"
                      >
                        <h4>Hole Configuration</h4>
                        {holeConfigExpanded ? (
                          <ChevronUpIcon className="icon" />
                        ) : (
                          <ChevronDownIcon className="icon" />
                        )}
                      </button>
                      {holeConfigExpanded && (
                        <div className="holes-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Hole</th>
                                <th>Par</th>
                                <th>Stroke Index</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRound.courseData.holes.map((hole) => (
                                <tr key={hole.number}>
                                  <td>{hole.number}</td>
                                  <td>{hole.par}</td>
                                  <td>{hole.strokeIndex}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No course data configured for this round yet. Click "Configure Course" above to set up the holes.</p>
                    </div>
                  )}

                  {/* Scorecards Section for Individual/Stableford */}
                  {(selectedRound.format === 'individual_stroke' || isStablefordRound(selectedRound)) && selectedRound.scorecards && selectedRound.scorecards.length > 0 && (
                    <div className="scorecards-section">
                      <h4>Scorecards ({selectedRound.scorecards.length})</h4>
                      <div className="scorecards-grid">
                        {selectedRound.scorecards.map((scorecard) => {
                          const scorecardPlayer = getPlayer(scorecard.playerId);
                          const holesCompleted = scorecard.holes.filter(h => h.grossScore !== null).length;
                          const progress = (holesCompleted / 18) * 100;

                          return (
                            <div
                              key={scorecard.id}
                              className="scorecard-card clickable"
                              onClick={() => {
                                if (isStablefordRound(selectedRound)) {
                                  navigate(`/tournaments/${tournamentId}/rounds/${selectedRound.id}/stableford/${scorecard.id}`);
                                } else {
                                  navigate(`/tournaments/${tournamentId}/rounds/${selectedRound.id}/scorecards/${scorecard.id}`);
                                }
                              }}
                            >
                              <div className="scorecard-header">
                                <div className="scorecard-player">
                                  <div className="player-name">{scorecardPlayer?.name}</div>
                                  <div className="player-handicap">HCP: {scorecardPlayer?.handicap.toFixed(1)}</div>
                                </div>
                                <span className={`status-badge ${scorecard.status === 'completed' ? 'status-badge-completed' : scorecard.status === 'in_progress' ? 'status-badge-in-progress' : 'status-badge-setup'}`}>
                                  {scorecard.status === 'completed' ? 'Completed' : scorecard.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                </span>
                              </div>

                              <div className="scorecard-progress">
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="progress-text">{holesCompleted} / 18 holes</div>
                              </div>

                              <div className="scorecard-scores">
                                {scorecard.totalGross > 0 && (
                                  <>
                                    <div className="score-item">
                                      <span className="score-label">Gross</span>
                                      <span className="score-value">{scorecard.totalGross}</span>
                                    </div>
                                    <div className="score-item">
                                      <span className="score-label">Net</span>
                                      <span className="score-value">{scorecard.totalNet}</span>
                                    </div>
                                    {isStablefordRound(selectedRound) && (
                                      <div className="score-item">
                                        <span className="score-label">Points</span>
                                        <span className="score-value stableford">{scorecard.totalPoints || 0}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Matches Section for Match Play Formats */}
                  {(selectedRound.format === 'match_play_singles' || selectedRound.format === 'four_ball' || selectedRound.format === 'foursomes') && selectedRound.matches && selectedRound.matches.length > 0 && (
                    <div className="scorecards-section">
                      <h4>Matches ({selectedRound.matches.length})</h4>
                      <div className="scorecards-grid">
                        {selectedRound.matches.map((match) => {
                          const isIndividual = !tournament.hasTeams;
                          let player1Name, player2Name, matchTitle;

                          if (isIndividual) {
                            if (match.format === 'singles') {
                              player1Name = getPlayer(match.player1)?.name || 'TBD';
                              player2Name = getPlayer(match.player2)?.name || 'TBD';
                              matchTitle = `${player1Name} vs ${player2Name}`;
                            } else {
                              const p1a = getPlayer(match.partnership1?.[0])?.name || 'TBD';
                              const p1b = getPlayer(match.partnership1?.[1])?.name || 'TBD';
                              const p2a = getPlayer(match.partnership2?.[0])?.name || 'TBD';
                              const p2b = getPlayer(match.partnership2?.[1])?.name || 'TBD';
                              matchTitle = `${p1a} & ${p1b} vs ${p2a} & ${p2b}`;
                            }
                          } else {
                            const team1Players = match.team1Players?.map(id => getPlayer(id)?.name).filter(Boolean).join(' & ') || 'TBD';
                            const team2Players = match.team2Players?.map(id => getPlayer(id)?.name).filter(Boolean).join(' & ') || 'TBD';
                            matchTitle = `${team1Players} vs ${team2Players}`;
                          }

                          const holesCompleted = match.status === 'completed' ? 18 : (match.currentHole ? match.currentHole - 1 : 0);
                          const progress = (holesCompleted / 18) * 100;

                          return (
                            <div
                              key={match.id}
                              className="scorecard-card clickable"
                              onClick={() => {
                                navigate(`/scoring/${match.id}`);
                              }}
                            >
                              <div className="scorecard-header">
                                <div className="scorecard-player">
                                  <div className="player-name">{match.name || `Match ${match.matchNumber}`}</div>
                                  <div className="player-handicap" style={{ fontSize: '0.75rem' }}>{matchTitle}</div>
                                </div>
                                <span className={`status-badge ${match.status === 'completed' ? 'status-badge-completed' : match.status === 'in_progress' ? 'status-badge-in-progress' : 'status-badge-setup'}`}>
                                  {match.status === 'completed' ? 'Completed' : match.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                </span>
                              </div>

                              <div className="scorecard-progress">
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="progress-text">{holesCompleted} / 18 holes</div>
                              </div>

                              <div className="scorecard-scores">
                                {match.status === 'in_progress' && !match.result && (
                                  <div className="score-item">
                                    <span className="score-label">Progress</span>
                                    <span className="score-value">{holesCompleted} / 18</span>
                                  </div>
                                )}
                                {match.result && (
                                  <div className="score-item">
                                    <span className="score-label">Result</span>
                                    <span className="score-value">{match.result}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Team Scorecards Section for Team Formats */}
                  {isTeamScorecardFormat(selectedRound) && selectedRound.teamScorecards && selectedRound.teamScorecards.length > 0 && (
                    <div className="scorecards-section">
                      <h4>Team Scorecards ({selectedRound.teamScorecards.length})</h4>
                      <div className="scorecards-grid">
                        {selectedRound.teamScorecards.map((teamScorecard) => {
                          const team = tournament.teams?.find(t => t.id === teamScorecard.teamId);
                          const holesCompleted = teamScorecard.holes?.filter(h => h.grossScore !== null).length || 0;
                          const progress = (holesCompleted / 18) * 100;

                          return (
                            <div
                              key={teamScorecard.id}
                              className="scorecard-card clickable"
                              onClick={() => {
                                // Navigate to appropriate scoring screen based on format
                                if (selectedRound.format === 'scramble') {
                                  navigate(`/tournaments/${tournamentId}/rounds/${selectedRound.id}/scramble/${team.id}`);
                                } else if (selectedRound.format === 'shamble') {
                                  navigate(`/tournaments/${tournamentId}/rounds/${selectedRound.id}/shamble/${team.id}`);
                                } else if (selectedRound.format === 'best_ball') {
                                  navigate(`/tournaments/${tournamentId}/rounds/${selectedRound.id}/bestball/${team.id}`);
                                } else if (selectedRound.format === 'team_stableford') {
                                  navigate(`/tournaments/${tournamentId}/rounds/${selectedRound.id}/team-stableford/${team.id}`);
                                }
                              }}
                            >
                              <div className="scorecard-header">
                                <div className="scorecard-player">
                                  <div className="team-name-display">
                                    <span className="team-color-dot" style={{ backgroundColor: team?.color }}></span>
                                    <div className="player-name">{team?.name}</div>
                                  </div>
                                  <div className="player-handicap">
                                    {team?.players?.length || 0} player{team?.players?.length !== 1 ? 's' : ''}
                                  </div>
                                </div>
                                <span className={`status-badge ${teamScorecard.status === 'completed' ? 'status-badge-completed' : teamScorecard.status === 'in_progress' ? 'status-badge-in-progress' : 'status-badge-setup'}`}>
                                  {teamScorecard.status === 'completed' ? 'Completed' : teamScorecard.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                </span>
                              </div>

                              <div className="scorecard-progress">
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="progress-text">{holesCompleted} / 18 holes</div>
                              </div>

                              <div className="scorecard-scores">
                                {teamScorecard.totalGross > 0 && (
                                  <>
                                    <div className="score-item">
                                      <span className="score-label">Gross</span>
                                      <span className="score-value">{teamScorecard.totalGross}</span>
                                    </div>
                                    <div className="score-item">
                                      <span className="score-label">Net</span>
                                      <span className="score-value">{teamScorecard.totalNet}</span>
                                    </div>
                                    {selectedRound.format === 'team_stableford' && (
                                      <div className="score-item">
                                        <span className="score-label">Points</span>
                                        <span className="score-value stableford">{teamScorecard.totalPoints || 0}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>No rounds configured for this tournament.</p>
            </div>
          )}
        </div>

        {/* Notes Section */}
        {tournament.notes && (
          <div className="card notes-section">
            <h3>Notes</h3>
            <p>{tournament.notes}</p>
          </div>
        )}

        {/* Media Gallery */}
        <div className="card media-gallery-section">
          <MediaGallery tournamentId={tournament.id} />
        </div>

        {/* Players Section */}
        <div className="card players-section">
          <h2>Players</h2>
          <p className="section-subtitle">{tournament.players.length} players registered</p>

          <div className="players-grid">
            {tournament.players.map(playerId => {
              const player = getPlayer(playerId);
              return player ? (
                <div key={playerId} className="player-card">
                  <div className="player-name">{player.name}</div>
                  <div className="player-handicap">HCP: {player.handicap.toFixed(1)}</div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Course Configuration Modal */}
      {showCourseConfig && configuringRound && (
        <RoundCourseConfig
          round={configuringRound}
          tournamentFormat={configuringRound.format}
          onSave={handleSaveCourseConfig}
          onClose={() => {
            setShowCourseConfig(false);
            setConfiguringRound(null);
          }}
        />
      )}

      {/* Match Setup Modal */}
      {showMatchSetup && configuringRound && (configuringRound.format === 'match_play_singles' || configuringRound.format === 'four_ball' || configuringRound.format === 'foursomes') && (
        <RoundMatchSetup
          round={configuringRound}
          tournament={tournament}
          onSave={handleSaveMatchSetup}
          onClose={() => {
            setShowMatchSetup(false);
            setConfiguringRound(null);
          }}
        />
      )}

      {/* Scorecard Setup Modal */}
      {showScorecardSetup && configuringRound && (configuringRound.format === 'individual_stroke' || isStablefordRound(configuringRound)) && (
        <RoundScorecardSetup
          round={configuringRound}
          tournament={tournament}
          onSave={handleSaveScorecardSetup}
          onClose={() => {
            setShowScorecardSetup(false);
            setConfiguringRound(null);
          }}
        />
      )}

      {/* Team Scorecard Setup Modal */}
      {showTeamScorecardSetup && configuringRound && isTeamScorecardFormat(configuringRound) && (
        <RoundTeamScorecardSetup
          round={configuringRound}
          tournament={tournament}
          onSave={handleSaveTeamScorecardSetup}
          onClose={() => {
            setShowTeamScorecardSetup(false);
            setConfiguringRound(null);
          }}
        />
      )}

      {/* Playoff Manager Modal */}
      {showPlayoffManager && playoffData && (
        <PlayoffManager
          tournament={tournament}
          round={playoffData.round}
          tiedPlayers={playoffData.tiedPlayers}
          onClose={() => {
            setShowPlayoffManager(false);
            setPlayoffData(null);
          }}
          onComplete={handlePlayoffComplete}
        />
      )}

      {/* Team Editor Modal */}
      {showTeamEditor && (
        <TeamEditorModal
          teams={tournament.teams || []}
          players={players}
          tournamentPlayers={tournament.players || []}
          onSave={handleSaveTeams}
          onClose={() => setShowTeamEditor(false)}
        />
      )}

      {/* Edit Details Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Tournament Details</h2>
              <button onClick={() => setShowEditModal(false)} className="close-button">×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="tournament-name">Tournament Name</label>
                <input
                  id="tournament-name"
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="input"
                  placeholder="Tournament Name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start-date">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end-date">End Date</label>
                  <input
                    id="end-date"
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="input"
                  rows="4"
                  placeholder="Add any notes or description for this tournament..."
                />
              </div>

              <div className="form-group">
                <label>Players ({editFormData.players.length} selected)</label>
                <div className="player-selection-grid">
                  {players.map(player => (
                    <div
                      key={player.id}
                      className={`player-selection-item ${editFormData.players.includes(player.id) ? 'selected' : ''}`}
                      onClick={() => handleTogglePlayer(player.id)}
                    >
                      <div className="player-selection-info">
                        <div className="player-name">{player.name}</div>
                        <div className="player-handicap">HCP: {player.handicap.toFixed(1)}</div>
                      </div>
                      <div className="player-selection-checkbox">
                        {editFormData.players.includes(player.id) ? '✓' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="danger-zone">
                  <h3>Danger Zone</h3>
                  <p className="danger-warning">
                    Deleting a tournament will permanently remove all rounds, scorecards, and matches. This action cannot be undone.
                  </p>
                  <button onClick={handleDeleteTournament} className="button danger">
                    <TrashIcon className="icon" />
                    Delete Tournament
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="button secondary">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="button primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Team Editor Modal Component
function TeamEditorModal({ teams, players, tournamentPlayers, onSave, onClose }) {
  const [editingTeams, setEditingTeams] = useState(teams.length > 0 ? teams : [
    { id: 'team1', name: 'Team 1', color: '#DC2626', players: [] },
    { id: 'team2', name: 'Team 2', color: '#2563EB', players: [] }
  ]);

  const handleTeamNameChange = (teamId, newName) => {
    setEditingTeams(prev => prev.map(t => t.id === teamId ? { ...t, name: newName } : t));
  };

  const handleTeamColorChange = (teamId, newColor) => {
    setEditingTeams(prev => prev.map(t => t.id === teamId ? { ...t, color: newColor } : t));
  };

  const handleAddPlayerToTeam = (teamId, playerId) => {
    setEditingTeams(prev => prev.map(t => {
      if (t.id === teamId && !t.players.includes(playerId)) {
        return { ...t, players: [...t.players, playerId] };
      }
      // Remove from other teams
      return { ...t, players: t.players.filter(p => p !== playerId) };
    }));
  };

  const handleRemovePlayerFromTeam = (teamId, playerId) => {
    setEditingTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, players: t.players.filter(p => p !== playerId) } : t
    ));
  };

  const tournamentPlayersList = players.filter(p => tournamentPlayers.includes(p.id));
  const allAssignedPlayers = editingTeams.flatMap(t => t.players);
  const unassignedPlayers = tournamentPlayersList.filter(p => !allAssignedPlayers.includes(p.id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Teams</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="modal-body">
          <div className="teams-setup">
            {editingTeams.map((team, teamIndex) => {
              const teamPlayers = players.filter(p => team.players.includes(p.id));

              return (
                <div key={team.id} className="team-setup-card card">
                  <div className="team-header">
                    <div className="team-info">
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
                        className="team-name-input"
                        placeholder="Team Name"
                      />
                      <div className="team-color-picker">
                        <label>Color:</label>
                        <input
                          type="color"
                          value={team.color}
                          onChange={(e) => handleTeamColorChange(team.id, e.target.value)}
                          className="color-input"
                        />
                        <span className="color-preview" style={{ backgroundColor: team.color }}></span>
                      </div>
                    </div>
                    <div className="team-count">
                      {teamPlayers.length} player{teamPlayers.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="team-players">
                    {teamPlayers.length > 0 ? (
                      <div className="assigned-players">
                        {teamPlayers.map(player => (
                          <div key={player.id} className="team-player-item">
                            <div className="player-details">
                              <span className="player-name">{player.name}</span>
                              <span className="player-handicap">HCP {player.handicap?.toFixed(1)}</span>
                            </div>
                            <button
                              onClick={() => handleRemovePlayerFromTeam(team.id, player.id)}
                              className="button small danger"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-team">No players assigned</div>
                    )}
                  </div>

                  {teamIndex === editingTeams.length - 1 && unassignedPlayers.length > 0 && (
                    <div className="unassigned-section">
                      <h4>Unassigned Players</h4>
                      <div className="unassigned-players">
                        {unassignedPlayers.map(player => (
                          <div key={player.id} className="unassigned-player-item">
                            <div className="player-details">
                              <span className="player-name">{player.name}</span>
                              <span className="player-handicap">HCP {player.handicap?.toFixed(1)}</span>
                            </div>
                            <div className="assign-buttons">
                              {editingTeams.map(t => (
                                <button
                                  key={t.id}
                                  onClick={() => handleAddPlayerToTeam(t.id, player.id)}
                                  className="button small secondary"
                                  style={{ borderColor: t.color }}
                                >
                                  Add to {t.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button secondary">
            Cancel
          </button>
          <button onClick={() => onSave(editingTeams)} className="button primary">
            Save Teams
          </button>
        </div>
      </div>
    </div>
  );
}

export default TournamentDetail;
