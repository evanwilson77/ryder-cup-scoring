import { useState, useEffect } from 'react';
import { subscribeToTournament } from '../firebase/tournamentServices';

/**
 * Custom hook to subscribe to tournament data and extract a specific round
 *
 * @param {string} tournamentId - The tournament ID
 * @param {string} roundId - The round ID to extract
 * @returns {Object} - { tournament, round, loading, error }
 *
 * @example
 * const { tournament, round, loading } = useTournamentRound(tournamentId, roundId);
 */
export function useTournamentRound(tournamentId, roundId) {
  const [tournament, setTournament] = useState(null);
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tournamentId || !roundId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToTournament(tournamentId, (tournamentData) => {
      setTournament(tournamentData);

      const foundRound = tournamentData.rounds?.find(r => r.id === roundId);
      if (foundRound) {
        setRound(foundRound);
        setError(null);
      } else {
        setError(new Error('Round not found'));
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [tournamentId, roundId]);

  return { tournament, round, loading, error };
}
