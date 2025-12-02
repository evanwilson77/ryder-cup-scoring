import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTournamentSeries,
  createTournament
} from '../firebase/tournamentServices';
import { subscribeToPlayers } from '../firebase/services';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import FormatExplainerModal from './FormatExplainerModal';
import './TournamentCreation.css';

function TournamentCreation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [series, setSeries] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [configuringRoundId, setConfiguringRoundId] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    seriesId: null, // null for "No Series"
    name: '',
    edition: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    hasTeams: false, // Whether this tournament uses teams

    // Step 2: Players
    selectedPlayers: [],

    // Step 3: Teams (conditional - only if hasTeams is true)
    teams: [
      { id: 'team1', name: 'Team 1', color: '#DC2626', players: [] },
      { id: 'team2', name: 'Team 2', color: '#2563EB', players: [] }
    ],

    // Step 4: Rounds Configuration
    rounds: [],

    // Step 5: Notes
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const seriesData = await getTournamentSeries();
      setSeries(seriesData);

      const unsubscribePlayers = subscribeToPlayers((playersData) => {
        setPlayers(playersData);
        setLoading(false);
      });

      return () => unsubscribePlayers();
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  // Dynamic steps based on whether tournament has teams
  const getSteps = () => {
    const baseSteps = [
      { number: 1, title: 'Basic Information', description: 'Tournament details' },
      { number: 2, title: 'Select Players', description: 'Choose participants' }
    ];

    if (formData.hasTeams) {
      baseSteps.push({ number: 3, title: 'Setup Teams', description: 'Assign players to teams' });
      baseSteps.push({ number: 4, title: 'Configure Rounds', description: 'Setup rounds and formats' });
      baseSteps.push({ number: 5, title: 'Review & Create', description: 'Confirm details' });
    } else {
      baseSteps.push({ number: 3, title: 'Configure Rounds', description: 'Setup rounds and formats' });
      baseSteps.push({ number: 4, title: 'Review & Create', description: 'Confirm details' });
    }

    return baseSteps;
  };

  const steps = getSteps();

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Tournament name is required';
      }
      if (!formData.startDate) {
        newErrors.startDate = 'Start date is required';
      }
      if (!formData.endDate) {
        newErrors.endDate = 'End date is required';
      }
      if (formData.endDate < formData.startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (step === 2) {
      if (formData.selectedPlayers.length === 0) {
        newErrors.players = 'Please select at least one player';
      }
    }

    if (step === 3 && formData.hasTeams) {
      // Validate teams
      const allTeamPlayers = formData.teams.flatMap(t => t.players);
      const unassignedPlayers = formData.selectedPlayers.filter(p => !allTeamPlayers.includes(p));

      if (unassignedPlayers.length > 0) {
        newErrors.teams = `${unassignedPlayers.length} player(s) not assigned to any team`;
      }

      // Check that each team has at least one player
      const emptyTeams = formData.teams.filter(t => t.players.length === 0);
      if (emptyTeams.length > 0) {
        newErrors.teams = 'Each team must have at least one player';
      }
    }

    // Validate rounds configuration
    const roundsStep = formData.hasTeams ? 4 : 3;
    if (step === roundsStep) {
      if (formData.rounds.length === 0) {
        newErrors.rounds = 'Please configure at least one round';
      }
      // Ensure all rounds have a format set
      const roundsWithoutFormat = formData.rounds.filter(r => !r.format);
      if (roundsWithoutFormat.length > 0) {
        newErrors.rounds = 'Please set format for all rounds';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handlePlayerToggle = (playerId) => {
    setFormData(prev => ({
      ...prev,
      selectedPlayers: prev.selectedPlayers.includes(playerId)
        ? prev.selectedPlayers.filter(id => id !== playerId)
        : [...prev.selectedPlayers, playerId]
    }));
  };

  const handleSelectAllPlayers = () => {
    if (formData.selectedPlayers.length === players.length) {
      setFormData(prev => ({ ...prev, selectedPlayers: [] }));
    } else {
      setFormData(prev => ({ ...prev, selectedPlayers: players.map(p => p.id) }));
    }
  };

  const handleTeamNameChange = (teamId, newName) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.map(t => t.id === teamId ? { ...t, name: newName } : t)
    }));
  };

  const handleTeamColorChange = (teamId, newColor) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.map(t => t.id === teamId ? { ...t, color: newColor } : t)
    }));
  };

  const handleAddPlayerToTeam = (teamId, playerId) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.map(t => {
        if (t.id === teamId && !t.players.includes(playerId)) {
          return { ...t, players: [...t.players, playerId] };
        }
        // Remove player from other teams
        return { ...t, players: t.players.filter(p => p !== playerId) };
      })
    }));
  };

  const handleRemovePlayerFromTeam = (teamId, playerId) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.map(t =>
        t.id === teamId ? { ...t, players: t.players.filter(p => p !== playerId) } : t
      )
    }));
  };

  // Rounds handlers
  const handleGenerateRounds = () => {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const newRounds = [];
    for (let i = 0; i < daysDiff; i++) {
      const roundDate = new Date(startDate);
      roundDate.setDate(roundDate.getDate() + i);

      newRounds.push({
        id: `round${i + 1}`,
        roundNumber: i + 1,
        name: daysDiff === 1 ? 'Round 1' : `Round ${i + 1}`,
        date: roundDate.toISOString().split('T')[0],
        format: null // Will be set by user
      });
    }

    setFormData(prev => ({ ...prev, rounds: newRounds }));
  };

  const handleAddRound = () => {
    const newRoundNumber = formData.rounds.length + 1;
    const lastRoundDate = formData.rounds.length > 0
      ? formData.rounds[formData.rounds.length - 1].date
      : formData.startDate;

    setFormData(prev => ({
      ...prev,
      rounds: [...prev.rounds, {
        id: `round${newRoundNumber}`,
        roundNumber: newRoundNumber,
        name: `Round ${newRoundNumber}`,
        date: lastRoundDate,
        format: null // Will be set by user
      }]
    }));
  };

  const handleRemoveRound = (roundId) => {
    setFormData(prev => ({
      ...prev,
      rounds: prev.rounds.filter(r => r.id !== roundId).map((r, index) => ({
        ...r,
        roundNumber: index + 1,
        id: `round${index + 1}`
      }))
    }));
  };

  const handleUpdateRound = (roundId, field, value) => {
    setFormData(prev => ({
      ...prev,
      rounds: prev.rounds.map(r =>
        r.id === roundId ? { ...r, [field]: value } : r
      )
    }));
  };

  const handleOpenFormatModal = (roundId) => {
    setConfiguringRoundId(roundId);
    setShowFormatModal(true);
  };

  const handleSelectFormat = (formatId) => {
    if (configuringRoundId) {
      handleUpdateRound(configuringRoundId, 'format', formatId);
    }
    setShowFormatModal(false);
    setConfiguringRoundId(null);
  };

  const getFormatDisplayName = (formatId) => {
    const formatNames = {
      'individual_stroke': 'Individual Stroke Play',
      'individual_stableford': 'Individual Stableford',
      'match_play_singles': 'Match Play - Singles',
      'four_ball': 'Four-Ball (Better Ball)',
      'foursomes': 'Foursomes (Alternate Shot)',
      'scramble': 'Scramble / Ambrose',
      'best_ball': 'Best Ball (Stroke Play)',
      'team_stableford': 'Team Stableford',
      'shamble': 'Shamble'
    };
    return formatNames[formatId] || formatId;
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setCreating(true);
    try {
      // Validate that rounds exist
      if (!formData.rounds || formData.rounds.length === 0) {
        alert('Please configure at least one round before creating the tournament.');
        setCreating(false);
        return;
      }

      // Prepare rounds with full structure - omit null/undefined fields for Firebase
      const rounds = formData.rounds.map(round => {
        const roundData = {
          id: round.id,
          roundNumber: round.roundNumber,
          name: round.name,
          date: round.date,
          status: 'not_started',
          courseData: {
            holes: [], // Will be configured in tournament detail
            totalPar: 0
          },
          matches: [],
          scorecards: [],
          roundResults: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Add format if it exists (CRITICAL: rounds have formats, not tournaments)
        if (round.format) {
          roundData.format = round.format;
        }

        return roundData;
      });

      // Build tournament data, omitting null/undefined values
      const tournamentData = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        hasTeams: formData.hasTeams, // Whether this is a team or individual tournament
        players: formData.selectedPlayers,
        rounds: rounds,
        status: 'setup'
      };

      // Add optional fields only if they have actual values (not null, undefined, or empty string)
      if (formData.seriesId && formData.seriesId !== '') {
        tournamentData.seriesId = formData.seriesId;
      }
      if (formData.edition && formData.edition.trim() !== '') {
        tournamentData.edition = formData.edition;
      }
      if (formData.notes && formData.notes.trim() !== '') {
        tournamentData.notes = formData.notes;
      }

      // Add teams only for team formats
      if (formData.hasTeams) {
        tournamentData.teams = formData.teams;
      }

      // Log what we're about to send for debugging
      console.log('Creating tournament with data:', JSON.stringify(tournamentData, null, 2));

      // Validate no undefined values before sending
      const checkForUndefined = (obj, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (value === undefined) {
            console.error(`Found undefined at ${currentPath}`);
            throw new Error(`Invalid data: ${currentPath} is undefined`);
          }
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            checkForUndefined(value, currentPath);
          }
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (item && typeof item === 'object') {
                checkForUndefined(item, `${currentPath}[${index}]`);
              } else if (item === undefined) {
                console.error(`Found undefined at ${currentPath}[${index}]`);
                throw new Error(`Invalid data: ${currentPath}[${index}] is undefined`);
              }
            });
          }
        }
      };

      checkForUndefined(tournamentData);

      const tournamentId = await createTournament(tournamentData);
      navigate(`/tournaments/${tournamentId}`);
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert(`Failed to create tournament: ${error.message}`);
      setCreating(false);
    }
  };

  const getSelectedSeries = () => {
    if (!formData.seriesId) return null;
    return series.find(s => s.id === formData.seriesId);
  };

  if (loading) {
    return (
      <div className="tournament-creation">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-creation">
      <div className="creation-container">
        {/* Header */}
        <div className="creation-header">
          <button onClick={() => navigate('/tournaments')} className="back-button">
            <ArrowLeftIcon className="icon" />
            Back to Tournaments
          </button>
          <h1>Create New Tournament</h1>
          <p>Set up a new tournament for your golf series</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`step-item ${currentStep >= step.number ? 'active' : ''} ${
                currentStep > step.number ? 'completed' : ''
              }`}
            >
              <div className="step-indicator">
                {currentStep > step.number ? (
                  <CheckIcon className="check-icon" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <div className="step-content">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="form-card">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="form-step">
              <h2>Basic Information</h2>
              <p className="step-subtitle">Enter the essential details for your tournament</p>

              <div className="form-group">
                <label>Tournament Series</label>
                <select
                  value={formData.seriesId || ''}
                  onChange={(e) => setFormData({ ...formData, seriesId: e.target.value || null })}
                  className="form-select"
                >
                  <option value="">No Series (Standalone Tournament)</option>
                  {series.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="field-hint">Optional: Assign to a tournament series or leave standalone</p>
              </div>

              <div className="form-group">
                <label>Tournament Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="e.g., Autumn Classic 2025"
                />
                {errors.name && <p className="error-message">{errors.name}</p>}
              </div>

              <div className="form-group">
                <label>Edition / Year</label>
                <input
                  type="text"
                  value={formData.edition}
                  onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                  className="form-input"
                  placeholder="e.g., 2025, October 2025"
                />
                <p className="field-hint">Optional: Specify the edition or year for this tournament</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`form-input ${errors.startDate ? 'error' : ''}`}
                  />
                  {errors.startDate && <p className="error-message">{errors.startDate}</p>}
                </div>

                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`form-input ${errors.endDate ? 'error' : ''}`}
                  />
                  {errors.endDate && <p className="error-message">{errors.endDate}</p>}
                </div>
              </div>

              <div className="form-group">
                <label>Tournament Type *</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="tournamentType"
                      checked={!formData.hasTeams}
                      onChange={() => setFormData({ ...formData, hasTeams: false })}
                    />
                    <span>Individual Tournament</span>
                    <p className="radio-hint">Players compete individually</p>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="tournamentType"
                      checked={formData.hasTeams}
                      onChange={() => setFormData({ ...formData, hasTeams: true })}
                    />
                    <span>Team Tournament</span>
                    <p className="radio-hint">Players compete in teams (e.g., Ryder Cup, Scramble)</p>
                  </label>
                </div>
                <p className="field-hint">Round formats will be configured in the next step</p>
              </div>
            </div>
          )}

          {/* Step 2: Select Players */}
          {currentStep === 2 && (
            <div className="form-step">
              <h2>Select Players</h2>
              <p className="step-subtitle">Choose which players will participate in this tournament</p>

              {errors.players && (
                <div className="error-banner">{errors.players}</div>
              )}

              <div className="player-selection-controls">
                <div className="selection-summary">
                  <span className="selected-count">{formData.selectedPlayers.length}</span>
                  <span className="selection-text">of {players.length} players selected</span>
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllPlayers}
                  className="button secondary small"
                >
                  {formData.selectedPlayers.length === players.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="players-grid">
                {players.map(player => (
                  <div
                    key={player.id}
                    className={`player-card ${formData.selectedPlayers.includes(player.id) ? 'selected' : ''}`}
                    onClick={() => handlePlayerToggle(player.id)}
                  >
                    <div className="player-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.selectedPlayers.includes(player.id)}
                        readOnly
                      />
                    </div>
                    <div className="player-info">
                      <div className="player-name">{player.name}</div>
                      <div className="player-handicap">HCP: {player.handicap.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {players.length === 0 && (
                <div className="empty-state">
                  <p>No players found. Add players in Player Management first.</p>
                  <button onClick={() => navigate('/players')} className="button primary">
                    Go to Player Management
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Setup Teams (conditional - only for team formats) */}
          {currentStep === 3 && formData.hasTeams && (
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
                                  <span className="player-handicap">HCP {player.handicap.toFixed(1)}</span>
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
          )}

          {/* Step 3/4: Configure Rounds */}
          {currentStep === (formData.hasTeams ? 4 : 3) && (
            <div className="form-step">
              <h2>Configure Rounds</h2>
              <p className="step-subtitle">Set up the rounds for this tournament</p>

              {errors.rounds && (
                <div className="error-banner">{errors.rounds}</div>
              )}

              <div className="rounds-config-actions">
                <button onClick={handleGenerateRounds} className="button secondary">
                  Auto-Generate from Dates ({Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1} rounds)
                </button>
                <button onClick={handleAddRound} className="button primary">
                  Add Round
                </button>
              </div>

              {formData.rounds.length > 0 ? (
                <div className="rounds-config-list">
                  {formData.rounds.map((round, index) => (
                    <div key={round.id} className="round-config-card card">
                      <div className="round-config-header">
                        <h4>Round {round.roundNumber}</h4>
                        <button
                          onClick={() => handleRemoveRound(round.id)}
                          className="button small danger"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Round Name</label>
                          <input
                            type="text"
                            value={round.name}
                            onChange={(e) => handleUpdateRound(round.id, 'name', e.target.value)}
                            className="form-input"
                            placeholder="e.g., Round 1, Friday Morning"
                          />
                        </div>

                        <div className="form-group">
                          <label>Date</label>
                          <input
                            type="date"
                            value={round.date}
                            onChange={(e) => handleUpdateRound(round.id, 'date', e.target.value)}
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label>Round Format *</label>
                          {round.format ? (
                            <div className="format-selection">
                              <div className="selected-format">
                                <span className="format-name">{getFormatDisplayName(round.format)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenFormatModal(round.id)}
                                  className="button small secondary"
                                >
                                  Change Format
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenFormatModal(round.id)}
                              className="button secondary"
                              style={{ width: '100%' }}
                            >
                              Select Format
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No rounds configured yet. Use "Auto-Generate" or "Add Round" to create rounds.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4/5: Review & Create */}
          {currentStep === (formData.hasTeams ? 5 : 4) && (
            <div className="form-step">
              <h2>Review & Create</h2>
              <p className="step-subtitle">Review your tournament details before creating</p>

              <div className="review-section">
                <h3>Tournament Details</h3>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="review-label">Series:</span>
                    <span className="review-value">
                      {formData.seriesId ? getSelectedSeries()?.name : 'No Series'}
                    </span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Name:</span>
                    <span className="review-value">{formData.name}</span>
                  </div>
                  {formData.edition && (
                    <div className="review-item">
                      <span className="review-label">Edition:</span>
                      <span className="review-value">{formData.edition}</span>
                    </div>
                  )}
                  <div className="review-item">
                    <span className="review-label">Dates:</span>
                    <span className="review-value">
                      {new Date(formData.startDate).toLocaleDateString()} - {new Date(formData.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Type:</span>
                    <span className="review-value">{formData.hasTeams ? 'Team Tournament' : 'Individual Tournament'}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Rounds:</span>
                    <span className="review-value">{formData.rounds.length}</span>
                  </div>
                </div>
              </div>

              {/* Rounds Section */}
              <div className="review-section">
                <h3>Rounds</h3>
                {formData.rounds.map(round => (
                  <div key={round.id} className="review-round">
                    <div className="review-round-header">
                      <strong>{round.name}</strong>
                      <span className="review-round-date">{new Date(round.date).toLocaleDateString()}</span>
                      {round.format && (
                        <span className="review-round-format capitalize">{getFormatDisplayName(round.format)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Show Teams section for team formats */}
              {formData.hasTeams ? (
                <div className="review-section">
                  <h3>Teams</h3>
                  {formData.teams.map(team => {
                    const teamPlayers = players.filter(p => team.players.includes(p.id));
                    return (
                      <div key={team.id} className="review-team">
                        <div className="review-team-header">
                          <span className="team-color-dot" style={{ backgroundColor: team.color }}></span>
                          <strong>{team.name}</strong>
                          <span className="team-player-count">({teamPlayers.length} player{teamPlayers.length !== 1 ? 's' : ''})</span>
                        </div>
                        <div className="review-team-players">
                          {teamPlayers.map(player => (
                            <div key={player.id} className="review-player">
                              <span className="review-player-name">{player.name}</span>
                              <span className="review-player-handicap">HCP {player.handicap.toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="review-section">
                  <h3>Players ({formData.selectedPlayers.length})</h3>
                  <div className="review-players">
                    {players
                      .filter(p => formData.selectedPlayers.includes(p.id))
                      .sort((a, b) => a.handicap - b.handicap)
                      .map(player => (
                        <div key={player.id} className="review-player">
                          <span className="review-player-name">{player.name}</span>
                          <span className="review-player-handicap">HCP {player.handicap.toFixed(1)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-textarea"
                  rows="4"
                  placeholder="Add any additional notes or details about this tournament..."
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button onClick={handleBack} className="button secondary" disabled={creating}>
                <ArrowLeftIcon className="icon" />
                Back
              </button>
            )}
            <div className="nav-spacer"></div>
            {currentStep < steps[steps.length - 1].number ? (
              <button onClick={handleNext} className="button primary">
                Next
                <ArrowRightIcon className="icon" />
              </button>
            ) : (
              <button onClick={handleSubmit} className="button primary" disabled={creating}>
                {creating ? (
                  <>
                    <div className="button-spinner"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckIcon className="icon" />
                    Create Tournament
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Format Explainer Modal */}
      {showFormatModal && (
        <FormatExplainerModal
          onClose={() => {
            setShowFormatModal(false);
            setConfiguringRoundId(null);
          }}
          onSelect={handleSelectFormat}
        />
      )}
    </div>
  );
}

export default TournamentCreation;
