import React, { useState } from 'react';
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import './RoundScorecardSetup.css';

function RoundTeamScorecardSetup({ round, tournament, onSave, onClose }) {
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [loading] = useState(false);
  const [mode, setMode] = useState('add'); // 'add' or 'replace'

  const tournamentTeams = tournament.teams || [];

  // Analyze existing team scorecards
  const existingTeamScorecards = round.teamScorecards || [];
  const teamsWithScorecards = existingTeamScorecards.map(sc => sc.teamId);
  const inProgressTeamScorecards = existingTeamScorecards.filter(sc => {
    // Check if any hole has a score (check playerScores for shamble, holes for others)
    if (sc.playerScores) {
      return Object.values(sc.playerScores).some(playerHoles =>
        playerHoles.some(h => h.grossScore !== null)
      );
    }
    return sc.status !== 'not_started' || sc.holes?.some(h => h.grossScore !== null);
  });
  const hasInProgressData = inProgressTeamScorecards.length > 0;

  // Available teams (those without scorecards)
  const availableTeams = tournamentTeams.filter(t =>
    !teamsWithScorecards.includes(t.id)
  );

  // Set initial selection based on mode
  React.useEffect(() => {
    if (hasInProgressData) {
      // If there are in-progress scorecards, only allow adding new teams
      setMode('add');
      setSelectedTeams([]);
    } else if (existingTeamScorecards.length > 0) {
      // If scorecards exist but none are in progress, default to current teams
      setMode('replace');
      setSelectedTeams(teamsWithScorecards);
    } else {
      // No scorecards exist, default to all teams
      setMode('add');
      setSelectedTeams(tournamentTeams.map(t => t.id));
    }
  }, [tournamentTeams.length, existingTeamScorecards.length]);

  const handleTeamToggle = (teamId) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    } else {
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const handleSelectAll = () => {
    if (mode === 'add' && hasInProgressData) {
      // In add mode with in-progress data, only select available teams
      setSelectedTeams(availableTeams.map(t => t.id));
    } else {
      setSelectedTeams(tournamentTeams.map(t => t.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedTeams([]);
  };

  const handleSave = () => {
    if (selectedTeams.length === 0) {
      alert('Please select at least one team');
      return;
    }

    // In replace mode with existing scorecards, show confirmation
    if (mode === 'replace' && existingTeamScorecards.length > 0) {
      const confirmed = window.confirm(
        `This will replace ${existingTeamScorecards.length} existing team scorecard(s).\n\n` +
        `Are you sure you want to continue?`
      );
      if (!confirmed) return;
    }

    // Generate team scorecards for selected teams
    const newTeamScorecards = selectedTeams.map(teamId => {
      const team = tournamentTeams.find(t => t.id === teamId);

      // Shamble format requires playerScores structure
      if (round.format === 'shamble') {
        const playerScores = {};
        (team.players || []).forEach(playerId => {
          playerScores[playerId] = Array(18).fill(null).map((_, index) => ({
            holeNumber: index + 1,
            grossScore: null
          }));
        });

        return {
          id: `team-scorecard-${teamId}-${Date.now()}`,
          teamId,
          teamName: team.name,
          teamColor: team.color,
          playerScores, // Individual player scores for shamble
          driveSelections: Array(18).fill(null), // Track which player's drive was used
          holes: Array.from({ length: 18 }, (_, i) => ({
            holeNumber: i + 1,
            teamScore: null // Best score selected for this hole
          })),
          totalGross: null,
          status: 'not_started',
          createdAt: new Date().toISOString()
        };
      }

      // Standard team scorecard for other formats
      const playerScores = {};
      (team.players || []).forEach(playerId => {
        playerScores[playerId] = Array(18).fill(null).map((_, index) => ({
          holeNumber: index + 1,
          grossScore: null
        }));
      });

      return {
        id: `team-scorecard-${teamId}-${Date.now()}`,
        teamId,
        teamName: team.name,
        teamColor: team.color,
        playerScores, // Include player scores for all formats
        holes: Array.from({ length: 18 }, (_, i) => ({
          holeNumber: i + 1,
          grossScore: null,
          netScore: null,
          stablefordPoints: null
        })),
        totalGross: 0,
        totalNet: 0,
        totalPoints: 0,
        status: 'not_started',
        createdAt: new Date().toISOString()
      };
    });

    // Merge or replace based on mode
    let finalTeamScorecards;
    if (mode === 'add' && hasInProgressData) {
      // Add mode: Keep existing in-progress team scorecards and add new ones
      finalTeamScorecards = [...inProgressTeamScorecards, ...newTeamScorecards];
    } else {
      // Replace mode: Use new team scorecards only
      finalTeamScorecards = newTeamScorecards;
    }

    onSave({ teamScorecards: finalTeamScorecards });
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content round-scorecard-setup-modal">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content round-scorecard-setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>
              {hasInProgressData ? 'Add More Team Scorecards' : existingTeamScorecards.length > 0 ? 'Manage Team Scorecards' : 'Setup Team Scorecards'} for {round.name}
            </h2>
            <p className="modal-subtitle">
              {hasInProgressData
                ? 'Some team scorecards are already in progress. You can only add new teams.'
                : existingTeamScorecards.length > 0
                  ? 'Team scorecards exist but have not been started. You can replace them or add more teams.'
                  : 'Select teams to generate scorecards for this round'}
            </p>
          </div>
          <button onClick={onClose} className="modal-close">
            <XMarkIcon className="icon" />
          </button>
        </div>

        <div className="modal-body">
          {/* Status Banner */}
          {hasInProgressData && (
            <div className="status-banner warning">
              <strong>⚠ Protection Active:</strong> {inProgressTeamScorecards.length} team scorecard(s) have scores and cannot be modified.
              You can only add scorecards for teams that don't have one yet.
            </div>
          )}

          {existingTeamScorecards.length > 0 && !hasInProgressData && (
            <div className="status-banner info">
              <strong>ℹ Existing Scorecards:</strong> {existingTeamScorecards.length} team scorecard(s) exist but have not been started.
              Generating new scorecards will replace the existing ones.
            </div>
          )}

          {/* Round Info - Compact at top */}
          <div className="round-info-compact">
            <span><strong>Course:</strong> {round.courseName || 'Not set'}</span>
            <span><strong>Par:</strong> {round.courseData?.totalPar || 'Not set'}</span>
            <span><strong>Date:</strong> {new Date(round.date).toLocaleDateString()}</span>
            <span><strong>Format:</strong> {round.format?.replace(/_/g, ' ') || 'Not set'}</span>
          </div>

          {/* Existing Team Scorecards (if in-progress) */}
          {hasInProgressData && inProgressTeamScorecards.length > 0 && (
            <div className="existing-scorecards-section">
              <h4>In Progress Team Scorecards (Protected)</h4>
              <div className="existing-scorecards-list">
                {inProgressTeamScorecards.map(sc => {
                  const team = tournamentTeams.find(t => t.id === sc.teamId);
                  let holesCompleted = 0;
                  if (sc.playerScores) {
                    // Count holes where at least one player has scored
                    for (let i = 0; i < 18; i++) {
                      const hasScore = Object.values(sc.playerScores).some(playerHoles =>
                        playerHoles[i]?.grossScore !== null
                      );
                      if (hasScore) holesCompleted++;
                    }
                  }
                  return (
                    <div key={sc.id} className="existing-scorecard-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="team-color-dot" style={{
                          backgroundColor: team?.color,
                          width: '0.75rem',
                          height: '0.75rem',
                          borderRadius: '50%',
                          display: 'inline-block'
                        }}></span>
                        <div className="player-name">{team?.name || sc.teamName}</div>
                      </div>
                      <div className="scorecard-progress-text">
                        {holesCompleted}/18 holes • {sc.status === 'completed' ? 'Completed' : 'In Progress'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selection Controls */}
          <div className="selection-controls">
            <div className="selection-info">
              <UserGroupIcon className="info-icon" />
              <span>
                {selectedTeams.length} of {hasInProgressData ? availableTeams.length : tournamentTeams.length} teams selected
              </span>
            </div>
            <div className="selection-buttons">
              <button onClick={handleSelectAll} className="button secondary small">
                Select All {hasInProgressData ? 'Available' : ''}
              </button>
              <button onClick={handleDeselectAll} className="button secondary small">
                Deselect All
              </button>
            </div>
          </div>

          {/* Teams List */}
          <div className="players-checklist">
            {tournamentTeams.length === 0 ? (
              <div className="empty-state">
                <p>No teams configured in this tournament. Please set up teams first.</p>
              </div>
            ) : hasInProgressData && availableTeams.length === 0 ? (
              <div className="empty-state">
                <p>All teams already have scorecards for this round.</p>
              </div>
            ) : (
              (hasInProgressData ? availableTeams : tournamentTeams).map(team => {
                const hasScorecard = teamsWithScorecards.includes(team.id);
                return (
                  <label
                    key={team.id}
                    className={`player-checkbox-item ${selectedTeams.includes(team.id) ? 'selected' : ''} ${hasScorecard && !hasInProgressData ? 'has-scorecard' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTeams.includes(team.id)}
                      onChange={() => handleTeamToggle(team.id)}
                    />
                    <div className="player-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="team-color-dot" style={{
                          backgroundColor: team.color,
                          width: '1rem',
                          height: '1rem',
                          borderRadius: '50%',
                          display: 'inline-block',
                          border: '2px solid #cbd5e0'
                        }}></span>
                        <span className="player-name">
                          {team.name}
                          {hasScorecard && !hasInProgressData && <span className="badge">Has Scorecard</span>}
                        </span>
                      </div>
                      <span className="player-handicap">{team.players?.length || 0} player{team.players?.length !== 1 ? 's' : ''}</span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="button primary"
            disabled={selectedTeams.length === 0}
          >
            {hasInProgressData
              ? `Add ${selectedTeams.length} Team Scorecard${selectedTeams.length !== 1 ? 's' : ''}`
              : `Generate ${selectedTeams.length} Team Scorecard${selectedTeams.length !== 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoundTeamScorecardSetup;
