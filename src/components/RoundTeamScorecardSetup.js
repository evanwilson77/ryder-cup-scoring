import React, { useState } from 'react';
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import './RoundScorecardSetup.css';

function RoundTeamScorecardSetup({ round, tournament, onSave, onClose }) {
  const [selectedTeams, setSelectedTeams] = useState(round.teamScorecards?.map(sc => sc.teamId) || []);
  const [loading] = useState(false);

  const tournamentTeams = tournament.teams || [];

  const handleTeamToggle = (teamId) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    } else {
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedTeams(tournamentTeams.map(t => t.id));
  };

  const handleDeselectAll = () => {
    setSelectedTeams([]);
  };

  const handleSave = () => {
    if (selectedTeams.length === 0) {
      alert('Please select at least one team');
      return;
    }

    // Generate team scorecards for selected teams
    const teamScorecards = selectedTeams.map(teamId => {
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
      return {
        id: `team-scorecard-${teamId}-${Date.now()}`,
        teamId,
        teamName: team.name,
        teamColor: team.color,
        holes: Array.from({ length: 18 }, (_, i) => ({
          holeNumber: i + 1,
          grossScore: null,
          netScore: null,
          stablefordPoints: null
        })),
        totalGross: null,
        totalNet: null,
        totalStableford: null,
        status: 'not_started',
        createdAt: new Date().toISOString()
      };
    });

    onSave({ teamScorecards });
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
            <h2>Setup Team Scorecards for {round.name}</h2>
            <p className="modal-subtitle">
              Select teams to generate scorecards
            </p>
          </div>
          <button onClick={onClose} className="modal-close">
            <XMarkIcon className="icon" />
          </button>
        </div>

        <div className="modal-body">
          {/* Round Info - Compact at top */}
          <div className="round-info-compact">
            <span><strong>Course:</strong> {round.courseName || 'Not set'}</span>
            <span><strong>Par:</strong> {round.courseData?.totalPar || 'Not set'}</span>
            <span><strong>Date:</strong> {new Date(round.date).toLocaleDateString()}</span>
            <span><strong>Format:</strong> {round.format?.replace(/_/g, ' ') || 'Not set'}</span>
          </div>

          {/* Selection Controls */}
          <div className="selection-controls">
            <div className="selection-info">
              <UserGroupIcon className="info-icon" />
              <span>{selectedTeams.length} of {tournamentTeams.length} teams selected</span>
            </div>
            <div className="selection-buttons">
              <button onClick={handleSelectAll} className="button secondary small">
                Select All
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
            ) : (
              tournamentTeams.map(team => (
                <label
                  key={team.id}
                  className={`player-checkbox-item ${selectedTeams.includes(team.id) ? 'selected' : ''}`}
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
                      <span className="player-name">{team.name}</span>
                    </div>
                    <span className="player-handicap">{team.players?.length || 0} player{team.players?.length !== 1 ? 's' : ''}</span>
                  </div>
                </label>
              ))
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
            Generate {selectedTeams.length} Team Scorecard{selectedTeams.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoundTeamScorecardSetup;
