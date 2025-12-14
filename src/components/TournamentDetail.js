import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  subscribeToTournament,
  updateTournament,
  deleteTournament,
  getTournamentSeriesById
} from '../firebase/tournamentServices';
import { subscribeToPlayers, addMatch, updateMatch } from '../firebase/services';
import { useAuth } from '../contexts/AuthContext';
import {
  PencilIcon,
  UserGroupIcon,
  TrophyIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import RoundCourseConfig from './RoundCourseConfig';
import RoundMatchSetup from './RoundMatchSetup';
import RoundScorecardSetup from './RoundScorecardSetup';
import RoundTeamScorecardSetup from './RoundTeamScorecardSetup';
import MediaGallery from './media/MediaGallery';
import PlayoffManager from './PlayoffManager';
import TournamentHeader from './shared/TournamentHeader';
import PlayoffAlert from './shared/PlayoffAlert';
import WinnerBanner from './shared/WinnerBanner';
import MyScorecardsSection from './shared/MyScorecardsSection';
import TeamsSection from './shared/TeamsSection';
import TeamEditorModal from './shared/TeamEditorModal';
import './TournamentDetail.css';

function TournamentDetail() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, currentPlayer } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [series, setSeries] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(null);
  const [showCourseConfig, setShowCourseConfig] = useState(false);
  const [configuringRound, setConfiguringRound] = useState(null);
  const [showMatchSetup, setShowMatchSetup] = useState(false);
  const [showScorecardSetup, setShowScorecardSetup] = useState(false);
  const [showTeamScorecardSetup, setShowTeamScorecardSetup] = useState(false);
  const [showTeamEditor, setShowTeamEditor] = useState(false);
  const [showPlayoffManager, setShowPlayoffManager] = useState(false);
  const [playoffData, setPlayoffData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    notes: '',
    players: []
  });
  const [editTab, setEditTab] = useState('details'); // 'details' | 'rounds'
  const [expandedRounds, setExpandedRounds] = useState(new Set());
  const [editingRoundId, setEditingRoundId] = useState(null); // ID of round being edited
  const [editingRoundData, setEditingRoundData] = useState(null); // Edited round data
  const [roundOperationLoading, setRoundOperationLoading] = useState(false); // Loading state for round operations
  const [notification, setNotification] = useState(null); // { message, type: 'success'|'error' }
  const [holeConfigExpanded, setHoleConfigExpanded] = useState(false);

  useEffect(() => {
    const unsubTournament = subscribeToTournament(tournamentId, async (tournamentData) => {
      setTournament(tournamentData);

      // Load series info if tournament has a series
      if (tournamentData.seriesId) {
        const seriesData = await getTournamentSeriesById(tournamentData.seriesId);
        setSeries(seriesData);
      }

      // Select first incomplete round by default (or last round if all complete)
      if (tournamentData.rounds && tournamentData.rounds.length > 0 && !selectedRound) {
        const firstIncompleteRound = tournamentData.rounds.find(r => r.status !== 'completed');
        setSelectedRound(firstIncompleteRound || tournamentData.rounds[tournamentData.rounds.length - 1]);
      }

      setLoading(false);
    });

    const unsubPlayers = subscribeToPlayers((playersData) => {
      setPlayers(playersData);
    });

    return () => {
      unsubTournament();
      unsubPlayers();
    };
  }, [tournamentId, selectedRound]);

  // Sync selectedRound with tournament data updates
  useEffect(() => {
    if (tournament && selectedRound) {
      const updatedRound = tournament.rounds.find(r => r.id === selectedRound.id);
      if (updatedRound && JSON.stringify(updatedRound) !== JSON.stringify(selectedRound)) {
        setSelectedRound(updatedRound);
      }
    }
  }, [tournament, selectedRound]);

  const getPlayer = (playerId) => players.find(p => p.id === playerId);

  const isTeamFormat = () => {
    return tournament.hasTeams === true;
  };

  // Helper to check if a specific round format is stableford
  const isStablefordRound = (round) => {
    return round && round.format && (round.format === 'individual_stableford' || round.format === 'team_stableford');
  };

  // Helper to check if round is a team format (requires team scorecards)
  const isTeamScorecardFormat = (round) => {
    return round && round.format && ['scramble', 'shamble', 'best_ball', 'team_stableford'].includes(round.format);
  };

  // Get ALL scorecards for current player across all rounds
  const getMyAllScorecards = () => {
    if (!currentPlayer || !tournament || !tournament.rounds) return [];

    const scorecards = [];

    // Find player's team (if any)
    const myTeam = tournament.teams?.find(
      team => team.players?.includes(currentPlayer.id)
    );

    tournament.rounds.forEach(round => {
      let scorecard = null;
      let type = null;

      // Check for individual scorecard
      const individualScorecard = round.scorecards?.find(
        sc => sc.playerId === currentPlayer.id
      );

      if (individualScorecard) {
        scorecard = individualScorecard;
        type = 'individual';
      }

      // Check for team scorecard
      if (!scorecard && myTeam) {
        const teamScorecard = round.teamScorecards?.find(
          sc => sc.teamId === myTeam.id
        );

        if (teamScorecard) {
          scorecard = teamScorecard;
          type = 'team';
        }
      }

      // Check for match
      if (!scorecard && round.matches) {
        const myMatch = round.matches.find(match => {
          // Singles match
          if (match.player1 === currentPlayer.id || match.player2 === currentPlayer.id) {
            return true;
          }

          // Partnership match
          if (match.partnership1?.includes(currentPlayer.id) ||
              match.partnership2?.includes(currentPlayer.id)) {
            return true;
          }

          // Team match
          if (match.team1Players?.includes(currentPlayer.id) ||
              match.team2Players?.includes(currentPlayer.id)) {
            return true;
          }

          return false;
        });

        if (myMatch) {
          scorecard = myMatch;
          type = 'match';
        }
      }

      if (scorecard) {
        scorecards.push({
          round,
          scorecard,
          type,
          team: type === 'team' ? myTeam : null
        });
      }
    });

    return scorecards;
  };

  // Navigate to appropriate scorecard based on type
  const navigateToScorecard = (scorecardData) => {
    const { round, scorecard, type, team } = scorecardData;

    switch (type) {
      case 'individual':
        if (round.format === 'individual_stableford') {
          navigate(`/tournaments/${tournamentId}/rounds/${round.id}/stableford/${scorecard.id}`);
        } else {
          navigate(`/tournaments/${tournamentId}/rounds/${round.id}/scorecards/${scorecard.id}`);
        }
        break;

      case 'team':
        if (round.format === 'scramble') {
          navigate(`/tournaments/${tournamentId}/rounds/${round.id}/scramble/${team.id}`);
        } else if (round.format === 'shamble') {
          navigate(`/tournaments/${tournamentId}/rounds/${round.id}/shamble/${team.id}`);
        } else if (round.format === 'best_ball') {
          navigate(`/tournaments/${tournamentId}/rounds/${round.id}/bestball/${team.id}`);
        } else if (round.format === 'team_stableford') {
          navigate(`/tournaments/${tournamentId}/rounds/${round.id}/team-stableford/${team.id}`);
        }
        break;

      case 'match':
        navigate(`/scoring/${scorecard.id}`);
        break;

      default:
        break;
    }
  };

  // Helper to count holes completed
  const getHolesCompleted = (scorecard) => {
    if (scorecard.holes) {
      return scorecard.holes.filter(h => h.grossScore !== null).length;
    }
    if (scorecard.currentHole) {
      return scorecard.currentHole - 1;
    }
    return 0;
  };

  const handleSaveTeams = async (updatedTeams) => {
    try {
      await updateTournament(tournamentId, {
        teams: updatedTeams
      });
      setShowTeamEditor(false);
    } catch (error) {
      alert('Failed to save teams. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      setup: { className: 'status-badge-setup', label: 'Setup' },
      in_progress: { className: 'status-badge-in-progress', label: 'In Progress' },
      completed: { className: 'status-badge-completed', label: 'Completed' }
    };
    return badges[status] || badges.setup;
  };

  const handleCompleteTournament = async () => {
    if (window.confirm('Mark this tournament as completed?')) {
      await updateTournament(tournamentId, { status: 'completed' });
    }
  };

  const handleRoundSelect = (round) => {
    setSelectedRound(round);
  };

  const updateRoundCourse = (round) => {
    setConfiguringRound(round);
    setShowCourseConfig(true);
  };

  const handleSaveCourseConfig = async (configData) => {
    try {
      // Find the round index
      const roundIndex = tournament.rounds.findIndex(r => r.id === configuringRound.id);

      // Update the rounds array with new course data
      const updatedRounds = [...tournament.rounds];
      updatedRounds[roundIndex] = {
        ...updatedRounds[roundIndex],
        savedCourseId: configData.savedCourseId,
        courseName: configData.courseName,
        teeBox: configData.teeBox,
        teeColor: configData.teeColor,
        courseData: configData.courseData,
        ...(configData.matchFormat && { matchFormat: configData.matchFormat }),
        updatedAt: new Date().toISOString()
      };

      // Save to database
      await updateTournament(tournamentId, {
        rounds: updatedRounds
      });

      setShowCourseConfig(false);
      setConfiguringRound(null);
    } catch (error) {
      console.error('Error saving course configuration:', error);
      alert('Failed to save course configuration. Please try again.');
    }
  };

  const handleSaveMatchSetup = async (matchData) => {
    try {
      const roundIndex = tournament.rounds.findIndex(r => r.id === configuringRound.id);
      const updatedRounds = [...tournament.rounds];
      updatedRounds[roundIndex] = {
        ...updatedRounds[roundIndex],
        matches: matchData.matches,
        updatedAt: new Date().toISOString()
      };

      // Save to tournament document
      await updateTournament(tournamentId, {
        rounds: updatedRounds
      });

      // Also sync matches to matches collection for compatibility with existing scoring system
      // Matches are stored in both places:
      // 1. Within tournament.rounds[].matches for organizational purposes
      // 2. In matches collection for existing MatchSetup/Scoring components
      for (const match of matchData.matches) {
        const matchWithRefs = {
          ...match,
          tournamentId: tournament.id,
          roundId: configuringRound.id
        };

        if (match.id.startsWith('match-')) {
          // New match, add to collection - Firebase will generate a new ID
          const newMatchId = await addMatch(matchWithRefs);
          // Update the match ID in the round's matches array
          updatedRounds[roundIndex].matches = updatedRounds[roundIndex].matches.map(m =>
            m.id === match.id ? { ...m, id: newMatchId } : m
          );
        } else {
          // Existing match, update it
          await updateMatch(match.id, matchWithRefs);
        }
      }

      // Update tournament again with corrected match IDs if any were generated
      await updateTournament(tournamentId, {
        rounds: updatedRounds
      });

      setShowMatchSetup(false);
      setConfiguringRound(null);
    } catch (error) {
      console.error('Error saving match setup:', error);
      alert('Failed to save match setup. Please try again.');
    }
  };

  const openMatchSetup = (round) => {
    setConfiguringRound(round);
    setShowMatchSetup(true);
  };

  const handleSaveScorecardSetup = async (scorecardData) => {
    try {
      const roundIndex = tournament.rounds.findIndex(r => r.id === configuringRound.id);
      const updatedRounds = [...tournament.rounds];
      updatedRounds[roundIndex] = {
        ...updatedRounds[roundIndex],
        scorecards: scorecardData.scorecards,
        updatedAt: new Date().toISOString()
      };

      await updateTournament(tournamentId, {
        rounds: updatedRounds
      });

      setShowScorecardSetup(false);
      setConfiguringRound(null);
    } catch (error) {
      console.error('Error saving scorecard setup:', error);
      alert('Failed to save scorecard setup. Please try again.');
    }
  };

  const openScorecardSetup = (round) => {
    setConfiguringRound(round);
    setShowScorecardSetup(true);
  };

  const openTeamScorecardSetup = (round) => {
    // Check if teams are configured
    if (!tournament.teams || tournament.teams.length === 0) {
      const shouldSetupTeams = window.confirm(
        'No teams are configured for this tournament. Would you like to set up teams now?\n\n' +
        'Team-based formats like Best Ball, Scramble, and Shamble require teams to be configured.'
      );

      if (shouldSetupTeams) {
        // Update tournament to enable teams if needed
        if (!tournament.hasTeams) {
          updateTournament(tournamentId, { hasTeams: true }).catch(err => {
            console.error('Error enabling teams:', err);
          });
        }
        setShowTeamEditor(true);
      }
      return;
    }

    setConfiguringRound(round);
    setShowTeamScorecardSetup(true);
  };

  const handleSaveTeamScorecardSetup = async (teamScorecardData) => {
    try {
      const roundIndex = tournament.rounds.findIndex(r => r.id === configuringRound.id);
      const updatedRounds = [...tournament.rounds];
      updatedRounds[roundIndex] = {
        ...updatedRounds[roundIndex],
        teamScorecards: teamScorecardData.teamScorecards,
        updatedAt: new Date().toISOString()
      };

      await updateTournament(tournamentId, {
        rounds: updatedRounds
      });

      setShowTeamScorecardSetup(false);
      setConfiguringRound(null);
    } catch (error) {
      console.error('Error saving team scorecard setup:', error);
      alert('Failed to save team scorecard setup. Please try again.');
    }
  };

  const detectPlayoff = () => {
    // Only check for Stableford tournaments - check if any round has stableford format
    const hasStablefordRound = tournament.rounds?.some(round => isStablefordRound(round));
    if (!hasStablefordRound) return null;

    // Calculate final standings
    const playerTournamentPoints = new Map();

    tournament.rounds?.forEach(round => {
      round.scorecards?.forEach(scorecard => {
        if (scorecard.status === 'completed') {
          const current = playerTournamentPoints.get(scorecard.playerId) || 0;
          playerTournamentPoints.set(scorecard.playerId, current + (scorecard.totalPoints || 0));
        }
      });
    });

    // Sort by points
    const sortedResults = Array.from(playerTournamentPoints.entries())
      .map(([playerId, points]) => ({ playerId, points }))
      .sort((a, b) => b.points - a.points);

    if (sortedResults.length < 2) return null;

    // Check if top players are tied
    const topScore = sortedResults[0].points;
    const tiedPlayers = sortedResults.filter(r => r.points === topScore);

    if (tiedPlayers.length > 1) {
      return {
        tiedPlayers,
        topScore
      };
    }

    return null;
  };

  const handleOpenPlayoffManager = () => {
    const playoff = detectPlayoff();
    if (playoff && selectedRound) {
      setPlayoffData({
        tiedPlayers: playoff.tiedPlayers,
        round: selectedRound
      });
      setShowPlayoffManager(true);
    }
  };

  const handlePlayoffComplete = async (winnerId, winnerName, method) => {
    setShowPlayoffManager(false);
    setPlayoffData(null);
    // Tournament data will refresh automatically via subscription
  };

  const handleOpenEditModal = () => {
    setEditFormData({
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      notes: tournament.notes || '',
      players: tournament.players || []
    });
    setEditTab('details'); // Reset to details tab
    setExpandedRounds(new Set()); // Clear expanded rounds
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateTournament(tournamentId, {
        name: editFormData.name,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        notes: editFormData.notes,
        players: editFormData.players
      });
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating tournament:', error);
      alert('Failed to update tournament. Please try again.');
    }
  };

  const handleTogglePlayer = (playerId) => {
    setEditFormData(prev => ({
      ...prev,
      players: prev.players.includes(playerId)
        ? prev.players.filter(id => id !== playerId)
        : [...prev.players, playerId]
    }));
  };

  const handleDeleteTournament = async () => {
    if (!isAdmin) {
      alert('Only administrators can delete tournaments.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${tournament.name}"? This action cannot be undone and will delete all rounds, scorecards, and matches associated with this tournament.`)) {
      try {
        await deleteTournament(tournamentId);
        navigate('/tournaments');
      } catch (error) {
        console.error('Error deleting tournament:', error);
        alert('Failed to delete tournament. Please try again.');
      }
    }
  };

  // Notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); // Auto-dismiss after 3 seconds
  };

  // Round management functions
  const handleAddRound = async () => {
    if (roundOperationLoading) return;

    try {
      setRoundOperationLoading(true);
      const activeRounds = (tournament.rounds || []).filter(r => !r.deleted);
      const newRound = {
        id: `round-${Date.now()}`,
        roundNumber: activeRounds.length + 1,
        name: `Round ${activeRounds.length + 1}`,
        date: tournament.endDate, // Default to last day
        format: null,
        status: 'not_started',
        courseData: { holes: [], totalPar: 0 },
        matches: [],
        scorecards: [],
        teamScorecards: [],
        deleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedRounds = [...(tournament.rounds || []), newRound];
      await updateTournament(tournamentId, { rounds: updatedRounds });
      showNotification(`${newRound.name} added successfully`, 'success');

      // Auto-expand the new round
      setExpandedRounds(prev => {
        const newSet = new Set(prev);
        newSet.add(newRound.id);
        return newSet;
      });
    } catch (error) {
      console.error('Error adding round:', error);
      showNotification('Failed to add round. Please try again.', 'error');
    } finally {
      setRoundOperationLoading(false);
    }
  };

  const canDeleteRound = (round) => {
    // Check for scored data
    const hasScores =
      (round.scorecards?.some(sc => sc.status !== 'not_started')) ||
      (round.teamScorecards?.some(sc => sc.status !== 'not_started')) ||
      (round.matches?.some(m => m.status !== 'setup'));
    return !hasScores;
  };

  const handleDeleteRound = async (roundId) => {
    if (roundOperationLoading) return;

    try {
      const round = tournament.rounds.find(r => r.id === roundId);

      if (!canDeleteRound(round)) {
        showNotification('Cannot delete round with scored data. Please clear scores first.', 'error');
        return;
      }

      if (!window.confirm(`Delete ${round.name}? This will hide it from view.`)) {
        return;
      }

      setRoundOperationLoading(true);

      // Soft delete: mark as deleted
      const updatedRounds = tournament.rounds.map(r =>
        r.id === roundId ? { ...r, deleted: true, updatedAt: new Date().toISOString() } : r
      );

      // Renumber remaining active rounds
      const activeRounds = updatedRounds.filter(r => !r.deleted);
      activeRounds.forEach((r, idx) => {
        r.roundNumber = idx + 1;
        r.name = r.name.replace(/Round \d+/, `Round ${idx + 1}`);
      });

      await updateTournament(tournamentId, { rounds: updatedRounds });
      showNotification(`${round.name} deleted successfully`, 'success');

      // Collapse the deleted round
      setExpandedRounds(prev => {
        const newSet = new Set(prev);
        newSet.delete(roundId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting round:', error);
      showNotification('Failed to delete round. Please try again.', 'error');
    } finally {
      setRoundOperationLoading(false);
    }
  };

  const toggleRoundExpansion = (roundId) => {
    setExpandedRounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roundId)) {
        newSet.delete(roundId);
      } else {
        newSet.add(roundId);
      }
      return newSet;
    });
  };

  // Round editing functions
  const handleStartEditRound = (round) => {
    setEditingRoundId(round.id);
    setEditingRoundData({
      name: round.name,
      date: round.date,
      format: round.format
    });
  };

  const handleCancelEditRound = () => {
    setEditingRoundId(null);
    setEditingRoundData(null);
  };

  const handleConfigureRoundCourse = (round) => {
    if (!round.format) {
      alert('Please select a round format before configuring the course');
      return;
    }
    setConfiguringRound(round);
    setShowCourseConfig(true);
  };

  const handleSetupRoundScoring = (round) => {
    if (!round.format) {
      alert('Please select a round format before setting up scoring');
      return;
    }

    if (!round.courseData?.holes?.length) {
      alert('Please configure the course before setting up scoring');
      return;
    }

    setConfiguringRound(round);

    // Show appropriate setup modal based on format
    if (['match_play_singles', 'four_ball', 'foursomes'].includes(round.format)) {
      setShowMatchSetup(true);
    } else if (['scramble', 'shamble', 'best_ball', 'team_stableford'].includes(round.format)) {
      // Check if teams are configured for team formats
      if (!tournament.teams || tournament.teams.length === 0) {
        const shouldSetupTeams = window.confirm(
          'No teams are configured for this tournament. Would you like to set up teams now?\n\n' +
          'Team-based formats require teams to be configured.'
        );
        if (shouldSetupTeams) {
          if (!tournament.hasTeams) {
            updateTournament(tournamentId, { hasTeams: true }).catch(err => {
              console.error('Error enabling teams:', err);
            });
          }
          setShowTeamEditor(true);
        }
        return;
      }
      setShowTeamScorecardSetup(true);
    } else {
      setShowScorecardSetup(true);
    }
  };

  const handleUpdateRound = async (roundId) => {
    if (roundOperationLoading) return;

    try {
      const roundIndex = tournament.rounds.findIndex(r => r.id === roundId);
      const existingRound = tournament.rounds[roundIndex];

      // Validation
      if (!editingRoundData.name || !editingRoundData.name.trim()) {
        showNotification('Round name cannot be empty', 'error');
        return;
      }

      if (!editingRoundData.date) {
        showNotification('Round date is required', 'error');
        return;
      }

      // Check if format is changing and round has data
      if (editingRoundData.format && editingRoundData.format !== existingRound.format) {
        const hasData =
          (existingRound.scorecards?.length > 0) ||
          (existingRound.teamScorecards?.length > 0) ||
          (existingRound.matches?.length > 0);

        if (hasData) {
          const confirmed = window.confirm(
            'Changing format will clear all scoring configurations (matches/scorecards). Continue?'
          );
          if (!confirmed) return;
        }
      }

      setRoundOperationLoading(true);

      // Build updates object
      const updates = {
        name: editingRoundData.name.trim(),
        date: editingRoundData.date,
        format: editingRoundData.format,
        updatedAt: new Date().toISOString()
      };

      // Clear format-specific data if format changed
      if (editingRoundData.format !== existingRound.format) {
        updates.scorecards = [];
        updates.teamScorecards = [];
        updates.matches = [];
      }

      // Update the round
      const updatedRounds = [...tournament.rounds];
      updatedRounds[roundIndex] = {
        ...existingRound,
        ...updates
      };

      await updateTournament(tournamentId, { rounds: updatedRounds });
      showNotification(`${updates.name} updated successfully`, 'success');

      // Clear editing state
      setEditingRoundId(null);
      setEditingRoundData(null);
    } catch (error) {
      showNotification('Failed to update round. Please try again.', 'error');
    } finally {
      setRoundOperationLoading(false);
    }
  };

  if (loading || !tournament) {
    return (
      <div className="tournament-detail">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-detail">
      <div className="detail-container">
        {/* Header */}
        <TournamentHeader
          tournament={tournament}
          series={series}
          onBack={() => navigate('/tournaments')}
          onCompleteTournament={handleCompleteTournament}
          onOpenEditModal={handleOpenEditModal}
        />

        {/* Playoff Alert Banner */}
        {tournament.rounds?.some(round => isStablefordRound(round)) && tournament.status === 'in_progress' && !tournament.winner && (
          <PlayoffAlert
            playoffData={detectPlayoff()}
            onResolvePlayoff={handleOpenPlayoffManager}
          />
        )}

        {/* Tournament Winner Banner */}
        <WinnerBanner
          winner={tournament.winner}
          winnerDetails={tournament.winnerDetails}
        />

        {/* My Scorecards - Only for players */}
        {currentPlayer && !isAdmin && (
          <MyScorecardsSection
            scorecards={getMyAllScorecards()}
            onNavigateToScorecard={navigateToScorecard}
            getHolesCompleted={getHolesCompleted}
          />
        )}

        {/* Teams Section (for team formats only) */}
        {isTeamFormat() && (
          <TeamsSection
            teams={tournament.teams}
            players={players}
            onEditTeams={() => setShowTeamEditor(true)}
          />
        )}

        {/* Rounds Section */}
        <div className="card rounds-section">
          <h2>Rounds</h2>
          <p className="section-subtitle">Configure and manage tournament rounds</p>

          {tournament.rounds && tournament.rounds.filter(r => !r.deleted).length > 0 ? (
            <div className="rounds-layout">
              {/* Round List */}
              <div className="rounds-list">
                {tournament.rounds.filter(r => !r.deleted).map((round, index) => (
                  <div
                    key={round.id}
                    className={`round-item ${selectedRound?.id === round.id ? 'selected' : ''}`}
                    onClick={() => handleRoundSelect(round)}
                  >
                    <div className="round-item-header">
                      <div className="round-number">Round {round.roundNumber}</div>
                      <span className={`status-badge ${getStatusBadge(round.status).className}`}>
                        {getStatusBadge(round.status).label}
                      </span>
                    </div>
                    <div className="round-item-name">{round.name}</div>
                    <div className="round-item-date">
                      {new Date(round.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Round Details */}
              {selectedRound && (
                <div className="round-details">
                  <div className="round-details-header">
                    <h3>{selectedRound.name}</h3>
                    <div className="round-actions">
                      <button
                        onClick={() => updateRoundCourse(selectedRound)}
                        className="button secondary small"
                      >
                        <PencilIcon className="icon" />
                        Configure Course
                      </button>
                      {(selectedRound.format === 'match_play_singles' || selectedRound.format === 'four_ball' || selectedRound.format === 'foursomes') && (
                        <button
                          onClick={() => openMatchSetup(selectedRound)}
                          className="button secondary small"
                        >
                          <UserGroupIcon className="icon" />
                          Setup Matches
                        </button>
                      )}
                      {(selectedRound.format === 'individual_stroke' || selectedRound.format === 'individual_stableford') && (
                        <button
                          onClick={() => openScorecardSetup(selectedRound)}
                          className="button secondary small"
                        >
                          <UserGroupIcon className="icon" />
                          Setup Scorecards
                        </button>
                      )}
                      {isTeamScorecardFormat(selectedRound) && (
                        <button
                          onClick={() => openTeamScorecardSetup(selectedRound)}
                          className="button secondary small"
                        >
                          <UserGroupIcon className="icon" />
                          Setup Team Scorecards
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="round-info-grid">
                    <div className="round-info-item">
                      <span className="round-info-label">Date:</span>
                      <span className="round-info-value">
                        {new Date(selectedRound.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="round-info-item">
                      <span className="round-info-label">Format:</span>
                      <span className="round-info-value" style={{ textTransform: 'capitalize' }}>
                        {selectedRound.format ? selectedRound.format.replace(/_/g, ' ') : 'Not set'}
                      </span>
                    </div>
                    <div className="round-info-item">
                      <span className="round-info-label">Course:</span>
                      <span className="round-info-value">{selectedRound.courseName}</span>
                    </div>
                    <div className="round-info-item">
                      <span className="round-info-label">Par:</span>
                      <span className="round-info-value">
                        {selectedRound.courseData?.totalPar || 'Not set'}
                      </span>
                    </div>
                    <div className="round-info-item">
                      <span className="round-info-label">Holes Configured:</span>
                      <span className="round-info-value">
                        {selectedRound.courseData?.holes?.length || 0} / 18
                      </span>
                    </div>
                  </div>

                  {selectedRound.courseData?.holes?.length > 0 ? (
                    <div className="holes-table-section">
                      <button
                        onClick={() => setHoleConfigExpanded(!holeConfigExpanded)}
                        className="holes-table-toggle"
                      >
                        <h4>Hole Configuration</h4>
                        {holeConfigExpanded ? (
                          <ChevronUpIcon className="icon" />
                        ) : (
                          <ChevronDownIcon className="icon" />
                        )}
                      </button>
                      {holeConfigExpanded && (
                        <div className="holes-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Hole</th>
                                <th>Par</th>
                                <th>Stroke Index</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRound.courseData.holes.map((hole) => (
                                <tr key={hole.number}>
                                  <td>{hole.number}</td>
                                  <td>{hole.par}</td>
                                  <td>{hole.strokeIndex}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No course data configured for this round yet. Click "Configure Course" above to set up the holes.</p>
                    </div>
                  )}

                  {/* Scorecards Section for Individual/Stableford */}
                  {(selectedRound.format === 'individual_stroke' || isStablefordRound(selectedRound)) && selectedRound.scorecards && selectedRound.scorecards.length > 0 && (
                    <div className="scorecards-section">
                      <h4>Scorecards ({selectedRound.scorecards.length})</h4>
                      <div className="scorecards-grid">
                        {selectedRound.scorecards.map((scorecard) => {
                          const scorecardPlayer = getPlayer(scorecard.playerId);
                          const holesCompleted = scorecard.holes.filter(h => h.grossScore !== null).length;
                          const progress = (holesCompleted / 18) * 100;

                          return (
                            <div
                              key={scorecard.id}
                              className="scorecard-card clickable"
                              onClick={() => {
                                if (isStablefordRound(selectedRound)) {
                                  navigate(`/tournaments/${tournamentId}/rounds/${selectedRound.id}/stableford/${scorecard.id}`);
                                } else {
                                  navigate(`/tournaments/${tournamentId}/rounds/${selectedRound.id}/scorecards/${scorecard.id}`);
                                }
                              }}
                            >
                              <div className="scorecard-header">
                                <div className="scorecard-player">
                                  <div className="player-name">{scorecardPlayer?.name}</div>
                                  <div className="player-handicap">HCP: {scorecardPlayer?.handicap.toFixed(1)}</div>
                                </div>
                                <span className={`status-badge ${scorecard.status === 'completed' ? 'status-badge-completed' : scorecard.status === 'in_progress' ? 'status-badge-in-progress' : 'status-badge-setup'}`}>
                                  {scorecard.status === 'completed' ? 'Completed' : scorecard.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                </span>
                              </div>

                              <div className="scorecard-progress">
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="progress-text">{holesCompleted} / 18 holes</div>
                              </div>

                              <div className="scorecard-scores">
                                {scorecard.totalGross > 0 && (
                                  <>
                                    <div className="score-item">
                                      <span className="score-label">Gross</span>
                                      <span className="score-value">{scorecard.totalGross}</span>
                                    </div>
                                    <div className="score-item">
                                      <span className="score-label">Net</span>
                                      <span className="score-value">{scorecard.totalNet}</span>
                                    </div>
                                    {isStablefordRound(selectedRound) && (
                                      <div className="score-item">
                                        <span className="score-label">Points</span>
                                        <span className="score-value stableford">{scorecard.totalPoints || 0}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Matches Section for Match Play Formats */}
                  {(selectedRound.format === 'match_play_singles' || selectedRound.format === 'four_ball' || selectedRound.format === 'foursomes') && selectedRound.matches && selectedRound.matches.length > 0 && (
                    <div className="scorecards-section">
                      <h4>Matches ({selectedRound.matches.length})</h4>
                      <div className="scorecards-grid">
                        {selectedRound.matches.map((match) => {
                          const isIndividual = !tournament.hasTeams;
                          let player1Name, player2Name, matchTitle;

                          if (isIndividual) {
                            if (match.format === 'singles') {
                              player1Name = getPlayer(match.player1)?.name || 'TBD';
                              player2Name = getPlayer(match.player2)?.name || 'TBD';
                              matchTitle = `${player1Name} vs ${player2Name}`;
                            } else {
                              const p1a = getPlayer(match.partnership1?.[0])?.name || 'TBD';
                              const p1b = getPlayer(match.partnership1?.[1])?.name || 'TBD';
                              const p2a = getPlayer(match.partnership2?.[0])?.name || 'TBD';
                              const p2b = getPlayer(match.partnership2?.[1])?.name || 'TBD';
                              matchTitle = `${p1a} & ${p1b} vs ${p2a} & ${p2b}`;
                            }
                          } else {
                            const team1Players = match.team1Players?.map(id => getPlayer(id)?.name).filter(Boolean).join(' & ') || 'TBD';
                            const team2Players = match.team2Players?.map(id => getPlayer(id)?.name).filter(Boolean).join(' & ') || 'TBD';
                            matchTitle = `${team1Players} vs ${team2Players}`;
                          }

                          const holesCompleted = match.status === 'completed' ? 18 : (match.currentHole ? match.currentHole - 1 : 0);
                          const progress = (holesCompleted / 18) * 100;

                          return (
                            <div
                              key={match.id}
                              className="scorecard-card clickable"
                              onClick={() => {
                                navigate(`/scoring/${match.id}`);
                              }}
                            >
                              <div className="scorecard-header">
                                <div className="scorecard-player">
                                  <div className="player-name">{match.name || `Match ${match.matchNumber}`}</div>
                                  <div className="player-handicap" style={{ fontSize: '0.75rem' }}>{matchTitle}</div>
                                </div>
                                <span className={`status-badge ${match.status === 'completed' ? 'status-badge-completed' : match.status === 'in_progress' ? 'status-badge-in-progress' : 'status-badge-setup'}`}>
                                  {match.status === 'completed' ? 'Completed' : match.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                </span>
                              </div>

                              <div className="scorecard-progress">
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="progress-text">{holesCompleted} / 18 holes</div>
                              </div>

                              <div className="scorecard-scores">
                                {match.status === 'in_progress' && !match.result && (
                                  <div className="score-item">
                                    <span className="score-label">Progress</span>
                                    <span className="score-value">{holesCompleted} / 18</span>
                                  </div>
                                )}
                                {match.result && (
                                  <div className="score-item">
                                    <span className="score-label">Result</span>
                                    <span className="score-value">{match.result}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Team Scorecards Section for Team Formats */}
                  {isTeamScorecardFormat(selectedRound) && selectedRound.teamScorecards && selectedRound.teamScorecards.length > 0 && (
                    <div className="scorecards-section">
                      <h4>Team Scorecards ({selectedRound.teamScorecards.length})</h4>
                      <div className="scorecards-grid">
                        {selectedRound.teamScorecards.map((teamScorecard) => {
                          const team = tournament.teams?.find(t => t.id === teamScorecard.teamId);

                          // Calculate holes completed from playerScores
                          let holesCompleted = 0;
                          if (teamScorecard.playerScores) {
                            // Count holes where at least one player has scored
                            for (let i = 0; i < 18; i++) {
                              const hasScore = Object.values(teamScorecard.playerScores).some(playerHoles =>
                                playerHoles[i]?.grossScore !== null
                              );
                              if (hasScore) holesCompleted++;
                            }
                          }
                          const progress = (holesCompleted / 18) * 100;

                          return (
                            <div
                              key={teamScorecard.id}
                              className="scorecard-card clickable"
                              onClick={() => {
                                // Navigate to appropriate scoring screen based on format
                                if (selectedRound.format === 'scramble') {
                                  navigate(`/tournaments/${tournamentId}/rounds/${selectedRound.id}/scramble/${team.id}`);
                                } else if (selectedRound.format === 'shamble') {
                                  navigate(`/tournaments/${tournamentId}/rounds/${selectedRound.id}/shamble/${team.id}`);
                                } else if (selectedRound.format === 'best_ball') {
                                  navigate(`/tournaments/${tournamentId}/rounds/${selectedRound.id}/bestball/${team.id}`);
                                } else if (selectedRound.format === 'team_stableford') {
                                  navigate(`/tournaments/${tournamentId}/rounds/${selectedRound.id}/team-stableford/${team.id}`);
                                }
                              }}
                            >
                              <div className="scorecard-header">
                                <div className="scorecard-player">
                                  <div className="team-name-display">
                                    <span className="team-color-dot" style={{ backgroundColor: team?.color }}></span>
                                    <div className="player-name">{team?.name}</div>
                                  </div>
                                  <div className="player-handicap">
                                    {team?.players?.length || 0} player{team?.players?.length !== 1 ? 's' : ''}
                                  </div>
                                </div>
                                <span className={`status-badge ${
                                  teamScorecard.status === 'completed'
                                    ? 'status-badge-completed'
                                    : (holesCompleted > 0 && holesCompleted < 18) || teamScorecard.status === 'in_progress'
                                      ? 'status-badge-in-progress'
                                      : 'status-badge-setup'
                                }`}>
                                  {teamScorecard.status === 'completed'
                                    ? 'Completed'
                                    : (holesCompleted > 0 && holesCompleted < 18) || teamScorecard.status === 'in_progress'
                                      ? 'In Progress'
                                      : 'Not Started'}
                                </span>
                              </div>

                              <div className="scorecard-progress">
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="progress-text">{holesCompleted} / 18 holes</div>
                              </div>

                              <div className="scorecard-scores">
                                {teamScorecard.totalGross > 0 && (
                                  <>
                                    <div className="score-item">
                                      <span className="score-label">Gross</span>
                                      <span className="score-value">{teamScorecard.totalGross}</span>
                                    </div>
                                    <div className="score-item">
                                      <span className="score-label">Net</span>
                                      <span className="score-value">{teamScorecard.totalNet}</span>
                                    </div>
                                    {selectedRound.format === 'team_stableford' && (
                                      <div className="score-item">
                                        <span className="score-label">Points</span>
                                        <span className="score-value stableford">{teamScorecard.totalPoints || 0}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>No rounds configured for this tournament.</p>
            </div>
          )}
        </div>

        {/* Notes Section */}
        {tournament.notes && (
          <div className="card notes-section">
            <h3>Notes</h3>
            <p>{tournament.notes}</p>
          </div>
        )}

        {/* Media Gallery */}
        <div className="card media-gallery-section">
          <MediaGallery tournamentId={tournament.id} />
        </div>

        {/* Players Section */}
        <div className="card players-section">
          <h2>Players</h2>
          <p className="section-subtitle">{tournament.players.length} players registered</p>

          <div className="players-grid">
            {tournament.players.map(playerId => {
              const player = getPlayer(playerId);
              return player ? (
                <div key={playerId} className="player-card">
                  <div className="player-name">{player.name}</div>
                  <div className="player-handicap">HCP: {player.handicap.toFixed(1)}</div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Course Configuration Modal */}
      {showCourseConfig && configuringRound && (
        <RoundCourseConfig
          round={configuringRound}
          tournamentFormat={configuringRound.format}
          onSave={handleSaveCourseConfig}
          onClose={() => {
            setShowCourseConfig(false);
            setConfiguringRound(null);
          }}
        />
      )}

      {/* Match Setup Modal */}
      {showMatchSetup && configuringRound && (configuringRound.format === 'match_play_singles' || configuringRound.format === 'four_ball' || configuringRound.format === 'foursomes') && (
        <RoundMatchSetup
          round={configuringRound}
          tournament={tournament}
          onSave={handleSaveMatchSetup}
          onClose={() => {
            setShowMatchSetup(false);
            setConfiguringRound(null);
          }}
        />
      )}

      {/* Scorecard Setup Modal */}
      {showScorecardSetup && configuringRound && (configuringRound.format === 'individual_stroke' || isStablefordRound(configuringRound)) && (
        <RoundScorecardSetup
          round={configuringRound}
          tournament={tournament}
          onSave={handleSaveScorecardSetup}
          onClose={() => {
            setShowScorecardSetup(false);
            setConfiguringRound(null);
          }}
        />
      )}

      {/* Team Scorecard Setup Modal */}
      {showTeamScorecardSetup && configuringRound && isTeamScorecardFormat(configuringRound) && (
        <RoundTeamScorecardSetup
          round={configuringRound}
          tournament={tournament}
          onSave={handleSaveTeamScorecardSetup}
          onClose={() => {
            setShowTeamScorecardSetup(false);
            setConfiguringRound(null);
          }}
        />
      )}

      {/* Playoff Manager Modal */}
      {showPlayoffManager && playoffData && (
        <PlayoffManager
          tournament={tournament}
          round={playoffData.round}
          tiedPlayers={playoffData.tiedPlayers}
          onClose={() => {
            setShowPlayoffManager(false);
            setPlayoffData(null);
          }}
          onComplete={handlePlayoffComplete}
        />
      )}

      {/* Team Editor Modal */}
      {showTeamEditor && (
        <TeamEditorModal
          teams={tournament.teams || []}
          players={players}
          tournamentPlayers={tournament.players || []}
          onSave={handleSaveTeams}
          onClose={() => setShowTeamEditor(false)}
        />
      )}

      {/* Edit Details Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Tournament</h2>
              <button onClick={() => setShowEditModal(false)} className="close-button">×</button>
            </div>

            {/* Tab Switcher */}
            <div className="modal-tabs">
              <button
                className={`tab-button ${editTab === 'details' ? 'active' : ''}`}
                onClick={() => setEditTab('details')}
              >
                Details
              </button>
              <button
                className={`tab-button ${editTab === 'rounds' ? 'active' : ''}`}
                onClick={() => setEditTab('rounds')}
              >
                Rounds
              </button>
            </div>

            <div className="modal-body">
              {/* Details Tab */}
              {editTab === 'details' && (
                <>
                  <div className="form-group">
                    <label htmlFor="tournament-name">Tournament Name</label>
                    <input
                      id="tournament-name"
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="input"
                      placeholder="Tournament Name"
                    />
                  </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start-date">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end-date">End Date</label>
                  <input
                    id="end-date"
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="input"
                  rows="4"
                  placeholder="Add any notes or description for this tournament..."
                />
              </div>

              <div className="form-group">
                <label>Players ({editFormData.players.length} selected)</label>
                <div className="player-selection-grid">
                  {players.map(player => (
                    <div
                      key={player.id}
                      className={`player-selection-item ${editFormData.players.includes(player.id) ? 'selected' : ''}`}
                      onClick={() => handleTogglePlayer(player.id)}
                    >
                      <div className="player-selection-info">
                        <div className="player-name">{player.name}</div>
                        <div className="player-handicap">HCP: {player.handicap.toFixed(1)}</div>
                      </div>
                      <div className="player-selection-checkbox">
                        {editFormData.players.includes(player.id) ? '✓' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="danger-zone">
                  <h3>Danger Zone</h3>
                  <p className="danger-warning">
                    Deleting a tournament will permanently remove all rounds, scorecards, and matches. This action cannot be undone.
                  </p>
                  <button onClick={handleDeleteTournament} className="button danger">
                    <TrashIcon className="icon" />
                    Delete Tournament
                  </button>
                </div>
              )}
                </>
              )}

              {/* Rounds Tab */}
              {editTab === 'rounds' && (
                <div className="rounds-editor">
                  {/* Notification */}
                  {notification && (
                    <div className={`notification notification-${notification.type}`}>
                      <span className="notification-message">{notification.message}</span>
                      <button
                        className="notification-close"
                        onClick={() => setNotification(null)}
                        aria-label="Close notification"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <div className="rounds-header">
                    <p className="rounds-info">
                      Manage tournament rounds. {isAdmin && 'All admins can edit rounds.'}
                    </p>
                    {isAdmin && (
                      <button
                        onClick={handleAddRound}
                        className={`button primary ${roundOperationLoading ? 'loading' : ''}`}
                        disabled={roundOperationLoading}
                      >
                        {roundOperationLoading ? (
                          <>
                            <span className="spinner-small"></span>
                            Adding...
                          </>
                        ) : (
                          <>
                            <span className="button-icon">+</span>
                            Add Round
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="rounds-list">
                    {(tournament.rounds || [])
                      .filter(round => !round.deleted)
                      .map((round, index) => {
                        const isExpanded = expandedRounds.has(round.id);
                        const hasScores = !canDeleteRound(round);
                        const statusBadge = round.status === 'completed' ? '✓' :
                                          round.status === 'in_progress' ? '▶' : '○';

                        return (
                          <div key={round.id} className={`round-item ${isExpanded ? 'expanded' : ''}`}>
                            <div className="round-item-header" onClick={() => toggleRoundExpansion(round.id)}>
                              <div className="round-item-info">
                                <div className="round-item-title">
                                  <span className="round-status-badge">{statusBadge}</span>
                                  <strong>{round.name || `Round ${round.roundNumber}`}</strong>
                                </div>
                                <div className="round-item-meta">
                                  {round.format ? (
                                    <span className="round-format">
                                      {round.format.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                  ) : (
                                    <span className="round-format-empty">No format set</span>
                                  )}
                                  <span className="round-date">{round.date || 'No date'}</span>
                                </div>
                              </div>
                              <div className="round-item-actions" onClick={(e) => e.stopPropagation()}>
                                <button className="icon-button" title="Expand">
                                  {isExpanded ? '▲' : '▼'}
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="round-item-details">
                                {editingRoundId === round.id ? (
                                  /* Edit Mode */
                                  <>
                                    <div className="round-edit-form">
                                      <div className="form-group">
                                        <label>Round Name</label>
                                        <input
                                          type="text"
                                          className="input"
                                          value={editingRoundData.name}
                                          onChange={(e) => setEditingRoundData({ ...editingRoundData, name: e.target.value })}
                                          placeholder="Round name"
                                        />
                                      </div>

                                      <div className="form-group">
                                        <label>Date</label>
                                        <input
                                          type="date"
                                          className="input"
                                          value={editingRoundData.date}
                                          onChange={(e) => setEditingRoundData({ ...editingRoundData, date: e.target.value })}
                                        />
                                      </div>

                                      <div className="form-group">
                                        <label>Format</label>
                                        <select
                                          className="input"
                                          value={editingRoundData.format || ''}
                                          onChange={(e) => setEditingRoundData({ ...editingRoundData, format: e.target.value || null })}
                                        >
                                          <option value="">Select format...</option>
                                          <optgroup label="Individual Formats">
                                            <option value="individual_stroke">Individual Stroke Play</option>
                                            <option value="individual_stableford">Individual Stableford</option>
                                          </optgroup>
                                          <optgroup label="Match Play Formats">
                                            <option value="match_play_singles">Match Play Singles</option>
                                            <option value="four_ball">Four Ball</option>
                                            <option value="foursomes">Foursomes</option>
                                          </optgroup>
                                          <optgroup label="Team Formats">
                                            <option value="scramble">Scramble</option>
                                            <option value="shamble">Shamble</option>
                                            <option value="best_ball">Best Ball</option>
                                            <option value="team_stableford">Team Stableford</option>
                                          </optgroup>
                                        </select>
                                        {editingRoundData.format !== round.format && (round.scorecards?.length > 0 || round.teamScorecards?.length > 0 || round.matches?.length > 0) && (
                                          <div className="form-hint warning">
                                            ⚠ Changing format will clear existing scoring configurations
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Configuration Buttons */}
                                    <div className="round-config-section">
                                      <div className="round-config-label">Round Configuration</div>
                                      <div className="round-config-buttons">
                                        <button
                                          onClick={() => handleConfigureRoundCourse(round)}
                                          className={`button ${!editingRoundData.format ? 'disabled' : 'secondary'}`}
                                          disabled={!editingRoundData.format}
                                          title={!editingRoundData.format ? 'Select format first' : 'Configure course holes'}
                                        >
                                          Configure Course
                                        </button>
                                        <button
                                          onClick={() => handleSetupRoundScoring(round)}
                                          className={`button ${!editingRoundData.format || !round.courseData?.holes?.length ? 'disabled' : 'secondary'}`}
                                          disabled={!editingRoundData.format || !round.courseData?.holes?.length}
                                          title={!editingRoundData.format ? 'Select format first' : !round.courseData?.holes?.length ? 'Configure course first' : 'Setup matches/scorecards'}
                                        >
                                          Setup Scoring
                                        </button>
                                      </div>
                                    </div>

                                    <div className="round-item-buttons">
                                      <button
                                        onClick={handleCancelEditRound}
                                        className="button secondary"
                                        disabled={roundOperationLoading}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleUpdateRound(round.id)}
                                        className={`button primary ${roundOperationLoading ? 'loading' : ''}`}
                                        disabled={roundOperationLoading}
                                      >
                                        {roundOperationLoading ? (
                                          <>
                                            <span className="spinner-small"></span>
                                            Saving...
                                          </>
                                        ) : (
                                          'Save Changes'
                                        )}
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  /* View Mode */
                                  <>
                                    <div className="round-detail-row">
                                      <label>Round Number:</label>
                                      <span>{round.roundNumber}</span>
                                    </div>
                                    <div className="round-detail-row">
                                      <label>Status:</label>
                                      <span className={`status-badge status-${round.status}`}>
                                        {round.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </span>
                                    </div>
                                    <div className="round-detail-row">
                                      <label>Name:</label>
                                      <span>{round.name || `Round ${round.roundNumber}`}</span>
                                    </div>
                                    <div className="round-detail-row">
                                      <label>Date:</label>
                                      <span>{round.date || 'Not set'}</span>
                                    </div>
                                    <div className="round-detail-row">
                                      <label>Format:</label>
                                      <span>{round.format ? round.format.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not set'}</span>
                                    </div>
                                    <div className="round-detail-row">
                                      <label>Course:</label>
                                      <span>{round.courseData?.holes?.length > 0 ? `${round.courseData.holes.length} holes` : 'Not configured'}</span>
                                    </div>
                                    <div className="round-detail-row">
                                      <label>Scorecards:</label>
                                      <span>
                                        {(round.scorecards?.length || 0) + (round.teamScorecards?.length || 0) + (round.matches?.length || 0)} total
                                      </span>
                                    </div>

                                    {/* Configuration Buttons */}
                                    {isAdmin && (
                                      <div className="round-config-section">
                                        <div className="round-config-label">Round Configuration</div>
                                        <div className="round-config-buttons">
                                          <button
                                            onClick={() => handleConfigureRoundCourse(round)}
                                            className={`button ${!round.format ? 'disabled' : 'secondary'}`}
                                            disabled={!round.format}
                                            title={!round.format ? 'Select format first' : 'Configure course holes'}
                                          >
                                            Configure Course
                                          </button>
                                          <button
                                            onClick={() => handleSetupRoundScoring(round)}
                                            className={`button ${!round.format || !round.courseData?.holes?.length ? 'disabled' : 'secondary'}`}
                                            disabled={!round.format || !round.courseData?.holes?.length}
                                            title={!round.format ? 'Select format first' : !round.courseData?.holes?.length ? 'Configure course first' : 'Setup matches/scorecards'}
                                          >
                                            Setup Scoring
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    <div className="round-item-buttons">
                                      {isAdmin && (
                                        <>
                                          <button
                                            onClick={() => handleStartEditRound(round)}
                                            className="button secondary"
                                          >
                                            Edit Round
                                          </button>
                                          <button
                                            onClick={() => handleDeleteRound(round.id)}
                                            className={`button ${hasScores ? 'disabled' : 'danger'}`}
                                            disabled={hasScores}
                                            title={hasScores ? 'Cannot delete round with scored data' : 'Delete round'}
                                          >
                                            <TrashIcon className="icon" />
                                            {hasScores ? 'Has Scores' : 'Delete'}
                                          </button>
                                        </>
                                      )}
                                      {hasScores && (
                                        <div className="round-warning">
                                          ⚠ This round contains scored data and cannot be deleted
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                    {(tournament.rounds || []).filter(r => !r.deleted).length === 0 && (
                      <div className="empty-state">
                        <div className="empty-state-title">No rounds yet</div>
                        <p className="empty-state-description">
                          Rounds are individual competition sessions within your tournament.
                          Each round can have its own format, course, and scoring system.
                        </p>
                        <div className="empty-state-steps">
                          <div className="empty-state-step">
                            <strong>1. Add a round</strong>
                            <span>Click the "Add Round" button above</span>
                          </div>
                          <div className="empty-state-step">
                            <strong>2. Configure details</strong>
                            <span>Set the round name, date, and format</span>
                          </div>
                          <div className="empty-state-step">
                            <strong>3. Set up course</strong>
                            <span>Configure holes, pars, and yardages</span>
                          </div>
                          <div className="empty-state-step">
                            <strong>4. Start scoring</strong>
                            <span>Create matches or scorecards and begin tracking scores</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="button secondary">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="button primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TournamentDetail;
