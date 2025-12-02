import React, { useState, useEffect } from 'react';
import { subscribeToPlayers } from '../firebase/services';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import './RoundScorecardSetup.css';

function RoundScorecardSetup({ round, tournament, onSave, onClose }) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState(round.scorecards?.map(sc => sc.playerId) || []);
  const [loading, setLoading] = useState(true);

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

  const handlePlayerToggle = (playerId) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedPlayers(tournamentPlayers.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedPlayers([]);
  };

  const handleSave = () => {
    if (selectedPlayers.length === 0) {
      alert('Please select at least one player');
      return;
    }

    // Generate scorecards for selected players
    const scorecards = selectedPlayers.map(playerId => {
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
        totalGross: null,
        totalNet: null,
        totalStableford: null,
        status: 'not_started',
        createdAt: new Date().toISOString()
      };
    });

    onSave({ scorecards });
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
            <h2>Setup Scorecards for {round.name}</h2>
            <p className="modal-subtitle">
              Select players to generate scorecards
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
          </div>

          {/* Selection Controls */}
          <div className="selection-controls">
            <div className="selection-info">
              <UserIcon className="info-icon" />
              <span>{selectedPlayers.length} of {tournamentPlayers.length} players selected</span>
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

          {/* Players List */}
          <div className="players-checklist">
            {tournamentPlayers.length === 0 ? (
              <div className="empty-state">
                <p>No players found in this tournament.</p>
              </div>
            ) : (
              tournamentPlayers.map(player => (
                <label
                  key={player.id}
                  className={`player-checkbox-item ${selectedPlayers.includes(player.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayers.includes(player.id)}
                    onChange={() => handlePlayerToggle(player.id)}
                  />
                  <div className="player-info">
                    <span className="player-name">{player.name}</span>
                    <span className="player-handicap">HCP: {player.handicap.toFixed(1)}</span>
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
            disabled={selectedPlayers.length === 0}
          >
            Generate {selectedPlayers.length} Scorecard{selectedPlayers.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoundScorecardSetup;
