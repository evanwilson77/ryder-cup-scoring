import React, { useState } from 'react';
import { updateTournament } from '../../firebase/tournamentServices';
import './SubmitScorecardButton.css';

/**
 * Submit scorecard button component
 * Handles scorecard completion and round completion logic
 *
 * @param {Object} tournament - Tournament object
 * @param {string} roundId - Round ID
 * @param {string} scorecardId - Scorecard ID to complete
 * @param {Function} onComplete - Callback after successful completion (optional)
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} className - Additional CSS classes
 */
function SubmitScorecardButton({
  tournament,
  roundId,
  scorecardId,
  onComplete,
  disabled = false,
  className = ''
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const confirmed = window.confirm(
      'Complete and submit your scorecard? You won\'t be able to make changes after submission unless you are an admin.'
    );

    if (!confirmed) return;

    setSubmitting(true);

    try {
      // Find the round
      const roundIndex = tournament.rounds.findIndex(r => r.id === roundId);
      if (roundIndex === -1) {
        throw new Error('Round not found');
      }

      const updatedRounds = [...tournament.rounds];

      // Find and update the scorecard
      const scorecardIndex = updatedRounds[roundIndex].scorecards.findIndex(
        sc => sc.id === scorecardId
      );

      if (scorecardIndex === -1) {
        throw new Error('Scorecard not found');
      }

      // Update scorecard status
      updatedRounds[roundIndex].scorecards[scorecardIndex] = {
        ...updatedRounds[roundIndex].scorecards[scorecardIndex],
        status: 'completed',
        completedAt: new Date().toISOString()
      };

      // Check if all scorecards are now completed
      const allCompleted = updatedRounds[roundIndex].scorecards.every(sc =>
        sc.id === scorecardId ? true : sc.status === 'completed'
      );

      // If all scorecards are completed, mark the round as complete
      if (allCompleted) {
        updatedRounds[roundIndex] = {
          ...updatedRounds[roundIndex],
          status: 'completed',
          completedAt: new Date().toISOString()
        };
      }

      await updateTournament(tournament.id, { rounds: updatedRounds });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error submitting scorecard:', error);
      alert('Failed to submit scorecard. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`submit-scorecard-section ${className}`}>
      <button
        className="button primary large submit-scorecard-button"
        onClick={handleSubmit}
        disabled={disabled || submitting}
      >
        {submitting ? 'Submitting...' : '✓ Complete & Submit Scorecard'}
      </button>
      <p className="submit-note">
        All 18 holes have been scored. Review your scorecard before submitting.
      </p>
    </div>
  );
}

export default SubmitScorecardButton;
