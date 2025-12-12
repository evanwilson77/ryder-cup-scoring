import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  subscribeToPlayers
} from '../firebase/services';
import { subscribeToTournaments } from '../firebase/tournamentServices';
import { calculateTournamentPoints, calculateMatchStatus, getProvisionalResult } from '../utils/scoring';
import { mapFormatToRoute } from '../utils/formatMapping';
import StablefordLeaderboard from './StablefordLeaderboard';
import { CameraIcon } from '@heroicons/react/24/outline';
import MediaUploader from './media/MediaUploader';
import './Leaderboard.css';

function Leaderboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showMediaUploader, setShowMediaUploader] = useState(false);

  // Get tournament ID from URL params
  const searchParams = new URLSearchParams(location.search);
  const urlTournamentId = searchParams.get('t');

  useEffect(() => {
    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubTournaments = subscribeToTournaments((tournamentsData) => {
      setTournaments(tournamentsData);

      // First priority: Check for tournament from URL parameter (even if one is already selected)
      if (urlTournamentId && tournamentsData.length > 0) {
        const requestedTournament = tournamentsData.find(t => t.id === urlTournamentId);
        if (requestedTournament && (!selectedTournament || selectedTournament.id !== urlTournamentId)) {
          setSelectedTournament(requestedTournament);
          // Keep URL param for bookmarking and browser history
          return;
        }
      }

      // Auto-select tournament if none is selected
      if (!selectedTournament && tournamentsData.length > 0) {
        // Default: Auto-select oldest open tournament (in_progress or setup)
        const openTournaments = tournamentsData.filter(t =>
          t.status === 'in_progress' || t.status === 'setup'
        ).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        if (openTournaments.length > 0) {
          setSelectedTournament(openTournaments[0]);
        } else {
          // If no open tournaments, show the most recent one
          const sortedByDate = [...tournamentsData].sort((a, b) =>
            new Date(b.startDate) - new Date(a.startDate)
          );
          if (sortedByDate.length > 0) {
            setSelectedTournament(sortedByDate[0]);
          }
        }
      }
    });

    return () => {
      unsubPlayers();
      unsubTournaments();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament, urlTournamentId]);

  // Get teams and matches from selected tournament
  const teams = selectedTournament?.teams || [];
  const team1 = teams[0]; // First team
  const team2 = teams[1]; // Second team

  // Get all matches from all rounds in the tournament
  const matches = selectedTournament?.rounds?.flatMap(round => round.matches || []) || [];

  // Get all team scorecards from all rounds (for scramble, shamble, best_ball, team_stableford formats)
  // Include round info for navigation
  const teamScorecards = selectedTournament?.rounds?.flatMap(round =>
    (round.teamScorecards || []).map(sc => ({
      ...sc,
      roundId: round.id,
      roundName: round.name,
      format: mapFormatToRoute(round.format),
      tournamentId: selectedTournament.id
    }))
  ) || [];

  // Helper function to check if a scorecard is complete
  const isScorecardComplete = (scorecard) => {
    // First check status field if it exists
    if (scorecard.status === 'completed') return true;
    if (scorecard.status === 'not_started' || scorecard.status === 'in_progress') return false;

    // For legacy scorecards without status field, check if all holes have scores
    if (scorecard.holes) {
      // Scramble format - check holes array
      return scorecard.holes.every(h => h.grossScore !== null && h.grossScore !== undefined);
    } else if (scorecard.playerScores) {
      // Shamble/Best Ball format - check if all players have completed all holes
      const playerScoreArrays = Object.values(scorecard.playerScores);
      if (playerScoreArrays.length === 0) return false;

      return playerScoreArrays.every(playerHoles =>
        playerHoles.every(h => h.grossScore !== null && h.grossScore !== undefined)
      );
    }

    return false;
  };

  // Calculate actual points based on format
  let team1Points = 0;
  let team2Points = 0;

  if (matches.length > 0) {
    // Match play formats - use existing calculation
    const matchPoints = calculateTournamentPoints(matches);
    team1Points = matchPoints.team1Points;
    team2Points = matchPoints.team2Points;
  } else if (teamScorecards.length > 0) {
    // Team scorecard formats - calculate from completed scorecards
    const team1Id = selectedTournament?.teams?.[0]?.id;
    const team2Id = selectedTournament?.teams?.[1]?.id;

    teamScorecards.forEach(scorecard => {
      if (isScorecardComplete(scorecard)) {
        // Match by team ID from the tournament teams array
        if (scorecard.teamId === team1Id) {
          team1Points += 1;
        } else if (scorecard.teamId === team2Id) {
          team2Points += 1;
        }
      }
    });
  }

  // Calculate projected points (including in-progress matches/scorecards)
  const calculateProjectedPoints = () => {
    let team1Projected = team1Points;
    let team2Projected = team2Points;

    if (matches.length > 0) {
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
    } else if (teamScorecards.length > 0) {
      // For team scorecards, add 1 point per team for in-progress scorecards
      const team1Id = selectedTournament?.teams?.[0]?.id;
      const team2Id = selectedTournament?.teams?.[1]?.id;

      const inProgressScorecards = teamScorecards.filter(sc => {
        // Check status field first
        if (sc.status === 'in_progress') return true;
        if (sc.status === 'completed' || sc.status === 'not_started') return false;

        // For legacy scorecards without status, check if has some but not all scores
        if (!isScorecardComplete(sc)) {
          // Check if it has any scores at all
          if (sc.holes) {
            return sc.holes.some(h => h.grossScore !== null && h.grossScore !== undefined);
          } else if (sc.playerScores) {
            return Object.values(sc.playerScores).some(playerHoles =>
              playerHoles.some(h => h.grossScore !== null && h.grossScore !== undefined)
            );
          }
        }
        return false;
      });

      inProgressScorecards.forEach(scorecard => {
        if (scorecard.teamId === team1Id) {
          team1Projected += 1;
        } else if (scorecard.teamId === team2Id) {
          team2Projected += 1;
        }
      });
    }

    return { team1Projected, team2Projected };
  };

  const { team1Projected, team2Projected } = calculateProjectedPoints();

  const completedMatches = matches.filter(m => m.status === 'completed');
  const inProgressMatches = matches.filter(m => m.status === 'in_progress');
  const upcomingMatches = matches.filter(m => m.status === 'not_started');

  // Helper function to determine scorecard status (handles legacy scorecards)
  const getScorecardStatus = (sc) => {
    if (sc.status) return sc.status;

    // Legacy scorecard without status field - determine from scores
    if (isScorecardComplete(sc)) return 'completed';

    // Check if has any scores
    const hasAnyScore = sc.holes
      ? sc.holes.some(h => h.grossScore !== null && h.grossScore !== undefined)
      : sc.playerScores
        ? Object.values(sc.playerScores).some(playerHoles =>
            playerHoles.some(h => h.grossScore !== null && h.grossScore !== undefined)
          )
        : false;

    return hasAnyScore ? 'in_progress' : 'not_started';
  };

  // Also track team scorecards status
  const completedScorecards = teamScorecards.filter(sc => getScorecardStatus(sc) === 'completed');
  const inProgressScorecards = teamScorecards.filter(sc => getScorecardStatus(sc) === 'in_progress');
  const upcomingScorecards = teamScorecards.filter(sc => getScorecardStatus(sc) === 'not_started');

  const getPlayer = (playerId) => players.find(p => p.id === playerId);

  const getMatchResultText = (match) => {
    if (!match.result) return 'In Progress';

    if (match.result === 'halved') {
      return 'Halved';
    } else if (match.result === 'team1_win') {
      return `${team1?.name} wins`;
    } else if (match.result === 'team2_win') {
      return `${team2?.name} wins`;
    }
  };

  const getPlayerNames = (playerIds) => {
    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return 'No players assigned';
    }
    return playerIds.map(id => getPlayer(id)?.name || 'Unknown').join(' & ');
  };

  // Get open tournaments for selector
  const openTournaments = tournaments.filter(t =>
    t.status === 'in_progress' || t.status === 'setup'
  );

  if (!selectedTournament || !selectedTournament.id || !selectedTournament.name) {
    return (
      <div className="leaderboard">
        <div className="card">
          <div className="empty-state">
            <h2>No Tournaments Found</h2>
            <p>Create a tournament to get started</p>
            <button onClick={() => navigate('/tournaments/create')} className="button primary">
              Create Tournament
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if this is a team-based format
  const isTeamFormat = selectedTournament.hasTeams === true || (selectedTournament.teams && selectedTournament.teams.length > 0);

  // If INDIVIDUAL stableford tournament, show Stableford leaderboard
  // Team stableford tournaments will use the regular team leaderboard below
  const hasIndividualStablefordRounds = selectedTournament.rounds?.some(r =>
    r.format === 'individual_stableford'
  );

  if (hasIndividualStablefordRounds && !isTeamFormat) {
    return <StablefordLeaderboard />;
  }

  return (
    <div className="leaderboard">
      {/* Tournament Selector */}
      {tournaments.length > 1 && (
        <div className="card tournament-selector">
          <label htmlFor="tournament-select">Viewing Tournament:</label>
          <select
            id="tournament-select"
            value={selectedTournament.id}
            onChange={(e) => {
              const tournament = tournaments.find(t => t.id === e.target.value);
              setSelectedTournament(tournament);
            }}
            className="tournament-select"
          >
            {openTournaments.length > 0 && (
              <optgroup label="Open Tournaments">
                {openTournaments.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.edition ? `(${t.edition})` : ''} - {t.status === 'in_progress' ? 'In Progress' : 'Setup'}
                  </option>
                ))}
              </optgroup>
            )}
            {tournaments.filter(t => t.status === 'completed').length > 0 && (
              <optgroup label="Completed Tournaments">
                {tournaments.filter(t => t.status === 'completed').map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.edition ? `(${t.edition})` : ''} - Completed
                  </option>
                ))}
              </optgroup>
            )}
            {tournaments.filter(t => t.status !== 'in_progress' && t.status !== 'setup' && t.status !== 'completed').length > 0 && (
              <optgroup label="Other Tournaments">
                {tournaments.filter(t => t.status !== 'in_progress' && t.status !== 'setup' && t.status !== 'completed').map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.edition ? `(${t.edition})` : ''} - {t.status || 'Unknown Status'}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            onClick={() => navigate(`/tournaments/${selectedTournament.id}`)}
            className="button secondary small"
          >
            Manage Tournament
          </button>
        </div>
      )}

      <div className="card scoreboard">
        <h2>{selectedTournament.name} {selectedTournament.edition && `(${selectedTournament.edition})`}</h2>
        <p className="tournament-info">
          {isTeamFormat ? 'Team Tournament' : 'Individual Tournament'} • {new Date(selectedTournament.startDate).toLocaleDateString()}
          {selectedTournament.startDate !== selectedTournament.endDate && ` - ${new Date(selectedTournament.endDate).toLocaleDateString()}`}
        </p>

        {/* Team Scoreboard - Only show for team-based formats */}
        {isTeamFormat && teams.length > 0 && (
          <>
            <div className="score-display">
              <div className="team-score" style={{ backgroundColor: team1?.color }}>
                <div className="team-name">{team1?.name || 'Team 1'}</div>
                <div className="team-points">
                  {team1Points}
                  {team1Projected !== team1Points && (
                    <span className="provisional-score"> ({team1Projected})</span>
                  )}
                </div>
                {inProgressMatches.length > 0 && (
                  <div className="score-legend">
                    Actual {team1Projected !== team1Points && '(Provisional)'}
                  </div>
                )}
              </div>

              <div className="score-divider">
                <span>POINTS</span>
              </div>

              <div className="team-score" style={{ backgroundColor: team2?.color }}>
                <div className="team-name">{team2?.name || 'Team 2'}</div>
                <div className="team-points">
                  {team2Points}
                  {team2Projected !== team2Points && (
                    <span className="provisional-score"> ({team2Projected})</span>
                  )}
                </div>
                {inProgressMatches.length > 0 && (
                  <div className="score-legend">
                    Actual {team2Projected !== team2Points && '(Provisional)'}
                  </div>
                )}
              </div>
            </div>

            <div className="match-summary">
              <div className="summary-item">
                <span className="summary-label">{matches.length > 0 ? 'Total Matches' : 'Total Rounds'}</span>
                <span className="summary-value">{matches.length > 0 ? matches.length : teamScorecards.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Completed</span>
                <span className="summary-value">{matches.length > 0 ? completedMatches.length : completedScorecards.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">In Progress</span>
                <span className="summary-value">{matches.length > 0 ? inProgressMatches.length : inProgressScorecards.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Upcoming</span>
                <span className="summary-value">{matches.length > 0 ? upcomingMatches.length : upcomingScorecards.length}</span>
              </div>
            </div>
          </>
        )}

        {/* Individual/Stableford Tournament Summary - For non-team formats */}
        {!isTeamFormat && (
          <div className="tournament-summary">
            <p className="tournament-status">
              {selectedTournament.status === 'setup' && 'Tournament in setup - configure rounds and players'}
              {selectedTournament.status === 'in_progress' && 'Tournament in progress'}
              {selectedTournament.status === 'completed' && 'Tournament completed'}
            </p>
            <button
              onClick={() => navigate(`/tournaments/${selectedTournament.id}`)}
              className="button primary"
            >
              View Tournament Details
            </button>
          </div>
        )}
      </div>

      {/* Match Lists - Only show for team-based formats */}
      {isTeamFormat && (inProgressMatches.length > 0 || inProgressScorecards.length > 0) && (
        <div className="card">
          <h3>{matches.length > 0 ? 'Live Matches' : 'In Progress'}</h3>
          <div className="matches-list">
            {inProgressMatches.map(match => {
              const matchStatus = calculateMatchStatus(match.holeScores, 18, team1?.name, team2?.name);
              const projectedResult = getProvisionalResult(match.holeScores);

              return (
                <div key={match.id} className="match-item live">
                  <div className="match-info">
                    <div className="match-name">{match.name}</div>
                    <div className="match-format">{match.format || 'Match Play'}</div>
                    <div className="match-players">
                      <span style={{ color: team1?.color }}>
                        {getPlayerNames(match.team1Players)}
                      </span>
                      {' vs '}
                      <span style={{ color: team2?.color }}>
                        {getPlayerNames(match.team2Players)}
                      </span>
                    </div>
                    <div className="match-status-live">
                      {matchStatus.status} • {matchStatus.holesPlayed} of 18 played
                      {projectedResult && (
                        <span className="projected-indicator"> • Projected: {
                          projectedResult === 'team1_win' ? team1?.name :
                          projectedResult === 'team2_win' ? team2?.name :
                          'Halved'
                        }</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="button small"
                    onClick={() => navigate(`/scoring/${match.id}`)}
                  >
                    Continue Scoring
                  </button>
                </div>
              );
            })}

            {/* Team Scorecards in progress */}
            {inProgressScorecards.map(scorecard => {
              const team = teams.find(t => t.id === scorecard.teamId);
              const getTeamPlayerNames = () => {
                if (!team || !team.players) return '';
                return team.players.map(pid => getPlayer(pid)?.name || '').filter(n => n).join(', ');
              };

              return (
                <div key={`${scorecard.roundId}-${scorecard.teamId}`} className="match-item live">
                  <div className="match-info">
                    <div className="match-name">{scorecard.roundName || 'Team Round'}</div>
                    <div className="match-format" style={{ color: team?.color }}>
                      {team?.name || 'Team'}
                    </div>
                    <div className="match-players">
                      {getTeamPlayerNames()}
                    </div>
                    <div className="match-status-live">
                      In Progress • {scorecard.currentHole || 1} of {scorecard.courseData?.holes?.length || 18}
                    </div>
                  </div>
                  <button
                    className="button small"
                    onClick={() => navigate(`/tournaments/${scorecard.tournamentId}/rounds/${scorecard.roundId}/${scorecard.format}/${scorecard.teamId}`)}
                  >
                    Continue Scoring
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isTeamFormat && (completedMatches.length > 0 || completedScorecards.length > 0) && (
        <div className="card">
          <h3>Completed Matches</h3>
          <div className="matches-list">
            {completedMatches.map(match => (
              <div key={match.id} className="match-item completed">
                <div className="match-info">
                  <div className="match-name">{match.name}</div>
                  <div className="match-format">{match.format || 'Match Play'}</div>
                  <div className="match-players">
                    <span style={{ color: team1?.color }}>
                      {getPlayerNames(match.team1Players)}
                    </span>
                    {' vs '}
                    <span style={{ color: team2?.color }}>
                      {getPlayerNames(match.team2Players)}
                    </span>
                  </div>
                  <div className="match-result">
                    {getMatchResultText(match)}
                  </div>
                </div>
                <button
                  className="button small secondary"
                  onClick={() => navigate(`/match/${match.id}`)}
                >
                  View Details
                </button>
              </div>
            ))}

            {/* Completed Team Scorecards */}
            {completedScorecards.map(scorecard => {
              const team = teams.find(t => t.id === scorecard.teamId);
              const getTeamPlayerNames = () => {
                if (!team || !team.players) return '';
                return team.players.map(pid => getPlayer(pid)?.name || '').filter(n => n).join(', ');
              };

              return (
                <div key={`${scorecard.roundId}-${scorecard.teamId}`} className="match-item completed">
                  <div className="match-info">
                    <div className="match-name">{scorecard.roundName || 'Team Round'}</div>
                    <div className="match-format" style={{ color: team?.color }}>
                      {team?.name || 'Team'}
                    </div>
                    <div className="match-players">
                      {getTeamPlayerNames()}
                    </div>
                    <div className="match-result">
                      Score: {scorecard.totalNet || scorecard.totalGross || 0}
                      {scorecard.totalPoints && ` • ${scorecard.totalPoints} pts`}
                    </div>
                  </div>
                  <button
                    className="button small secondary"
                    onClick={() => navigate(`/tournaments/${scorecard.tournamentId}/rounds/${scorecard.roundId}/${scorecard.format}/${scorecard.teamId}`)}
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isTeamFormat && (upcomingMatches.length > 0 || upcomingScorecards.length > 0) && (
        <div className="card">
          <h3>Upcoming Matches</h3>
          <div className="matches-list">
            {upcomingMatches.map(match => (
              <div key={match.id} className="match-item upcoming">
                <div className="match-info">
                  <div className="match-name">{match.name}</div>
                  <div className="match-format">{match.format || 'Match Play'}</div>
                  <div className="match-players">
                    <span style={{ color: team1?.color }}>
                      {getPlayerNames(match.team1Players)}
                    </span>
                    {' vs '}
                    <span style={{ color: team2?.color }}>
                      {getPlayerNames(match.team2Players)}
                    </span>
                  </div>
                </div>
                <button
                  className="button small"
                  onClick={() => navigate(`/scoring/${match.id}`)}
                >
                  Start Match
                </button>
              </div>
            ))}

            {/* Upcoming Team Scorecards */}
            {upcomingScorecards.map(scorecard => {
              const team = teams.find(t => t.id === scorecard.teamId);
              const getTeamPlayerNames = () => {
                if (!team || !team.players) return '';
                return team.players.map(pid => getPlayer(pid)?.name || '').filter(n => n).join(', ');
              };

              return (
                <div key={`${scorecard.roundId}-${scorecard.teamId}`} className="match-item upcoming">
                  <div className="match-info">
                    <div className="match-name">{scorecard.roundName || 'Team Round'}</div>
                    <div className="match-format" style={{ color: team?.color }}>
                      {team?.name || 'Team'}
                    </div>
                    <div className="match-players">
                      {getTeamPlayerNames()}
                    </div>
                  </div>
                  <button
                    className="button small"
                    onClick={() => navigate(`/tournaments/${scorecard.tournamentId}/rounds/${scorecard.roundId}/${scorecard.format}/${scorecard.teamId}`)}
                  >
                    Start Round
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isTeamFormat && matches.length === 0 && teamScorecards.length === 0 && (
        <div className="card empty-state">
          <h3>No Rounds Yet</h3>
          <p>Set up rounds for this tournament in the tournament detail page</p>
          <div className="quick-actions">
            <button className="button primary" onClick={() => navigate(`/tournaments/${selectedTournament.id}`)}>
              Configure Tournament
            </button>
          </div>
        </div>
      )}

      {/* Floating Media Button - for awards/ceremony photos */}
      {selectedTournament && selectedTournament.status === 'completed' && (
        <button
          onClick={() => setShowMediaUploader(true)}
          className="floating-media-button"
          title="Add Awards Photos"
        >
          <CameraIcon className="icon" />
        </button>
      )}

      {/* Media Uploader Modal */}
      {showMediaUploader && selectedTournament && (
        <MediaUploader
          tournamentId={selectedTournament.id}
          category="awards"
          onUploadComplete={() => setShowMediaUploader(false)}
          onClose={() => setShowMediaUploader(false)}
        />
      )}
    </div>
  );
}

export default Leaderboard;
