import React, { useEffect, useState } from 'react';
import {
  subscribeToTeams,
  subscribeToPlayers,
  updatePlayer,
  updateTeam
} from '../firebase/services';
import './TeamManagement.css';

function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  useEffect(() => {
    const unsubscribeTeams = subscribeToTeams(setTeams);
    const unsubscribePlayers = subscribeToPlayers(setPlayers);

    return () => {
      unsubscribeTeams();
      unsubscribePlayers();
    };
  }, []);

  const [currentTeamId, setCurrentTeamId] = useState('');

  const handleAddPlayerToTeam = async (e) => {
    e.preventDefault();
    if (selectedPlayerId && currentTeamId) {
      // Update the selected player to assign them to this team
      await updatePlayer(selectedPlayerId, { teamId: currentTeamId });
      setSelectedPlayerId('');
      setCurrentTeamId('');
      setShowAddPlayer(false);
    }
  };

  const handleUpdatePlayer = async (playerId, updates) => {
    await updatePlayer(playerId, updates);
  };

  const handleUpdateTeamName = async (teamId, newName) => {
    await updateTeam(teamId, { name: newName });
    setEditingTeam(null);
  };

  const getTeamPlayers = (teamId) => {
    return players.filter(p => p.teamId === teamId).sort((a, b) => a.handicap - b.handicap);
  };

  const getAvailablePlayers = () => {
    // Players with no team assignment or not assigned to current team
    return players.filter(p => !p.teamId || p.teamId === null);
  };

  const handleRemovePlayerFromTeam = async (playerId) => {
    if (window.confirm('Remove this player from the team?')) {
      await updatePlayer(playerId, { teamId: null });
    }
  };

  return (
    <div className="team-management">
      <div className="card">
        <h2>Team & Player Management</h2>
        <p className="description">Manage your teams and players for the tournament</p>
      </div>

      <div className="teams-grid">
        {teams.map(team => {
          const teamPlayers = getTeamPlayers(team.id);
          return (
            <div key={team.id} className="team-card card">
              <div className="team-header" style={{ borderLeftColor: team.color }}>
                {editingTeam === team.id ? (
                  <input
                    type="text"
                    defaultValue={team.name}
                    onBlur={(e) => handleUpdateTeamName(team.id, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateTeamName(team.id, e.target.value);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <h3 onClick={() => setEditingTeam(team.id)} style={{ cursor: 'pointer' }}>
                    {team.name}
                  </h3>
                )}
                <span className="team-badge" style={{ backgroundColor: team.color }}>
                  {teamPlayers.length} players
                </span>
              </div>

              <div className="players-list">
                {teamPlayers.length === 0 ? (
                  <p className="empty-state">No players yet</p>
                ) : (
                  teamPlayers.map(player => (
                    <div key={player.id} className="player-item">
                      <div className="player-info">
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => handleUpdatePlayer(player.id, { name: e.target.value })}
                          className="player-name-input"
                        />
                        <div className="handicap-input">
                          <label>HCP:</label>
                          <input
                            type="number"
                            value={player.handicap}
                            onChange={(e) => handleUpdatePlayer(player.id, { handicap: parseInt(e.target.value) || 0 })}
                            min="0"
                            max="54"
                          />
                        </div>
                      </div>
                      <button
                        className="button danger small"
                        onClick={() => handleRemovePlayerFromTeam(player.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                className="button small"
                onClick={() => {
                  setCurrentTeamId(team.id);
                  setShowAddPlayer(true);
                }}
              >
                + Add Player
              </button>
            </div>
          );
        })}
      </div>

      {showAddPlayer && (
        <div className="modal-overlay" onClick={() => setShowAddPlayer(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Player to Team</h3>
            <form onSubmit={handleAddPlayerToTeam}>
              <div className="input-group">
                <label>Select Player</label>
                {getAvailablePlayers().length > 0 ? (
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    required
                    autoFocus
                  >
                    <option value="">Choose a player...</option>
                    {getAvailablePlayers().map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} (HCP: {player.handicap.toFixed(1)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="empty-state">
                    <p>All players are already assigned to teams.</p>
                    <p className="hint">Go to <a href="/players">Player Management</a> to add new players.</p>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="button secondary" onClick={() => {
                  setShowAddPlayer(false);
                  setSelectedPlayerId('');
                }}>
                  Cancel
                </button>
                <button type="submit" className="button" disabled={!selectedPlayerId}>
                  Add to Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManagement;
