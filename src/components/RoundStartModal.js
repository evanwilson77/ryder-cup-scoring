import React, { useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import './RoundStartModal.css';

/**
 * Modal for starting a tournament round with validation and configuration confirmation
 */
function RoundStartModal({ tournament, round, players, onStart, onClose }) {
  const [validationErrors, setValidationErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get player objects for the tournament
  const tournamentPlayers = tournament.players
    .map(playerId => players.find(p => p.id === playerId))
    .filter(Boolean);

  // Validate round configuration based on tournament format
  React.useEffect(() => {
    validateRoundConfiguration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateRoundConfiguration = () => {
    const errors = [];
    const warns = [];

    // Check if course is configured
    if (!round.courseData || !round.courseData.holes || round.courseData.holes.length === 0) {
      errors.push('Course is not configured. Please configure the course before starting the round.');
    } else if (round.courseData.holes.length < 18) {
      errors.push(`Course only has ${round.courseData.holes.length} holes configured. 18 holes required.`);
    }

    // Check player count and validate based on round format
    const playerCount = tournament.players.length;
    const roundFormat = round.format;

    switch (roundFormat) {
      case 'foursomes':
      case 'fourball':
      case 'singles':
        // Ryder Cup: needs teams with equal players
        if (!tournament.teams || tournament.teams.length !== 2) {
          errors.push('Ryder Cup format requires exactly 2 teams.');
        } else {
          const team1Count = tournament.teams[0].players.length;
          const team2Count = tournament.teams[1].players.length;

          if (team1Count === 0 || team2Count === 0) {
            errors.push('Both teams must have at least one player.');
          } else if (team1Count !== team2Count) {
            warns.push(`Teams have unequal players: ${tournament.teams[0].name} (${team1Count}) vs ${tournament.teams[1].name} (${team2Count}). Some players may sit out.`);
          }
        }
        break;

      case 'scramble':
        // Scramble/Ambrose: typically 2-4 players per team
        if (!tournament.teams || tournament.teams.length === 0) {
          errors.push('Scramble format requires teams to be configured.');
        } else {
          tournament.teams.forEach(team => {
            const teamPlayerCount = team.players.length;
            if (teamPlayerCount < 2) {
              errors.push(`${team.name} has less than 2 players. Scramble typically requires 2-4 players per team.`);
            } else if (teamPlayerCount > 4) {
              warns.push(`${team.name} has ${teamPlayerCount} players. Standard scramble is 2-4 players.`);
            } else if (teamPlayerCount === 3) {
              warns.push(`${team.name} has 3 players (non-standard). Continue if this is intentional.`);
            }
          });
        }
        break;

      case 'team_stableford':
      case 'best_ball':
      case 'shamble':
        // Team formats: need teams configured
        if (!tournament.teams || tournament.teams.length === 0) {
          errors.push(`${roundFormat.replace(/_/g, ' ')} format requires teams to be configured.`);
        } else {
          tournament.teams.forEach(team => {
            if (team.players.length === 0) {
              errors.push(`${team.name} has no players assigned.`);
            } else if (team.players.length === 1) {
              warns.push(`${team.name} has only 1 player. Team formats typically require 2+ players per team.`);
            }
          });
        }
        break;

      case 'individual_stableford':
      case 'multi_day':
        // Individual formats: just need players
        if (playerCount === 0) {
          errors.push('No players assigned to tournament.');
        }
        break;

      default:
        warns.push(`Unknown round format: ${roundFormat}. Please verify configuration.`);
    }

    setValidationErrors(errors);
    setWarnings(warns);
  };

  const handleStartRound = async () => {
    if (validationErrors.length > 0) {
      return; // Don't allow starting if there are errors
    }

    setLoading(true);
    try {
      await onStart(round);
    } catch (error) {
      console.error('Error starting round:', error);
      alert('Failed to start round. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canStart = validationErrors.length === 0 && !loading;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content round-start-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Start {round.name}</h2>
            <p className="modal-subtitle">Review configuration before starting</p>
          </div>
          <button onClick={onClose} className="close-button">
            <XMarkIcon className="icon" />
          </button>
        </div>

        <div className="modal-body">
          {/* Round Info */}
          <div className="config-section">
            <h3>Round Configuration</h3>
            <div className="config-grid">
              <div className="config-item">
                <span className="config-label">Date:</span>
                <span className="config-value">{new Date(round.date).toLocaleDateString()}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Course:</span>
                <span className="config-value">{round.courseName || 'Not set'}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Par:</span>
                <span className="config-value">{round.courseData?.totalPar || 'N/A'}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Round Format:</span>
                <span className="config-value capitalize">{round.format?.replace(/_/g, ' ') || 'Not set'}</span>
              </div>
            </div>
          </div>

          {/* Player/Team Summary */}
          <div className="config-section">
            <h3>Participants</h3>

            {tournament.teams && tournament.teams.length > 0 ? (
              <div className="teams-summary">
                {tournament.teams.map(team => {
                  const teamPlayers = team.players
                    .map(pid => players.find(p => p.id === pid))
                    .filter(Boolean);

                  return (
                    <div key={team.id} className="team-summary-card">
                      <div className="team-header" style={{ borderLeftColor: team.color }}>
                        <span className="team-name">{team.name}</span>
                        <span className="team-count">{teamPlayers.length} players</span>
                      </div>
                      <div className="team-players">
                        {teamPlayers.map(player => (
                          <div key={player.id} className="player-item">
                            <span className="player-name">{player.name}</span>
                            <span className="player-handicap">HCP {player.handicap.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="players-summary">
                {tournamentPlayers.map(player => (
                  <div key={player.id} className="player-item">
                    <span className="player-name">{player.name}</span>
                    <span className="player-handicap">HCP {player.handicap.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation Messages */}
          {validationErrors.length > 0 && (
            <div className="validation-section errors">
              <div className="validation-header">
                <XMarkIcon className="icon error-icon" />
                <h4>Cannot Start Round</h4>
              </div>
              <ul className="validation-list">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="validation-section warnings">
              <div className="validation-header">
                <ExclamationTriangleIcon className="icon warning-icon" />
                <h4>Warnings</h4>
              </div>
              <ul className="validation-list">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
              <p className="warning-note">You can proceed, but please verify this configuration is correct.</p>
            </div>
          )}

          {validationErrors.length === 0 && warnings.length === 0 && (
            <div className="validation-section success">
              <div className="validation-header">
                <CheckCircleIcon className="icon success-icon" />
                <h4>Ready to Start</h4>
              </div>
              <p>Configuration looks good. Ready to begin scoring.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button secondary" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleStartRound}
            className="button primary"
            disabled={!canStart}
          >
            {loading ? 'Starting...' : 'Start Round'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoundStartModal;
