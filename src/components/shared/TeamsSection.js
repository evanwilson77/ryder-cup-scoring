import React from 'react';
import PropTypes from 'prop-types';
import { PencilIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import './TeamsSection.css';

/**
 * Teams section component
 * Displays tournament teams with player assignments
 */
function TeamsSection({ teams, players, onEditTeams }) {
  return (
    <div className="card teams-section">
      <div className="section-header">
        <div>
          <h2>Teams</h2>
          <p className="section-subtitle">Manage team configuration and player assignments</p>
        </div>
        <button onClick={onEditTeams} className="button secondary small">
          <PencilIcon className="icon" />
          Edit Teams
        </button>
      </div>

      {teams && teams.length > 0 ? (
        <div className="teams-grid">
          {teams.map((team) => {
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
          <button onClick={onEditTeams} className="button primary">
            <UserGroupIcon className="icon" />
            Setup Teams
          </button>
        </div>
      )}
    </div>
  );
}

TeamsSection.propTypes = {
  /** Array of team objects */
  teams: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      players: PropTypes.arrayOf(PropTypes.string)
    })
  ),
  /** Array of player objects */
  players: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      handicap: PropTypes.number
    })
  ).isRequired,
  /** Callback when edit teams button is clicked */
  onEditTeams: PropTypes.func.isRequired
};

export default TeamsSection;
