import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { subscribeToTournamentSeries } from '../firebase/tournamentServices';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, TrophyIcon, SparklesIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import './HonoursBoard.css';

function HonoursBoard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [honoursData, setHonoursData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToTournamentSeries((seriesData) => {
      setSeries(seriesData);

      // Auto-select Chaps Cup if available
      const chapsCup = seriesData.find(s => s.name === 'Chaps Cup');
      if (chapsCup && !selectedSeries) {
        setSelectedSeries(chapsCup.id);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedSeries]);

  useEffect(() => {
    if (selectedSeries) {
      loadHonoursData(selectedSeries);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeries]);

  const loadHonoursData = async (seriesId) => {
    try {
      // Get all tournaments for this series
      const tournamentsRef = collection(db, 'tournaments');
      const q = query(
        tournamentsRef,
        where('seriesId', '==', seriesId),
        orderBy('startDate', 'desc')
      );

      const snapshot = await getDocs(q);
      const tournaments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get historic entries from honoursBoard collection
      const honoursRef = collection(db, 'honoursBoard');
      const hq = query(
        honoursRef,
        where('seriesId', '==', seriesId),
        orderBy('year', 'desc')
      );

      const honoursSnapshot = await getDocs(hq);
      const historicEntries = honoursSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Extract winners and statistics
      const winners = [];
      const playerStats = new Map();

      // Process tournament data
      tournaments.forEach(tournament => {
        // Get winner from tournament
        const winner = getWinnerFromTournament(tournament);

        if (winner) {
          winners.push({
            year: new Date(tournament.startDate).getFullYear(),
            playerName: winner.name,
            playerId: winner.playerId,
            score: winner.score,
            tournamentName: tournament.name,
            date: tournament.startDate,
            isHistoric: false
          });

          // Update player stats
          if (!playerStats.has(winner.playerId)) {
            playerStats.set(winner.playerId, {
              playerId: winner.playerId,
              playerName: winner.name,
              wins: 0,
              runnersUp: 0,
              thirdPlace: 0,
              bestScore: null,
              years: []
            });
          }

          const stats = playerStats.get(winner.playerId);
          stats.wins += 1;
          stats.years.push(new Date(tournament.startDate).getFullYear());

          if (!stats.bestScore || winner.scoreNumeric > stats.bestScore) {
            stats.bestScore = winner.scoreNumeric;
          }
        }

        // Get runner-up
        const runnerUp = getRunnerUpFromTournament(tournament);
        if (runnerUp) {
          if (!playerStats.has(runnerUp.playerId)) {
            playerStats.set(runnerUp.playerId, {
              playerId: runnerUp.playerId,
              playerName: runnerUp.name,
              wins: 0,
              runnersUp: 0,
              thirdPlace: 0,
              bestScore: null,
              years: []
            });
          }
          playerStats.get(runnerUp.playerId).runnersUp += 1;
        }

        // Get third place
        const third = getThirdPlaceFromTournament(tournament);
        if (third) {
          if (!playerStats.has(third.playerId)) {
            playerStats.set(third.playerId, {
              playerId: third.playerId,
              playerName: third.name,
              wins: 0,
              runnersUp: 0,
              thirdPlace: 0,
              bestScore: null,
              years: []
            });
          }
          playerStats.get(third.playerId).thirdPlace += 1;
        }
      });

      // Process historic entries from honoursBoard collection
      historicEntries.forEach(entry => {
        // Add to winners list
        winners.push({
          year: entry.year,
          playerName: entry.winner,
          playerId: entry.winner, // Use winner name as ID for historic entries
          score: entry.winnerDetails?.score || 'N/A',
          tournamentName: entry.edition ? `${entry.year} (${entry.edition})` : entry.year.toString(),
          date: entry.date,
          isHistoric: true
        });

        // For historic entries, we'll count wins but won't have detailed player stats
        // since we don't have player IDs for historic data
        const playerId = entry.winner; // Using name as ID
        if (!playerStats.has(playerId)) {
          playerStats.set(playerId, {
            playerId: playerId,
            playerName: entry.winner,
            wins: 0,
            runnersUp: 0,
            thirdPlace: 0,
            bestScore: null,
            years: []
          });
        }
        const stats = playerStats.get(playerId);
        stats.wins += 1;
        stats.years.push(entry.year);
      });

      // Find most wins
      let mostWinsPlayer = null;
      let mostWinsCount = 0;
      playerStats.forEach(stats => {
        if (stats.wins > mostWinsCount) {
          mostWinsCount = stats.wins;
          mostWinsPlayer = stats;
        }
      });

      // Find record score
      let recordScore = null;
      winners.forEach(winner => {
        if (!recordScore || winner.scoreNumeric > recordScore.scoreNumeric) {
          recordScore = winner;
        }
      });

      setHonoursData({
        winners: winners.sort((a, b) => b.year - a.year),
        playerStats: Array.from(playerStats.values()).sort((a, b) => b.wins - a.wins),
        mostWinsPlayer,
        mostWinsCount,
        recordScore,
        totalEditions: tournaments.length,
        firstYear: winners.length > 0 ? Math.min(...winners.map(w => w.year)) : null
      });
    } catch (error) {
      console.error('Error loading honours data:', error);
      alert(`Error loading honours data: ${error.message}`);
    }
  };

  const getWinnerFromTournament = (tournament) => {
    if (!tournament.rounds || tournament.rounds.length === 0) return null;

    // Get the final round
    const finalRound = tournament.rounds[tournament.rounds.length - 1];

    if (finalRound.scorecards && finalRound.scorecards.length > 0) {
      // Sort by score (descending for stableford, ascending for stroke)
      const sortedScores = [...finalRound.scorecards].sort((a, b) => {
        if (finalRound.scoringFormat === 'stableford') {
          return (b.totalPoints || 0) - (a.totalPoints || 0);
        } else {
          return (a.totalNet || a.totalGross || 999) - (b.totalNet || b.totalGross || 999);
        }
      });

      const winner = sortedScores[0];
      return {
        name: winner.playerName,
        playerId: winner.playerId,
        score: finalRound.scoringFormat === 'stableford'
          ? `${winner.totalPoints} points`
          : `${winner.totalNet || winner.totalGross}`,
        scoreNumeric: finalRound.scoringFormat === 'stableford'
          ? winner.totalPoints
          : winner.totalNet || winner.totalGross
      };
    }

    return null;
  };

  const getRunnerUpFromTournament = (tournament) => {
    if (!tournament.rounds || tournament.rounds.length === 0) return null;
    const finalRound = tournament.rounds[tournament.rounds.length - 1];

    if (finalRound.scorecards && finalRound.scorecards.length > 1) {
      const sortedScores = [...finalRound.scorecards].sort((a, b) => {
        if (finalRound.scoringFormat === 'stableford') {
          return (b.totalPoints || 0) - (a.totalPoints || 0);
        } else {
          return (a.totalNet || a.totalGross || 999) - (b.totalNet || b.totalGross || 999);
        }
      });

      const runnerUp = sortedScores[1];
      return {
        name: runnerUp.playerName,
        playerId: runnerUp.playerId
      };
    }

    return null;
  };

  const getThirdPlaceFromTournament = (tournament) => {
    if (!tournament.rounds || tournament.rounds.length === 0) return null;
    const finalRound = tournament.rounds[tournament.rounds.length - 1];

    if (finalRound.scorecards && finalRound.scorecards.length > 2) {
      const sortedScores = [...finalRound.scorecards].sort((a, b) => {
        if (finalRound.scoringFormat === 'stableford') {
          return (b.totalPoints || 0) - (a.totalPoints || 0);
        } else {
          return (a.totalNet || a.totalGross || 999) - (b.totalNet || b.totalGross || 999);
        }
      });

      const third = sortedScores[2];
      return {
        name: third.playerName,
        playerId: third.playerId
      };
    }

    return null;
  };

  if (loading) {
    return (
      <div className="honours-board">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const selectedSeriesData = series.find(s => s.id === selectedSeries);

  return (
    <div className="honours-board">
      <div className="honours-container">
        {/* Header */}
        <div className="honours-header">
          <button
            onClick={() => navigate('/')}
            className="button secondary small back-button"
          >
            <ArrowLeftIcon className="icon" />
            Back
          </button>

          <div className="header-content">
            <div className="header-title">
              <SparklesIcon className="honours-icon" />
              <h1>Honours Board</h1>
            </div>
            <p className="header-subtitle">Celebrating Excellence in Golf</p>
          </div>

          {isAdmin && (
            <button
              onClick={() => navigate('/honours/admin')}
              className="button primary small admin-button"
            >
              <Cog6ToothIcon className="icon" />
              Admin
            </button>
          )}
        </div>

        {/* Series Selector */}
        <div className="series-selector">
          <h3>Select Series</h3>
          <div className="series-tabs">
            {series.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSeries(s.id)}
                className={`series-tab ${selectedSeries === s.id ? 'active' : ''}`}
              >
                <TrophyIcon className="tab-icon" />
                <span className="tab-name">{s.name}</span>
                <span className="tab-format">{s.format}</span>
              </button>
            ))}
          </div>
        </div>

        {honoursData && (
          <>
            {/* Series Header */}
            <div className="series-header-plaque">
              <div className="plaque-content">
                <h2 className="series-title">{selectedSeriesData?.name}</h2>
                <div className="series-details">
                  <span>Est. {honoursData.firstYear}</span>
                  <span className="separator">•</span>
                  <span>{honoursData.totalEditions} Editions</span>
                </div>
                {selectedSeriesData?.description && (
                  <p className="series-description">{selectedSeriesData.description}</p>
                )}
              </div>
            </div>

            {/* Champions Roll */}
            <div className="champions-section">
              <div className="section-header">
                <TrophyIcon className="section-icon" />
                <h3>Roll of Champions</h3>
              </div>

              <div className="champions-list">
                {honoursData.winners.map((winner, index) => (
                  <div key={index} className="champion-entry">
                    <div className="champion-year">{winner.year}</div>
                    <div className="champion-name">{winner.playerName}</div>
                    <div className="champion-score">{winner.score}</div>
                  </div>
                ))}
              </div>

              {honoursData.winners.length === 0 && (
                <div className="no-data">
                  <p>No champions recorded yet</p>
                  <p className="hint">Complete tournaments with scorecards to populate the Honours Board</p>
                </div>
              )}
            </div>

            {/* Records and Achievements */}
            <div className="records-section">
              <div className="section-header">
                <SparklesIcon className="section-icon" />
                <h3>Records & Achievements</h3>
              </div>

              <div className="records-grid">
                {honoursData.mostWinsPlayer && (
                  <div className="record-card most-wins">
                    <div className="record-label">Most Championships</div>
                    <div className="record-value">
                      {honoursData.mostWinsPlayer.playerName}
                    </div>
                    <div className="record-detail">
                      {honoursData.mostWinsCount} {honoursData.mostWinsCount === 1 ? 'win' : 'wins'}
                    </div>
                    <div className="record-years">
                      {honoursData.mostWinsPlayer.years.sort((a, b) => b - a).join(', ')}
                    </div>
                  </div>
                )}

                {honoursData.recordScore && (
                  <div className="record-card record-score">
                    <div className="record-label">Record Score</div>
                    <div className="record-value">{honoursData.recordScore.score}</div>
                    <div className="record-detail">
                      {honoursData.recordScore.playerName}
                    </div>
                    <div className="record-years">{honoursData.recordScore.year}</div>
                  </div>
                )}

                <div className="record-card total-editions">
                  <div className="record-label">Total Editions</div>
                  <div className="record-value">{honoursData.totalEditions}</div>
                  <div className="record-detail">
                    {honoursData.firstYear} - {new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </div>

            {/* Player Statistics */}
            {honoursData.playerStats.length > 0 && (
              <div className="player-stats-section">
                <div className="section-header">
                  <h3>Player Honours</h3>
                </div>

                <div className="stats-table">
                  <div className="stats-header">
                    <div className="col-player">Player</div>
                    <div className="col-wins">Wins</div>
                    <div className="col-runnerup">Runner-Up</div>
                    <div className="col-third">3rd Place</div>
                    <div className="col-best">Best Score</div>
                  </div>

                  {honoursData.playerStats.map((player, index) => (
                    <div key={player.playerId} className="stats-row">
                      <div className="col-player">
                        {index < 3 && (
                          <TrophyIcon className={`rank-icon rank-${index + 1}`} />
                        )}
                        {player.playerName}
                      </div>
                      <div className="col-wins">{player.wins}</div>
                      <div className="col-runnerup">{player.runnersUp}</div>
                      <div className="col-third">{player.thirdPlace}</div>
                      <div className="col-best">{player.bestScore || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default HonoursBoard;
