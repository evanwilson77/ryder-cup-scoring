import React, { useEffect, useState } from 'react';
import {
  subscribeToTeams,
  subscribeToPlayers,
  addPlayer,
  updatePlayer,
  deletePlayer,
  updateTeam
} from '../firebase/services';
import './TeamManagement.css';

function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    handicap: 0,
    teamId: ''
  });

  useEffect(() => {
    const unsubscribeTeams = subscribeToTeams(setTeams);
    const unsubscribePlayers = subscribeToPlayers(setPlayers);

    return () => {
      unsubscribeTeams();
      unsubscribePlayers();
    };
  }, []);

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (newPlayer.name && newPlayer.teamId) {
      await addPlayer({
        ...newPlayer,
        handicap: parseInt(newPlayer.handicap) || 0
      });
      setNewPlayer({ name: '', handicap: 0, teamId: '' });
      setShowAddPlayer(false);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      await deletePlayer(playerId);
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
                        onClick={() => handleDeletePlayer(player.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                className="button small"
                onClick={() => {
                  setNewPlayer({ ...newPlayer, teamId: team.id });
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
            <h3>Add New Player</h3>
            <form onSubmit={handleAddPlayer}>
              <div className="input-group">
                <label>Player Name</label>
                <input
                  type="text"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label>Handicap</label>
                <input
                  type="number"
                  value={newPlayer.handicap}
                  onChange={(e) => setNewPlayer({ ...newPlayer, handicap: e.target.value })}
                  min="0"
                  max="54"
                  required
                />
              </div>

              <div className="input-group">
                <label>Team</label>
                <select
                  value={newPlayer.teamId}
                  onChange={(e) => setNewPlayer({ ...newPlayer, teamId: e.target.value })}
                  required
                >
                  <option value="">Select a team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="button secondary" onClick={() => setShowAddPlayer(false)}>
                  Cancel
                </button>
                <button type="submit" className="button">
                  Add Player
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
