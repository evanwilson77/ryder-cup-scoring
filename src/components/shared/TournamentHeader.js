import React from 'react';
import PropTypes from 'prop-types';
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckCircleIcon,
  CalendarIcon,
  UserGroupIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import './TournamentHeader.css';

/**
 * Tournament detail header component
 * Displays tournament title, stats, and actions
 */
function TournamentHeader({
  tournament,
  series = null,
  onBack,
  onCompleteTournament,
  onOpenEditModal
}) {
  const getStatusBadge = (status) => {
    const badges = {
      setup: { className: 'status-badge-setup', label: 'Setup' },
      in_progress: { className: 'status-badge-in-progress', label: 'In Progress' },
      completed: { className: 'status-badge-completed', label: 'Completed' }
    };
    return badges[status] || badges.setup;
  };

  const statusBadge = getStatusBadge(tournament.status);

  return (
    <div className="card detail-header">
      <button onClick={onBack} className="button secondary small">
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
            <span>{(tournament.hasTeams || (tournament.teams && tournament.teams.length > 0)) ? 'Team Tournament' : 'Individual Tournament'}</span>
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
          <button onClick={onCompleteTournament} className="button primary">
            <CheckCircleIcon className="icon" />
            Complete Tournament
          </button>
        )}
        <button onClick={onOpenEditModal} className="button secondary">
          <PencilIcon className="icon" />
          Edit Details
        </button>
      </div>
    </div>
  );
}

TournamentHeader.propTypes = {
  /** Tournament object with name, status, dates, etc */
  tournament: PropTypes.shape({
    name: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['setup', 'in_progress', 'completed']).isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    edition: PropTypes.string,
    hasTeams: PropTypes.bool,
    teams: PropTypes.array,
    players: PropTypes.array.isRequired,
    rounds: PropTypes.array
  }).isRequired,
  /** Series information (if tournament is part of a series) */
  series: PropTypes.shape({
    name: PropTypes.string.isRequired
  }),
  /** Callback when back button is clicked */
  onBack: PropTypes.func.isRequired,
  /** Callback when complete tournament button is clicked */
  onCompleteTournament: PropTypes.func.isRequired,
  /** Callback when edit details button is clicked */
  onOpenEditModal: PropTypes.func.isRequired
};

export default TournamentHeader;
