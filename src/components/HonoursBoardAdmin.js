import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { subscribeToTournamentSeries } from '../firebase/tournamentServices';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import './HonoursBoardAdmin.css';

function HonoursBoardAdmin() {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    edition: '',
    winner: '',
    winnerDetails: {
      score: '',
      margin: '',
      teamMembers: []
    },
    courseName: '',
    date: new Date().toISOString().split('T')[0],
    photos: [],
    summary: ''
  });

  // Check admin status (simplified for now - you can add proper auth later)
  const isAdmin = true; // TODO: Replace with actual admin check

  useEffect(() => {
    const unsubscribe = subscribeToTournamentSeries((seriesData) => {
      setSeries(seriesData);

      // Auto-select first series if available
      if (seriesData.length > 0 && !selectedSeriesId) {
        setSelectedSeriesId(seriesData[0].id);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedSeriesId]);

  useEffect(() => {
    if (selectedSeriesId) {
      loadEntries(selectedSeriesId);
    }
  }, [selectedSeriesId]);

  const loadEntries = async (seriesId) => {
    setLoading(true);
    try {
      const entriesRef = collection(db, 'honoursBoard');
      const q = query(
        entriesRef,
        where('seriesId', '==', seriesId),
        orderBy('year', 'desc'),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      const entriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading honours entries:', error);
      alert('Error loading entries: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingEntry(null);
    setFormData({
      year: new Date().getFullYear(),
      edition: '',
      winner: '',
      winnerDetails: {
        score: '',
        margin: '',
        teamMembers: []
      },
      courseName: '',
      date: new Date().toISOString().split('T')[0],
      photos: [],
      summary: ''
    });
    setShowModal(true);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      year: entry.year,
      edition: entry.edition || '',
      winner: entry.winner,
      winnerDetails: entry.winnerDetails || {
        score: '',
        margin: '',
        teamMembers: []
      },
      courseName: entry.courseName,
      date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
      photos: entry.photos || [],
      summary: entry.summary || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Are you sure you want to delete the entry for ${entry.winner} (${entry.year})?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'honoursBoard', entry.id));
      alert('Entry deleted successfully');
      loadEntries(selectedSeriesId);
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSeriesId) {
      alert('Please select a series');
      return;
    }

    try {
      const entryData = {
        seriesId: selectedSeriesId,
        year: parseInt(formData.year),
        edition: formData.edition || null,
        winner: formData.winner,
        winnerDetails: {
          score: formData.winnerDetails.score,
          margin: formData.winnerDetails.margin,
          teamMembers: formData.winnerDetails.teamMembers
        },
        courseName: formData.courseName,
        date: formData.date,
        photos: formData.photos,
        summary: formData.summary,
        updatedAt: Timestamp.now()
      };

      if (editingEntry) {
        // Update existing entry
        await updateDoc(doc(db, 'honoursBoard', editingEntry.id), entryData);
        alert('Entry updated successfully');
      } else {
        // Create new entry
        entryData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'honoursBoard'), entryData);
        alert('Entry added successfully');
      }

      setShowModal(false);
      loadEntries(selectedSeriesId);
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Error saving entry: ' + error.message);
    }
  };

  const selectedSeries = series.find(s => s.id === selectedSeriesId);

  if (!isAdmin) {
    return (
      <div className="honours-admin">
        <div className="card">
          <h2>Access Denied</h2>
          <p>You must be an administrator to access this page.</p>
          <button onClick={() => navigate('/honours')} className="button secondary">
            Back to Honours Board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="honours-admin">
      {/* Header */}
      <div className="admin-header">
        <button onClick={() => navigate('/honours')} className="back-button">
          <ArrowLeftIcon className="icon" />
          Back to Honours Board
        </button>
        <h1>Honours Board - Admin</h1>
      </div>

      {/* Series Selector */}
      <div className="card series-selector">
        <label>Tournament Series:</label>
        <select
          value={selectedSeriesId || ''}
          onChange={(e) => setSelectedSeriesId(e.target.value)}
          className="select-input"
        >
          <option value="">Select a series...</option>
          {series.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddNew}
          className="button primary"
          disabled={!selectedSeriesId}
        >
          <PlusIcon className="icon" />
          Add Historic Entry
        </button>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="card">
          <p>Loading entries...</p>
        </div>
      ) : selectedSeriesId ? (
        <div className="card">
          <h2>{selectedSeries?.name} - Historic Entries</h2>
          {entries.length === 0 ? (
            <div className="empty-state">
              <TrophyIcon className="empty-icon" />
              <p>No historic entries yet.</p>
              <p className="text-secondary">Add your first entry using the button above.</p>
            </div>
          ) : (
            <div className="entries-list">
              {entries.map(entry => (
                <div key={entry.id} className="entry-item">
                  <div className="entry-info">
                    <div className="entry-header">
                      <h3>
                        {entry.year} {entry.edition && `(${entry.edition})`}
                      </h3>
                      <div className="entry-actions">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="button-icon"
                          title="Edit"
                        >
                          <PencilIcon className="icon" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          className="button-icon danger"
                          title="Delete"
                        >
                          <TrashIcon className="icon" />
                        </button>
                      </div>
                    </div>
                    <div className="entry-details">
                      <p><strong>Winner:</strong> {entry.winner}</p>
                      {entry.winnerDetails?.score && (
                        <p><strong>Score:</strong> {entry.winnerDetails.score}</p>
                      )}
                      <p><strong>Course:</strong> {entry.courseName}</p>
                      <p><strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}</p>
                      {entry.summary && (
                        <p className="entry-summary">{entry.summary}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <p>Please select a tournament series to manage entries.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEntry ? 'Edit Entry' : 'Add Historic Entry'}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="close-button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="entry-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>

                <div className="form-group">
                  <label>Edition (optional)</label>
                  <input
                    type="text"
                    value={formData.edition}
                    onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                    placeholder="e.g., October, Spring"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Winner(s) *</label>
                <input
                  type="text"
                  value={formData.winner}
                  onChange={(e) => setFormData({ ...formData, winner: e.target.value })}
                  required
                  placeholder="e.g., John Doe, Team Smith & Jones"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Score</label>
                  <input
                    type="text"
                    value={formData.winnerDetails.score}
                    onChange={(e) => setFormData({
                      ...formData,
                      winnerDetails: { ...formData.winnerDetails, score: e.target.value }
                    })}
                    placeholder="e.g., 42 points, -5"
                  />
                </div>

                <div className="form-group">
                  <label>Margin</label>
                  <input
                    type="text"
                    value={formData.winnerDetails.margin}
                    onChange={(e) => setFormData({
                      ...formData,
                      winnerDetails: { ...formData.winnerDetails, margin: e.target.value }
                    })}
                    placeholder="e.g., 3 points, 2 & 1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Course Name *</label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  required
                  placeholder="e.g., Akarana Golf Course"
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Summary (optional)</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows="3"
                  placeholder="Brief description of the tournament or memorable moments..."
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="button secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="button primary">
                  {editingEntry ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HonoursBoardAdmin;
