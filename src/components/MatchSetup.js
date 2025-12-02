import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  subscribeToTeams,
  subscribeToPlayers,
  subscribeToMatches,
  addMatch,
  deleteMatch
} from '../firebase/services';
import './MatchSetup.css';

function MatchSetup() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [newMatch, setNewMatch] = useState({
    format: 'singles',
    team1Players: [],
    team2Players: [],
    name: ''
  });

  useEffect(() => {
    const unsubTeams = subscribeToTeams(setTeams);
    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubMatches = subscribeToMatches(setMatches);

    return () => {
      unsubTeams();
      unsubPlayers();
      unsubMatches();
    };
  }, []);

  const getTeamPlayers = (teamId) => {
    return players.filter(p => p.teamId === teamId);
  };

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  const handleAddMatch = async (e) => {
    e.preventDefault();

    // Validate based on format
    const requiredPlayers = newMatch.format === 'singles' ? 1 : 2;
    if (newMatch.team1Players.length !== requiredPlayers ||
        newMatch.team2Players.length !== requiredPlayers) {
      alert(`Please select ${requiredPlayers} player(s) from each team`);
      return;
    }

    // Generate match name if not provided
    let matchName = newMatch.name;
    if (!matchName) {
      const team1 = teams.find(t => t.id === 'team1');
      const team2 = teams.find(t => t.id === 'team2');
      const formatName = newMatch.format.charAt(0).toUpperCase() + newMatch.format.slice(1);
      matchName = `${formatName} - ${team1?.name} vs ${team2?.name}`;
    }

    await addMatch({
      ...newMatch,
      name: matchName,
      holeScores: Array(18).fill(null).map(() => ({
        team1Score: null,
        team2Score: null,
        winner: null
      })),
      currentHole: 1,
      status: 'not_started'
    });

    setNewMatch({
      format: 'singles',
      team1Players: [],
      team2Players: [],
      name: ''
    });
    setShowAddMatch(false);
  };

  const handleDeleteMatch = async (matchId) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      await deleteMatch(matchId);
    }
  };

  const handlePlayerSelect = (team, playerId) => {
    const field = team === 'team1' ? 'team1Players' : 'team2Players';
    const currentPlayers = newMatch[field];
    const maxPlayers = newMatch.format === 'singles' ? 1 : 2;

    if (currentPlayers.includes(playerId)) {
      // Remove player
      setNewMatch({
        ...newMatch,
        [field]: currentPlayers.filter(id => id !== playerId)
      });
    } else if (currentPlayers.length < maxPlayers) {
      // Add player
      setNewMatch({
        ...newMatch,
        [field]: [...currentPlayers, playerId]
      });
    }
  };

  const getMatchStatusBadge = (match) => {
    switch (match.status) {
      case 'not_started':
        return <span className="status-badge not-started">Not Started</span>;
      case 'in_progress':
        return <span className="status-badge in-progress">In Progress</span>;
      case 'completed':
        return <span className="status-badge completed">Completed</span>;
      default:
        return null;
    }
  };

  // Get players who are already in scheduled or in-progress singles matches
  const getPlayersInActiveSinglesMatches = () => {
    const activeSinglesMatches = matches.filter(
      m => (m.status === 'not_started' || m.status === 'in_progress') && m.format === 'singles'
    );

    const playerIds = new Set();
    activeSinglesMatches.forEach(match => {
      match.team1Players.forEach(id => playerIds.add(id));
      match.team2Players.forEach(id => playerIds.add(id));
    });

    return playerIds;
  };

  // Check if a player is available for selection (only for singles matches)
  const isPlayerAvailable = (playerId) => {
    if (newMatch.format !== 'singles') {
      return true; // No restrictions for foursomes/fourball
    }

    const playersInActiveSingles = getPlayersInActiveSinglesMatches();
    return !playersInActiveSingles.has(playerId);
  };

  const team1 = teams.find(t => t.id === 'team1');
  const team2 = teams.find(t => t.id === 'team2');
  const team1Players = getTeamPlayers('team1');
  const team2Players = getTeamPlayers('team2');

  return (
    <div className="match-setup">
      <div className="card">
        <div className="header-row">
          <div>
            <h2>Match Setup</h2>
            <p className="description">Create and manage matches for your tournament</p>
          </div>
          <button className="button" onClick={() => setShowAddMatch(true)}>
            + Create Match
          </button>
        </div>
      </div>

      <div className="matches-list">
        {matches.length === 0 ? (
          <div className="card empty-state">
            <p>No matches created yet. Click "Create Match" to get started!</p>
          </div>
        ) : (
          matches.map(match => (
            <div key={match.id} className={`card match-card ${match.status.replace('_', '-')}`}>
              <div className="match-header">
                <div>
                  <h3>{match.name}</h3>
                  <span className="format-badge">{match.format}</span>
                  {getMatchStatusBadge(match)}
                </div>
                <div className="match-actions">
                  {match.status !== 'completed' && (
                    <button
                      className="button small"
                      onClick={() => navigate(`/scoring/${match.id}`)}
                    >
                      {match.status === 'not_started' ? 'Start Scoring' : 'Continue Scoring'}
                    </button>
                  )}
                  <button
                    className="button small danger"
                    onClick={() => handleDeleteMatch(match.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="match-details">
                <div className="team-lineup">
                  <div className="team-side" style={{ borderLeftColor: team1?.color }}>
                    <h4 style={{ color: team1?.color }}>{team1?.name}</h4>
                    <ul>
                      {match.team1Players?.map(playerId => (
                        <li key={playerId}>{getPlayerName(playerId)}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="vs">VS</div>

                  <div className="team-side" style={{ borderLeftColor: team2?.color }}>
                    <h4 style={{ color: team2?.color }}>{team2?.name}</h4>
                    <ul>
                      {match.team2Players?.map(playerId => (
                        <li key={playerId}>{getPlayerName(playerId)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddMatch && (
        <div className="modal-overlay" onClick={() => setShowAddMatch(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Match</h3>

            <form onSubmit={handleAddMatch}>
              <div className="input-group">
                <label>Match Format</label>
                <select
                  value={newMatch.format}
                  onChange={(e) => setNewMatch({
                    ...newMatch,
                    format: e.target.value,
                    team1Players: [],
                    team2Players: []
                  })}
                >
                  <option value="singles">Singles (1v1)</option>
                  <option value="foursomes">Foursomes (2v2 Alternate Shot)</option>
                  <option value="fourball">Four-ball (2v2 Best Ball)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Match Name (Optional)</label>
                <input
                  type="text"
                  value={newMatch.name}
                  onChange={(e) => setNewMatch({ ...newMatch, name: e.target.value })}
                  placeholder="e.g., Morning Singles Round 1"
                />
              </div>

              <div className="player-selection">
                <div className="team-selection">
                  <h4 style={{ color: team1?.color }}>{team1?.name}</h4>
                  <p className="selection-hint">
                    Select {newMatch.format === 'singles' ? '1 player' : '2 players'}
                  </p>
                  <div className="player-checkboxes">
                    {team1Players.map(player => {
                      const available = isPlayerAvailable(player.id);
                      return (
                        <label
                          key={player.id}
                          className={`player-checkbox ${!available ? 'disabled' : ''}`}
                          title={!available ? 'Player is already scheduled in another singles match' : ''}
                        >
                          <input
                            type="checkbox"
                            checked={newMatch.team1Players.includes(player.id)}
                            onChange={() => handlePlayerSelect('team1', player.id)}
                            disabled={!available}
                          />
                          <span>
                            {player.name} (HCP: {player.handicap})
                            {!available && <span className="unavailable-badge">In Match</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="team-selection">
                  <h4 style={{ color: team2?.color }}>{team2?.name}</h4>
                  <p className="selection-hint">
                    Select {newMatch.format === 'singles' ? '1 player' : '2 players'}
                  </p>
                  <div className="player-checkboxes">
                    {team2Players.map(player => {
                      const available = isPlayerAvailable(player.id);
                      return (
                        <label
                          key={player.id}
                          className={`player-checkbox ${!available ? 'disabled' : ''}`}
                          title={!available ? 'Player is already scheduled in another singles match' : ''}
                        >
                          <input
                            type="checkbox"
                            checked={newMatch.team2Players.includes(player.id)}
                            onChange={() => handlePlayerSelect('team2', player.id)}
                            disabled={!available}
                          />
                          <span>
                            {player.name} (HCP: {player.handicap})
                            {!available && <span className="unavailable-badge">In Match</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowAddMatch(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button">
                  Create Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchSetup;
