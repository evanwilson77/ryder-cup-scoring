import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  subscribeToPlayers
} from '../firebase/services';
import { subscribeToTournaments } from '../firebase/tournamentServices';
import { calculateTournamentPoints, calculateMatchStatus, getProvisionalResult } from '../utils/scoring';
import StablefordLeaderboard from './StablefordLeaderboard';
import { CameraIcon } from '@heroicons/react/24/outline';
import MediaUploader from './media/MediaUploader';
import './Leaderboard.css';

function Leaderboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showMediaUploader, setShowMediaUploader] = useState(false);

  useEffect(() => {
    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubTournaments = subscribeToTournaments((tournamentsData) => {
      setTournaments(tournamentsData);

      // Auto-select oldest open tournament (in_progress or setup)
      if (!selectedTournament && tournamentsData.length > 0) {
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
  }, [selectedTournament]);

  // Get teams and matches from selected tournament
  const teams = selectedTournament?.teams || [];
  const team1 = teams.find(t => t.id === 'team1');
  const team2 = teams.find(t => t.id === 'team2');

  // Get all matches from all rounds in the tournament
  const matches = selectedTournament?.rounds?.flatMap(round => round.matches || []) || [];

  // Calculate actual points (completed only)
  const { team1Points, team2Points } = calculateTournamentPoints(matches);

  // Calculate projected points (including in-progress matches)
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

  const completedMatches = matches.filter(m => m.status === 'completed');
  const inProgressMatches = matches.filter(m => m.status === 'in_progress');
  const upcomingMatches = matches.filter(m => m.status === 'not_started');

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
    return playerIds.map(id => getPlayer(id)?.name).join(' & ');
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
  const isTeamFormat = selectedTournament.hasTeams === true;

  // If stableford tournament (check if any round has stableford format), show Stableford leaderboard
  const hasStablefordRounds = selectedTournament.rounds?.some(r =>
    r.format === 'individual_stableford' || r.format === 'team_stableford'
  );
  if (hasStablefordRounds) {
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
            <optgroup label="Open Tournaments">
              {openTournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.edition ? `(${t.edition})` : ''} - {t.status === 'in_progress' ? 'In Progress' : 'Setup'}
                </option>
              ))}
            </optgroup>
            {tournaments.filter(t => t.status === 'completed').length > 0 && (
              <optgroup label="Completed Tournaments">
                {tournaments.filter(t => t.status === 'completed').map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.edition ? `(${t.edition})` : ''} - Completed
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
          {selectedTournament.hasTeams ? 'Team Tournament' : 'Individual Tournament'} • {new Date(selectedTournament.startDate).toLocaleDateString()}
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
                <span className="summary-label">Total Matches</span>
                <span className="summary-value">{matches.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Completed</span>
                <span className="summary-value">{completedMatches.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">In Progress</span>
                <span className="summary-value">{inProgressMatches.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Upcoming</span>
                <span className="summary-value">{upcomingMatches.length}</span>
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
      {isTeamFormat && inProgressMatches.length > 0 && (
        <div className="card">
          <h3>Live Matches</h3>
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
          </div>
        </div>
      )}

      {isTeamFormat && completedMatches.length > 0 && (
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
          </div>
        </div>
      )}

      {isTeamFormat && upcomingMatches.length > 0 && (
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
          </div>
        </div>
      )}

      {isTeamFormat && matches.length === 0 && (
        <div className="card empty-state">
          <h3>No Matches Yet</h3>
          <p>Set up matches for this tournament in the tournament detail page</p>
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
