import React from 'react';
import PropTypes from 'prop-types';
import './TeamSetupStep.css';

/**
 * Team Setup Step Component
 * Third step in tournament creation - assigns players to teams (conditional - only for team tournaments)
 */
function TeamSetupStep({
  formData,
  errors,
  players,
  onTeamNameChange,
  onTeamColorChange,
  onAddPlayerToTeam,
  onRemovePlayerFromTeam
}) {
  return (
    <div className="form-step">
      <h2>Setup Teams</h2>
      <p className="step-subtitle">Assign players to teams for this tournament</p>

      {errors.teams && (
        <div className="error-banner">{errors.teams}</div>
      )}

      <div className="teams-setup">
        {formData.teams.map((team, teamIndex) => {
          const teamPlayers = players.filter(p => team.players.includes(p.id));
          const unassignedPlayers = players.filter(p =>
            formData.selectedPlayers.includes(p.id) &&
            !formData.teams.some(t => t.players.includes(p.id))
          );

          return (
            <div key={team.id} className="team-setup-card card">
              <div className="team-header">
                <div className="team-info">
                  <input
                    type="text"
                    value={team.name}
                    onChange={(e) => onTeamNameChange(team.id, e.target.value)}
                    className="team-name-input"
                    placeholder="Team Name"
                  />
                  <div className="team-color-picker">
                    <label>Color:</label>
                    <input
                      type="color"
                      value={team.color}
                      onChange={(e) => onTeamColorChange(team.id, e.target.value)}
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
                          <span className="player-handicap">HCP {player.handicap.toFixed(1)}</span>
                        </div>
                        <button
                          onClick={() => onRemovePlayerFromTeam(team.id, player.id)}
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

              {teamIndex === formData.teams.length - 1 && unassignedPlayers.length > 0 && (
                <div className="unassigned-section">
                  <h4>Unassigned Players</h4>
                  <div className="unassigned-players">
                    {unassignedPlayers.map(player => (
                      <div key={player.id} className="unassigned-player-item">
                        <div className="player-details">
                          <span className="player-name">{player.name}</span>
                          <span className="player-handicap">HCP {player.handicap.toFixed(1)}</span>
                        </div>
                        <div className="assign-buttons">
                          {formData.teams.map(t => (
                            <button
                              key={t.id}
                              onClick={() => onAddPlayerToTeam(t.id, player.id)}
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
  );
}

TeamSetupStep.propTypes = {
  /** Current form data */
  formData: PropTypes.shape({
    selectedPlayers: PropTypes.arrayOf(PropTypes.string).isRequired,
    teams: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
        players: PropTypes.arrayOf(PropTypes.string).isRequired
      })
    ).isRequired
  }).isRequired,
  /** Validation errors */
  errors: PropTypes.object.isRequired,
  /** Available players */
  players: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      handicap: PropTypes.number.isRequired
    })
  ).isRequired,
  /** Callback when team name changes */
  onTeamNameChange: PropTypes.func.isRequired,
  /** Callback when team color changes */
  onTeamColorChange: PropTypes.func.isRequired,
  /** Callback when a player is added to a team */
  onAddPlayerToTeam: PropTypes.func.isRequired,
  /** Callback when a player is removed from a team */
  onRemovePlayerFromTeam: PropTypes.func.isRequired
};

export default TeamSetupStep;
