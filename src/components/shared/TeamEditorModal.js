import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './TeamEditorModal.css';

/**
 * Team Editor Modal Component
 * Allows editing team names, colors, and player assignments
 */
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

TeamEditorModal.propTypes = {
  /** Array of team objects */
  teams: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      players: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  ).isRequired,
  /** Array of all player objects */
  players: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      handicap: PropTypes.number
    })
  ).isRequired,
  /** Array of player IDs in this tournament */
  tournamentPlayers: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Callback when teams are saved */
  onSave: PropTypes.func.isRequired,
  /** Callback when modal is closed */
  onClose: PropTypes.func.isRequired
};

export default TeamEditorModal;
