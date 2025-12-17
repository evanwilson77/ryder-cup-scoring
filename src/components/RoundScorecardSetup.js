import React, { useState, useEffect } from 'react';
import { subscribeToPlayers } from '../firebase/services';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import './RoundScorecardSetup.css';

function RoundScorecardSetup({ round, tournament, onSave, onClose }) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('add'); // 'add' or 'replace'

  useEffect(() => {
    const unsubPlayers = subscribeToPlayers((playersData) => {
      setPlayers(playersData);
      setLoading(false);
    });

    return () => unsubPlayers();
  }, []);

  // Filter tournament players
  const tournamentPlayers = players.filter(p =>
    tournament.players.includes(p.id)
  );

  // Analyze existing scorecards
  const existingScorecards = round.scorecards || [];
  const playersWithScorecards = existingScorecards.map(sc => sc.playerId);
  const inProgressScorecards = existingScorecards.filter(sc => {
    // Check if any hole has a score
    return sc.status !== 'not_started' || sc.holes?.some(h => h.grossScore !== null);
  });
  const hasInProgressData = inProgressScorecards.length > 0;

  // Available players (those without scorecards)
  const availablePlayers = tournamentPlayers.filter(p =>
    !playersWithScorecards.includes(p.id)
  );

  // Set initial selection based on mode
  useEffect(() => {
    if (hasInProgressData) {
      // If there are in-progress scorecards, only allow adding new players
      setMode('add');
      setSelectedPlayers([]);
    } else if (existingScorecards.length > 0) {
      // If scorecards exist but none are in progress, default to current players
      setMode('replace');
      setSelectedPlayers(playersWithScorecards);
    } else {
      // No scorecards exist, default to all players
      setMode('add');
      setSelectedPlayers(tournamentPlayers.map(p => p.id));
    }
  }, [players.length, existingScorecards.length]);

  const handlePlayerToggle = (playerId) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const handleSelectAll = () => {
    if (mode === 'add' && hasInProgressData) {
      // In add mode with in-progress data, only select available players
      setSelectedPlayers(availablePlayers.map(p => p.id));
    } else {
      setSelectedPlayers(tournamentPlayers.map(p => p.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedPlayers([]);
  };

  const handleSave = () => {
    if (selectedPlayers.length === 0) {
      alert('Please select at least one player');
      return;
    }

    // In replace mode with existing scorecards, show confirmation
    if (mode === 'replace' && existingScorecards.length > 0) {
      const confirmed = window.confirm(
        `This will replace ${existingScorecards.length} existing scorecard(s).\n\n` +
        `Are you sure you want to continue?`
      );
      if (!confirmed) return;
    }

    // Generate scorecards for selected players
    const newScorecards = selectedPlayers.map(playerId => {
      const player = players.find(p => p.id === playerId);
      return {
        id: `scorecard-${playerId}-${Date.now()}`,
        playerId,
        playerName: player.name,
        playerHandicap: player.handicap,
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
    let finalScorecards;
    if (mode === 'add' && hasInProgressData) {
      // Add mode: Keep existing in-progress scorecards and add new ones
      finalScorecards = [...inProgressScorecards, ...newScorecards];
    } else {
      // Replace mode: Use new scorecards only
      finalScorecards = newScorecards;
    }

    onSave({ scorecards: finalScorecards });
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
              {hasInProgressData ? 'Add More Scorecards' : existingScorecards.length > 0 ? 'Manage Scorecards' : 'Setup Scorecards'} for {round.name}
            </h2>
            <p className="modal-subtitle">
              {hasInProgressData
                ? 'Some scorecards are already in progress. You can only add new players.'
                : existingScorecards.length > 0
                  ? 'Scorecards exist but have not been started. You can replace them or add more players.'
                  : 'Select players to generate scorecards for this round'}
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
              <strong>⚠ Protection Active:</strong> {inProgressScorecards.length} scorecard(s) have scores and cannot be modified.
              You can only add scorecards for players who don't have one yet.
            </div>
          )}

          {existingScorecards.length > 0 && !hasInProgressData && (
            <div className="status-banner info">
              <strong>ℹ Existing Scorecards:</strong> {existingScorecards.length} scorecard(s) exist but have not been started.
              Generating new scorecards will replace the existing ones.
            </div>
          )}

          {/* Round Info - Compact at top */}
          <div className="round-info-compact">
            <span><strong>Course:</strong> {round.courseName || 'Not set'}</span>
            <span><strong>Par:</strong> {round.courseData?.totalPar || 'Not set'}</span>
            <span><strong>Date:</strong> {new Date(round.date).toLocaleDateString()}</span>
          </div>

          {/* Existing Scorecards (if in-progress) */}
          {hasInProgressData && inProgressScorecards.length > 0 && (
            <div className="existing-scorecards-section">
              <h4>In Progress Scorecards (Protected)</h4>
              <div className="existing-scorecards-list">
                {inProgressScorecards.map(sc => {
                  const player = players.find(p => p.id === sc.playerId);
                  const holesCompleted = sc.holes?.filter(h => h.grossScore !== null).length || 0;
                  return (
                    <div key={sc.id} className="existing-scorecard-item">
                      <div className="player-name">{player?.name || sc.playerName}</div>
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
              <UserIcon className="info-icon" />
              <span>
                {selectedPlayers.length} of {hasInProgressData ? availablePlayers.length : tournamentPlayers.length} players selected
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

          {/* Players List */}
          <div className="players-checklist">
            {tournamentPlayers.length === 0 ? (
              <div className="empty-state">
                <p>No players found in this tournament.</p>
              </div>
            ) : hasInProgressData && availablePlayers.length === 0 ? (
              <div className="empty-state">
                <p>All players already have scorecards for this round.</p>
              </div>
            ) : (
              (hasInProgressData ? availablePlayers : tournamentPlayers).map(player => {
                const hasScorecard = playersWithScorecards.includes(player.id);
                return (
                  <label
                    key={player.id}
                    className={`player-checkbox-item ${selectedPlayers.includes(player.id) ? 'selected' : ''} ${hasScorecard && !hasInProgressData ? 'has-scorecard' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => handlePlayerToggle(player.id)}
                    />
                    <div className="player-info">
                      <span className="player-name">
                        {player.name}
                        {hasScorecard && !hasInProgressData && <span className="badge">Has Scorecard</span>}
                      </span>
                      <span className="player-handicap">HCP: {player.handicap.toFixed(1)}</span>
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
            disabled={selectedPlayers.length === 0}
          >
            {hasInProgressData
              ? `Add ${selectedPlayers.length} Scorecard${selectedPlayers.length !== 1 ? 's' : ''}`
              : `Generate ${selectedPlayers.length} Scorecard${selectedPlayers.length !== 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoundScorecardSetup;
