import React, { useState, useEffect } from 'react';
import { subscribeToPlayers } from '../firebase/services';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import './RoundMatchSetup.css';

function RoundMatchSetup({ round, tournament, onSave, onClose }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState(round.matches || []);
  const [loading, setLoading] = useState(true);

  const isIndividualTournament = !tournament.hasTeams;

  useEffect(() => {
    const unsubPlayers = subscribeToPlayers((playersData) => {
      setPlayers(playersData);
      setLoading(false);
    });

    return () => unsubPlayers();
  }, []);

  // Get tournament players for individual tournaments
  const tournamentPlayers = isIndividualTournament
    ? players.filter(p => tournament.players?.includes(p.id))
    : [];

  // Get team data from tournament (teams is an array) - for team tournaments
  const team1 = tournament.teams?.[0];
  const team2 = tournament.teams?.[1];

  // Filter players by team - for team tournaments
  const getTeamPlayers = (teamIndex) => {
    const teamData = tournament.teams?.[teamIndex];
    if (!teamData || !teamData.players) return [];
    return teamData.players
      .map(playerId => players.find(p => p.id === playerId))
      .filter(Boolean);
  };

  const team1Players = getTeamPlayers(0);
  const team2Players = getTeamPlayers(1);

  // Check if a player is already assigned to a match
  const isPlayerAssigned = (playerId) => {
    if (isIndividualTournament) {
      return matches.some(match =>
        match.player1 === playerId ||
        match.player2 === playerId ||
        match.partnership1?.includes(playerId) ||
        match.partnership2?.includes(playerId)
      );
    }
    return matches.some(match =>
      match.team1Players?.includes(playerId) ||
      match.team2Players?.includes(playerId)
    );
  };

  // Get available players for a team (team tournaments)
  const getAvailablePlayers = (teamKey) => {
    const teamPlayers = teamKey === 'team1' ? team1Players : team2Players;
    return teamPlayers.filter(p => !isPlayerAssigned(p.id));
  };

  // Get available players for individual tournaments
  const getAvailableIndividualPlayers = () => {
    return tournamentPlayers.filter(p => !isPlayerAssigned(p.id));
  };

  const handleAddMatch = () => {
    const baseMatch = {
      id: `match-${Date.now()}`,
      matchNumber: matches.length + 1,
      format: round.format === 'match_play_singles' ? 'singles' : 'singles', // Default to singles
      status: 'setup',
      tournamentId: tournament.id,
      roundId: round.id,
      name: `Match ${matches.length + 1}`,
      holeScores: Array(18).fill({}),
      currentHole: 1
    };

    const newMatch = isIndividualTournament
      ? {
          ...baseMatch,
          player1: null,
          player2: null,
          partnership1: [],
          partnership2: []
        }
      : {
          ...baseMatch,
          team1Players: [],
          team2Players: []
        };

    setMatches([...matches, newMatch]);
  };

  const handleDeleteMatch = (matchId) => {
    setMatches(matches.filter(m => m.id !== matchId));
    // Renumber remaining matches
    setMatches(prev => prev.map((m, idx) => ({
      ...m,
      matchNumber: idx + 1
    })));
  };

  const handleMatchFormatChange = (matchId, format) => {
    setMatches(matches.map(m => {
      if (m.id === matchId) {
        // Reset players when format changes
        if (isIndividualTournament) {
          return {
            ...m,
            format,
            player1: null,
            player2: null,
            partnership1: [],
            partnership2: []
          };
        }
        return {
          ...m,
          format,
          team1Players: [],
          team2Players: []
        };
      }
      return m;
    }));
  };

  const handlePlayerAssignment = (matchId, team, playerSlot, playerId) => {
    setMatches(matches.map(m => {
      if (m.id === matchId) {
        const teamKey = team === 1 ? 'team1Players' : 'team2Players';
        const updatedPlayers = [...m[teamKey]];

        if (playerId === '') {
          // Remove player
          updatedPlayers[playerSlot] = null;
        } else {
          // Assign player
          updatedPlayers[playerSlot] = playerId;
        }

        return {
          ...m,
          [teamKey]: updatedPlayers.filter(Boolean) // Remove nulls
        };
      }
      return m;
    }));
  };

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown';
  };

  // Individual tournament handlers
  const handleIndividualPlayerAssignment = (matchId, side, playerId) => {
    setMatches(matches.map(m => {
      if (m.id === matchId) {
        const playerKey = side === 1 ? 'player1' : 'player2';
        return {
          ...m,
          [playerKey]: playerId === '' ? null : playerId
        };
      }
      return m;
    }));
  };

  const handlePartnershipAssignment = (matchId, side, slot, playerId) => {
    setMatches(matches.map(m => {
      if (m.id === matchId) {
        const partnershipKey = side === 1 ? 'partnership1' : 'partnership2';
        const updatedPartnership = [...(m[partnershipKey] || [])];

        if (playerId === '') {
          updatedPartnership[slot] = null;
        } else {
          updatedPartnership[slot] = playerId;
        }

        return {
          ...m,
          [partnershipKey]: updatedPartnership.filter(Boolean) // Remove nulls
        };
      }
      return m;
    }));
  };

  const validateMatches = () => {
    // Check that all matches have the correct number of players
    for (const match of matches) {
      if (isIndividualTournament) {
        // For individual tournaments
        if (match.format === 'singles') {
          // Singles: Need player1 and player2
          if (!match.player1 || !match.player2) {
            return false;
          }
        } else {
          // Partnerships (fourball/foursomes): Need 2 players in each partnership
          if ((match.partnership1?.length || 0) !== 2 ||
              (match.partnership2?.length || 0) !== 2) {
            return false;
          }
        }
      } else {
        // For team tournaments
        const requiredPlayers = match.format === 'singles' ? 1 : 2;
        if (match.team1Players.length !== requiredPlayers ||
            match.team2Players.length !== requiredPlayers) {
          return false;
        }

        // Validate that all team1 players are actually on team1
        for (const playerId of match.team1Players) {
          if (!team1?.players?.includes(playerId)) {
            return false;
          }
        }

        // Validate that all team2 players are actually on team2
        for (const playerId of match.team2Players) {
          if (!team2?.players?.includes(playerId)) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSave = () => {
    if (!validateMatches()) {
      alert(
        'Please ensure all matches are valid:\n' +
        '- All matches must have the correct number of players\n' +
        '- All players must be on the correct team\n\n' +
        'If a player was moved to a different team, please remove them from this match and select a current team member.'
      );
      return;
    }

    onSave({ matches });
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content round-match-setup-modal">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content round-match-setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Setup Matches for {round.name}</h2>
            <p className="modal-subtitle">
              Assign players to matches for this round
            </p>
          </div>
          <button onClick={onClose} className="modal-close">
            <XMarkIcon className="icon" />
          </button>
        </div>

        <div className="modal-body">
          {/* Tournament Info Header */}
          {isIndividualTournament ? (
            <div className="individual-tournament-header">
              <div className="tournament-info-badge">
                Individual Tournament - {tournamentPlayers.length} players available
              </div>
            </div>
          ) : (
            /* Team Headers */
            <div className="teams-header">
              <div className="team-header" style={{ borderColor: team1?.color }}>
                <h3>{team1?.name || 'Team 1'}</h3>
                <div className="team-stats">
                  {team1Players.length} players • {matches.filter(m => m.team1Players.length > 0).length} assigned
                </div>
              </div>
              <div className="team-header" style={{ borderColor: team2?.color }}>
                <h3>{team2?.name || 'Team 2'}</h3>
                <div className="team-stats">
                  {team2Players.length} players • {matches.filter(m => m.team2Players.length > 0).length} assigned
                </div>
              </div>
            </div>
          )}

          {/* Matches List */}
          <div className="matches-setup-list">
            {matches.length === 0 ? (
              <div className="empty-state">
                <p>No matches created yet. Click "Add Match" to get started.</p>
              </div>
            ) : (
              matches.map((match) => (
                <div key={match.id} className="match-setup-card">
                  <div className="match-setup-header">
                    <div className="match-number">Match {match.matchNumber}</div>
                    <div className="match-format-selector">
                      <label>Format:</label>
                      <select
                        value={match.format}
                        onChange={(e) => handleMatchFormatChange(match.id, e.target.value)}
                        className="format-select"
                      >
                        <option value="singles">Singles</option>
                        <option value="foursomes">Foursomes</option>
                        <option value="fourball">Fourball</option>
                      </select>
                    </div>
                    <button
                      onClick={() => handleDeleteMatch(match.id)}
                      className="button-icon-danger"
                      title="Delete match"
                    >
                      <XMarkIcon className="icon" />
                    </button>
                  </div>

                  <div className="match-setup-players">
                    {isIndividualTournament ? (
                      /* Individual Tournament Match Setup */
                      match.format === 'singles' ? (
                        /* Singles: Player vs Player */
                        <>
                          <div className="individual-player-select">
                            <label>Player 1</label>
                            <select
                              value={match.player1 || ''}
                              onChange={(e) => handleIndividualPlayerAssignment(match.id, 1, e.target.value)}
                              className="player-select"
                            >
                              <option value="">Select Player</option>
                              {getAvailableIndividualPlayers().map(player => (
                                <option key={player.id} value={player.id}>
                                  {player.name} (HCP: {player.handicap.toFixed(1)})
                                </option>
                              ))}
                              {match.player1 && !getAvailableIndividualPlayers().find(p => p.id === match.player1) && (
                                <option value={match.player1}>
                                  {getPlayerName(match.player1)}
                                </option>
                              )}
                            </select>
                          </div>

                          <div className="vs-divider">VS</div>

                          <div className="individual-player-select">
                            <label>Player 2</label>
                            <select
                              value={match.player2 || ''}
                              onChange={(e) => handleIndividualPlayerAssignment(match.id, 2, e.target.value)}
                              className="player-select"
                            >
                              <option value="">Select Player</option>
                              {getAvailableIndividualPlayers().map(player => (
                                <option key={player.id} value={player.id}>
                                  {player.name} (HCP: {player.handicap.toFixed(1)})
                                </option>
                              ))}
                              {match.player2 && !getAvailableIndividualPlayers().find(p => p.id === match.player2) && (
                                <option value={match.player2}>
                                  {getPlayerName(match.player2)}
                                </option>
                              )}
                            </select>
                          </div>
                        </>
                      ) : (
                        /* Partnerships: (Player + Player) vs (Player + Player) */
                        <>
                          <div className="partnership-select">
                            <label>Partnership 1</label>
                            {[0, 1].map((idx) => (
                              <select
                                key={`p1-${idx}`}
                                value={match.partnership1?.[idx] || ''}
                                onChange={(e) => handlePartnershipAssignment(match.id, 1, idx, e.target.value)}
                                className="player-select"
                              >
                                <option value="">Select Player {idx + 1}</option>
                                {getAvailableIndividualPlayers().map(player => (
                                  <option key={player.id} value={player.id}>
                                    {player.name} (HCP: {player.handicap.toFixed(1)})
                                  </option>
                                ))}
                                {match.partnership1?.[idx] && !getAvailableIndividualPlayers().find(p => p.id === match.partnership1[idx]) && (
                                  <option value={match.partnership1[idx]}>
                                    {getPlayerName(match.partnership1[idx])}
                                  </option>
                                )}
                              </select>
                            ))}
                          </div>

                          <div className="vs-divider">VS</div>

                          <div className="partnership-select">
                            <label>Partnership 2</label>
                            {[0, 1].map((idx) => (
                              <select
                                key={`p2-${idx}`}
                                value={match.partnership2?.[idx] || ''}
                                onChange={(e) => handlePartnershipAssignment(match.id, 2, idx, e.target.value)}
                                className="player-select"
                              >
                                <option value="">Select Player {idx + 1}</option>
                                {getAvailableIndividualPlayers().map(player => (
                                  <option key={player.id} value={player.id}>
                                    {player.name} (HCP: {player.handicap.toFixed(1)})
                                  </option>
                                ))}
                                {match.partnership2?.[idx] && !getAvailableIndividualPlayers().find(p => p.id === match.partnership2[idx]) && (
                                  <option value={match.partnership2[idx]}>
                                    {getPlayerName(match.partnership2[idx])}
                                  </option>
                                )}
                              </select>
                            ))}
                          </div>
                        </>
                      )
                    ) : (
                      /* Team Tournament Match Setup */
                      <>
                        {/* Team 1 Players */}
                        <div className="team-players" style={{ borderLeftColor: team1?.color }}>
                          <div className="team-label">{team1?.name}</div>
                          {Array.from({ length: match.format === 'singles' ? 1 : 2 }).map((_, idx) => (
                            <select
                              key={`team1-${idx}`}
                              value={match.team1Players[idx] || ''}
                              onChange={(e) => handlePlayerAssignment(match.id, 1, idx, e.target.value)}
                              className="player-select"
                            >
                              <option value="">Select Player {idx + 1}</option>
                              {getAvailablePlayers('team1').map(player => (
                                <option key={player.id} value={player.id}>
                                  {player.name} (HCP: {player.handicap.toFixed(1)})
                                </option>
                              ))}
                              {/* Show currently assigned player even if unavailable, but ONLY if they're on the correct team */}
                              {match.team1Players[idx] &&
                               !getAvailablePlayers('team1').find(p => p.id === match.team1Players[idx]) &&
                               team1?.players?.includes(match.team1Players[idx]) && (
                                <option value={match.team1Players[idx]}>
                                  {getPlayerName(match.team1Players[idx])}
                                </option>
                              )}
                            </select>
                          ))}
                        </div>

                        <div className="vs-divider">VS</div>

                        {/* Team 2 Players */}
                        <div className="team-players" style={{ borderLeftColor: team2?.color }}>
                          <div className="team-label">{team2?.name}</div>
                          {Array.from({ length: match.format === 'singles' ? 1 : 2 }).map((_, idx) => (
                            <select
                              key={`team2-${idx}`}
                              value={match.team2Players[idx] || ''}
                              onChange={(e) => handlePlayerAssignment(match.id, 2, idx, e.target.value)}
                              className="player-select"
                            >
                              <option value="">Select Player {idx + 1}</option>
                              {getAvailablePlayers('team2').map(player => (
                                <option key={player.id} value={player.id}>
                                  {player.name} (HCP: {player.handicap.toFixed(1)})
                                </option>
                              ))}
                              {/* Show currently assigned player even if unavailable, but ONLY if they're on the correct team */}
                              {match.team2Players[idx] &&
                               !getAvailablePlayers('team2').find(p => p.id === match.team2Players[idx]) &&
                               team2?.players?.includes(match.team2Players[idx]) && (
                                <option value={match.team2Players[idx]}>
                                  {getPlayerName(match.team2Players[idx])}
                                </option>
                              )}
                            </select>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Match Button */}
          <div className="add-match-section">
            <button onClick={handleAddMatch} className="button primary">
              <PlusIcon className="icon" />
              Add Match
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="button primary"
            disabled={matches.length === 0 || !validateMatches()}
          >
            Save Match Setup
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoundMatchSetup;
