import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addPlayer,
  updatePlayer,
  deletePlayer,
  subscribeToPlayers,
  getMatches
} from '../firebase/services';
import { getTournaments } from '../firebase/tournamentServices';
import { formatHandicap, validateHandicap, parseHandicap } from '../utils/handicapUtils';
import { PlusIcon, PencilIcon, TrashIcon, ChartBarIcon } from '@heroicons/react/24/outline';

function PlayerManagement() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [formData, setFormData] = useState({ name: '', handicap: '' });
  const [errors, setErrors] = useState({});
  const [historyTab, setHistoryTab] = useState('handicap'); // 'handicap', 'matches', 'tournaments'
  const [playerMatches, setPlayerMatches] = useState([]);
  const [playerTournaments, setPlayerTournaments] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToPlayers((playersData) => {
      setPlayers(playersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', handicap: '' });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Player name is required';
    }

    if (formData.handicap === '' || formData.handicap === null) {
      newErrors.handicap = 'Handicap is required';
    } else if (!validateHandicap(formData.handicap)) {
      newErrors.handicap = 'Handicap must be between 0.0 and 54.0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await addPlayer({
        name: formData.name.trim(),
        handicap: parseHandicap(formData.handicap)
      });

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Failed to add player. Please try again.');
    }
  };

  const handleEditPlayer = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await updatePlayer(selectedPlayer.id, {
        name: formData.name.trim(),
        handicap: parseHandicap(formData.handicap)
      });

      setShowEditModal(false);
      setSelectedPlayer(null);
      resetForm();
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Failed to update player. Please try again.');
    }
  };

  const handleDeletePlayer = async (player) => {
    if (window.confirm(`Are you sure you want to delete ${player.name}? This action cannot be undone.`)) {
      try {
        await deletePlayer(player.id);
      } catch (error) {
        console.error('Error deleting player:', error);
        alert('Failed to delete player. Please try again.');
      }
    }
  };

  const openEditModal = (player) => {
    setSelectedPlayer(player);
    setFormData({
      name: player.name,
      handicap: player.handicap.toString()
    });
    setShowEditModal(true);
  };

  const openHistoryModal = async (player) => {
    setSelectedPlayer(player);
    setHistoryTab('handicap');

    // Fetch player's match history
    try {
      const allMatches = await getMatches();
      const matches = allMatches.filter(match =>
        match.team1Players?.includes(player.id) ||
        match.team2Players?.includes(player.id) ||
        match.team1PlayerIds?.includes(player.id) ||
        match.team2PlayerIds?.includes(player.id)
      );
      setPlayerMatches(matches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setPlayerMatches([]);
    }

    // Fetch player's tournament history
    try {
      const allTournaments = await getTournaments();
      const tournaments = allTournaments.filter(tournament =>
        tournament.players?.includes(player.id)
      );
      setPlayerTournaments(tournaments);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setPlayerTournaments([]);
    }

    setShowHistoryModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Player Management</h1>
              <p className="text-gray-600">Manage players and their handicaps</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Add Player
              </button>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{player.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary-600">
                      {formatHandicap(player.handicap)}
                    </span>
                    <span className="text-sm text-gray-500">HCP</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openHistoryModal(player)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View handicap history"
                  >
                    <ChartBarIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(player)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit player"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeletePlayer(player)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete player"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {player.handicapHistory && player.handicapHistory.length > 0 && (
                <div className="text-sm text-gray-500 border-t pt-3">
                  Last updated: {new Date(player.handicapHistory[player.handicapHistory.length - 1].date).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">No players added yet</p>
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Your First Player
            </button>
          </div>
        )}

        {/* Add Player Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Player</h2>
              <form onSubmit={handleAddPlayer}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter player name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Handicap (0.0 - 54.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="54"
                    value={formData.handicap}
                    onChange={(e) => setFormData({ ...formData, handicap: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.handicap ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 12.5"
                  />
                  {errors.handicap && (
                    <p className="mt-1 text-sm text-red-600">{errors.handicap}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Player
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Player Modal */}
        {showEditModal && selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Player</h2>
              <form onSubmit={handleEditPlayer}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter player name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Handicap (0.0 - 54.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="54"
                    value={formData.handicap}
                    onChange={(e) => setFormData({ ...formData, handicap: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.handicap ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 12.5"
                  />
                  {errors.handicap && (
                    <p className="mt-1 text-sm text-red-600">{errors.handicap}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Current: {formatHandicap(selectedPlayer.handicap)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedPlayer(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Player History Modal */}
        {showHistoryModal && selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 max-h-[85vh] overflow-hidden flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPlayer.name}</h2>
                <p className="text-gray-600">Player History & Statistics</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setHistoryTab('handicap')}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    historyTab === 'handicap'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Handicap History
                </button>
                <button
                  onClick={() => setHistoryTab('matches')}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    historyTab === 'matches'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Match History ({playerMatches.length})
                </button>
                <button
                  onClick={() => setHistoryTab('tournaments')}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    historyTab === 'tournaments'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Tournaments ({playerTournaments.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {historyTab === 'handicap' && (
                  <div className="space-y-3">
                    {selectedPlayer.handicapHistory && selectedPlayer.handicapHistory.length > 0 ? (
                      [...selectedPlayer.handicapHistory].reverse().map((entry, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-2xl font-bold text-primary-600 mb-1">
                                {formatHandicap(entry.handicap)}
                              </div>
                              <div className="text-sm text-gray-600">{entry.reason}</div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(entry.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No handicap history available</p>
                    )}
                  </div>
                )}

                {historyTab === 'matches' && (
                  <div className="space-y-3">
                    {playerMatches.length > 0 ? (
                      playerMatches.map((match) => (
                        <div
                          key={match.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {match.type === 'foursomes' ? 'Foursomes' : match.type === 'fourball' ? 'Fourball' : 'Singles'}
                              </div>
                              <div className="text-sm text-gray-600 capitalize">
                                {match.status?.replace('_', ' ') || 'Not started'}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {match.createdAt ? new Date(match.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          {match.status === 'completed' && match.result && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="text-sm">
                                <span className={`font-semibold ${
                                  match.result.winner === 'team1' ? 'text-red-600' :
                                  match.result.winner === 'team2' ? 'text-blue-600' :
                                  'text-gray-600'
                                }`}>
                                  {match.result.winner === 'halved' ? 'Halved' :
                                   match.result.winner === 'team1' ? 'Tawa Lads Won' :
                                   'Rest of World Won'}
                                </span>
                                {match.result.margin && match.result.margin !== 'halved' && (
                                  <span className="text-gray-600 ml-2">{match.result.margin}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No match history available</p>
                    )}
                  </div>
                )}

                {historyTab === 'tournaments' && (
                  <div className="space-y-3">
                    {playerTournaments.length > 0 ? (
                      playerTournaments.map((tournament) => (
                        <div
                          key={tournament.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-gray-900">{tournament.name}</div>
                              <div className="text-sm text-gray-600">{tournament.courseName}</div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
                            <div className="text-sm">
                              <span className="text-gray-500">Status:</span>
                              <span className="ml-2 font-medium capitalize">{tournament.status?.replace('_', ' ')}</span>
                            </div>
                            {tournament.rounds && tournament.rounds.length > 0 && (
                              <div className="text-sm">
                                <span className="text-gray-500">Format:</span>
                                <span className="ml-2 font-medium capitalize">
                                  {tournament.hasTeams ? 'Team Tournament' : 'Individual Tournament'}
                                </span>
                              </div>
                            )}
                          </div>
                          {tournament.winner && tournament.status === 'completed' && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Winner:</span>
                              <span className="ml-2 font-semibold text-primary-600">{tournament.winner}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No tournament history available</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedPlayer(null);
                    setPlayerMatches([]);
                    setPlayerTournaments([]);
                  }}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerManagement;
