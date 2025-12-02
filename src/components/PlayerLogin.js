import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { subscribeToPlayers } from '../firebase/services';
import './PlayerLogin.css';

function PlayerLogin() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginAsPlayer, currentUser, currentPlayer, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load players
    const unsubscribe = subscribeToPlayers((playersData) => {
      // Only show players with auth accounts (have userId)
      setPlayers(playersData.filter(p => p.userId));
    });

    return () => unsubscribe();
  }, []);

  const handlePlayerSelect = async (player) => {
    setLoading(true);
    setError('');

    try {
      // If already logged in, logout first
      if (currentUser) {
        await logout();
      }

      await loginAsPlayer(player.email);
      // Redirect to tournaments after successful login
      navigate('/tournaments');
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please contact admin or try again.');
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="player-login">
      <div className="player-login-container">
        <div className="login-header">
          <h1>Ryder Cup Scoring</h1>
          {currentUser && currentPlayer ? (
            <>
              <p className="current-user-notice">
                Currently logged in as: <strong>{currentPlayer.name}</strong>
              </p>
              <p>Select a different player to switch accounts</p>
            </>
          ) : (
            <p>Select your name to continue</p>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="player-grid">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => handlePlayerSelect(player)}
              disabled={loading}
              className="player-card-button"
            >
              <div className="player-name">{player.name}</div>
              <div className="player-handicap">HCP {player.handicap.toFixed(1)}</div>
            </button>
          ))}

          {players.length === 0 && (
            <div className="no-players-message">
              <p><strong>No player accounts found.</strong></p>
              <p>If you're the admin, please add players through Player Management.</p>
              <p>Existing players may need to be recreated to generate login accounts.</p>
            </div>
          )}
        </div>

        <div className="login-footer">
          {currentUser ? (
            <button
              onClick={handleGoBack}
              className="back-link"
            >
              ← Back
            </button>
          ) : (
            <button
              onClick={() => navigate('/admin/login')}
              className="admin-link"
            >
              Admin Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerLogin;
