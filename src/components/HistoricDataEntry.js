import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { subscribeToTournamentSeries } from '../firebase/tournamentServices';
import { subscribeToPlayers } from '../firebase/services';
import { ArrowLeftIcon, PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import './HistoricDataEntry.css';

function HistoricDataEntry() {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    winner: '',
    score: '',
    runnerUp: '',
    runnerUpScore: '',
    thirdPlace: '',
    thirdPlaceScore: '',
    courseName: '',
    notes: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeToTournamentSeries((seriesData) => {
      setSeries(seriesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToPlayers((playersData) => {
      setPlayers(playersData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedSeries) {
      loadExistingTournaments(selectedSeries);
    }
  }, [selectedSeries]);

  const loadExistingTournaments = async (seriesId) => {
    try {
      const tournamentsRef = collection(db, 'tournaments');
      const q = query(
        tournamentsRef,
        where('seriesId', '==', seriesId),
        where('isHistoric', '==', true)
      );

      const snapshot = await getDocs(q);
      const historicTournaments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTournaments(historicTournaments.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('Error loading historic tournaments:', error);
    }
  };

  const handleSeriesChange = (e) => {
    setSelectedSeries(e.target.value);
    setFormData({
      year: new Date().getFullYear(),
      winner: '',
      score: '',
      runnerUp: '',
      runnerUpScore: '',
      thirdPlace: '',
      thirdPlaceScore: '',
      courseName: '',
      notes: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSeries || !formData.year || !formData.winner || !formData.score) {
      alert('Please fill in all required fields (Series, Year, Winner, Score)');
      return;
    }

    setSaving(true);

    try {
      const selectedSeriesData = series.find(s => s.id === selectedSeries);
      const winnerPlayer = players.find(p => p.id === formData.winner);

      if (!winnerPlayer) {
        alert('Selected winner not found in players list');
        setSaving(false);
        return;
      }

      // Create historic tournament document
      const tournamentData = {
        name: `${selectedSeriesData.name} ${formData.year}`,
        seriesId: selectedSeries,
        seriesName: selectedSeriesData.name,
        format: selectedSeriesData.format,
        date: `${formData.year}-12-31`, // Default to end of year
        isHistoric: true,
        historicData: {
          year: parseInt(formData.year),
          winner: {
            playerId: formData.winner,
            playerName: winnerPlayer.name,
            score: formData.score
          },
          runnerUp: formData.runnerUp ? {
            playerId: formData.runnerUp,
            playerName: players.find(p => p.id === formData.runnerUp)?.name,
            score: formData.runnerUpScore
          } : null,
          thirdPlace: formData.thirdPlace ? {
            playerId: formData.thirdPlace,
            playerName: players.find(p => p.id === formData.thirdPlace)?.name,
            score: formData.thirdPlaceScore
          } : null,
          courseName: formData.courseName,
          notes: formData.notes
        },
        // Create a simple round structure for compatibility
        rounds: [{
          id: 'historic_round',
          roundNumber: 1,
          scoringFormat: selectedSeriesData.format === 'individual-stableford' ? 'stableford' : 'stroke',
          scorecards: [{
            playerId: formData.winner,
            playerName: winnerPlayer.name,
            totalPoints: selectedSeriesData.format === 'individual-stableford'
              ? parseInt(formData.score)
              : null,
            totalGross: selectedSeriesData.format !== 'individual-stableford'
              ? parseInt(formData.score)
              : null,
            status: 'completed'
          }]
        }],
        status: 'completed',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      };

      await addDoc(collection(db, 'tournaments'), tournamentData);

      alert('Historic tournament added successfully!');

      // Reset form
      setFormData({
        year: new Date().getFullYear(),
        winner: '',
        score: '',
        runnerUp: '',
        runnerUpScore: '',
        thirdPlace: '',
        thirdPlaceScore: '',
        courseName: '',
        notes: ''
      });

      // Reload tournaments
      loadExistingTournaments(selectedSeries);
    } catch (error) {
      console.error('Error adding historic tournament:', error);
      alert('Failed to add historic tournament. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTournament = async (tournamentId) => {
    if (!window.confirm('Are you sure you want to delete this historic tournament?')) {
      return;
    }

    try {
      // Note: In a real implementation, you'd use deleteDoc
      // For now, we'll just mark it as deleted
      await updateDoc(doc(db, 'tournaments', tournamentId), {
        deleted: true,
        deletedAt: new Date().toISOString()
      });

      alert('Historic tournament deleted successfully!');
      loadExistingTournaments(selectedSeries);
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Failed to delete tournament. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="historic-data-entry">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const selectedSeriesData = series.find(s => s.id === selectedSeries);

  return (
    <div className="historic-data-entry">
      <div className="entry-container">
        {/* Header */}
        <div className="entry-header">
          <button
            onClick={() => navigate('/')}
            className="button secondary small back-button"
          >
            <ArrowLeftIcon className="icon" />
            Back
          </button>

          <div className="header-content">
            <h1>Historic Tournament Data Entry</h1>
            <p className="header-subtitle">Add past tournament winners to the honours board</p>
          </div>
        </div>

        {/* Entry Form */}
        <div className="entry-form-section">
          <div className="form-header">
            <PlusIcon className="form-icon" />
            <h2>Add Historic Tournament</h2>
          </div>

          <form onSubmit={handleSubmit} className="entry-form">
            {/* Series Selection */}
            <div className="form-group">
              <label htmlFor="series">Tournament Series *</label>
              <select
                id="series"
                value={selectedSeries}
                onChange={handleSeriesChange}
                required
                className="form-select"
              >
                <option value="">Select a series...</option>
                {series.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.format})
                  </option>
                ))}
              </select>
            </div>

            {selectedSeries && (
              <>
                {/* Year */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="year">Year *</label>
                    <input
                      type="number"
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="courseName">Course Name</label>
                    <input
                      type="text"
                      id="courseName"
                      name="courseName"
                      value={formData.courseName}
                      onChange={handleInputChange}
                      placeholder="e.g., Greenacres Golf Club"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Winner */}
                <div className="form-section-title">Winner</div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="winner">Player *</label>
                    <select
                      id="winner"
                      name="winner"
                      value={formData.winner}
                      onChange={handleInputChange}
                      required
                      className="form-select"
                    >
                      <option value="">Select player...</option>
                      {players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name} (HCP {player.handicap?.toFixed(1)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="score">
                      Score * {selectedSeriesData?.format === 'individual-stableford' ? '(points)' : '(strokes)'}
                    </label>
                    <input
                      type="text"
                      id="score"
                      name="score"
                      value={formData.score}
                      onChange={handleInputChange}
                      placeholder={selectedSeriesData?.format === 'individual-stableford' ? '42' : '72'}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Runner-up (Optional) */}
                <div className="form-section-title">Runner-up (Optional)</div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="runnerUp">Player</label>
                    <select
                      id="runnerUp"
                      name="runnerUp"
                      value={formData.runnerUp}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">Select player...</option>
                      {players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name} (HCP {player.handicap?.toFixed(1)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="runnerUpScore">Score</label>
                    <input
                      type="text"
                      id="runnerUpScore"
                      name="runnerUpScore"
                      value={formData.runnerUpScore}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Third Place (Optional) */}
                <div className="form-section-title">Third Place (Optional)</div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="thirdPlace">Player</label>
                    <select
                      id="thirdPlace"
                      name="thirdPlace"
                      value={formData.thirdPlace}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="">Select player...</option>
                      {players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.name} (HCP {player.handicap?.toFixed(1)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="thirdPlaceScore">Score</label>
                    <input
                      type="text"
                      id="thirdPlaceScore"
                      name="thirdPlaceScore"
                      value={formData.thirdPlaceScore}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information about this tournament..."
                    rows="3"
                    className="form-textarea"
                  />
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="button primary"
                    disabled={saving}
                  >
                    <CheckIcon className="button-icon" />
                    {saving ? 'Adding...' : 'Add Historic Tournament'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Existing Historic Tournaments */}
        {selectedSeries && tournaments.length > 0 && (
          <div className="existing-tournaments-section">
            <h3>Existing Historic Tournaments - {selectedSeriesData?.name}</h3>

            <div className="tournaments-list">
              {tournaments.map(tournament => (
                <div key={tournament.id} className="tournament-card">
                  <div className="tournament-year">{tournament.historicData?.year}</div>
                  <div className="tournament-details">
                    <div className="tournament-winner">
                      <span className="label">Winner:</span>
                      <span className="value">{tournament.historicData?.winner?.playerName}</span>
                      <span className="score">({tournament.historicData?.winner?.score})</span>
                    </div>
                    {tournament.historicData?.courseName && (
                      <div className="tournament-course">
                        <span className="label">Course:</span>
                        <span className="value">{tournament.historicData.courseName}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteTournament(tournament.id)}
                    className="delete-button"
                    title="Delete tournament"
                  >
                    <TrashIcon className="icon" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoricDataEntry;
