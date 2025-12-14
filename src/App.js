import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import { initializeDefaultData } from './firebase/services';
import { initializeRegularPlayers } from './utils/initializePlayers';
import { initializeTournamentSeries } from './firebase/tournamentServices';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CourseSetup from './components/CourseSetup';
import MatchSetup from './components/MatchSetup';
import Leaderboard from './components/Leaderboard';
import Scoring from './components/Scoring';
import MatchDetail from './components/MatchDetail';
import PlayerManagement from './components/PlayerManagement';
import AdminLogin from './components/AdminLogin';
import PlayerLogin from './components/PlayerLogin';
import TournamentDashboard from './components/TournamentDashboard';
import TournamentCreation from './components/TournamentCreation';
import TournamentDetail from './components/TournamentDetail';
import ScorecardScoring from './components/ScorecardScoring';
import StablefordScoring from './components/StablefordScoring';
import BestBallScoring from './components/BestBallScoring';
import ScrambleScoring from './components/ScrambleScoring';
import ShambleScoring from './components/ShambleScoring';
import CourseLibrary from './components/CourseLibrary';
import SeriesLeaderboard from './components/SeriesLeaderboard';
import SeriesDashboard from './components/SeriesDashboard';
import SeriesManagement from './components/SeriesManagement';
import HonoursBoard from './components/HonoursBoard';
import HonoursBoardAdmin from './components/HonoursBoardAdmin';
import Help from './components/Help';
import PlayerMigration from './components/PlayerMigration';
import AnomalyLogs from './components/AnomalyLogs';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PullToRefresh from './components/PullToRefresh';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { useMobileOptimizations, usePerformanceMonitor } from './hooks/useMobileOptimizations';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  // Wait for auth to finish loading
  if (loading) {
    return (
      <div className="App loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/player-login" replace />;
  }

  return children;
}

function AppHeader() {
  const { isAdmin, currentPlayer, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = React.useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    }

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSettings]);

  const handleLogout = async () => {
    setShowSettings(false);
    await logout();
    navigate('/player-login', { replace: true });
  };

  return (
    <header className="App-header">
      <h1>⛳ Ryder Cup Scoring</h1>
      <nav>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/tournaments">Tournaments</Link>
        <Link to="/honours">Honours Board</Link>
        <div className="settings-dropdown" ref={settingsRef}>
          <button
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
          >
            {isAdmin ? 'Admin' : currentPlayer ? currentPlayer.name : 'Settings'} ▾
          </button>
          {showSettings && (
            <div className="settings-menu">
              <Link to="/help" onClick={() => setShowSettings(false)}>📖 Help & Guide</Link>
              <Link to="/player-login" onClick={() => setShowSettings(false)}>👤 Player Login</Link>
              {isAdmin && (
                <>
                  <Link to="/courses" onClick={() => setShowSettings(false)}>Course Library</Link>
                  <Link to="/players" onClick={() => setShowSettings(false)}>Players</Link>
                  <Link to="/series-management" onClick={() => setShowSettings(false)}>Manage Series</Link>
                  <Link to="/admin/anomaly-logs" onClick={() => setShowSettings(false)}>🔍 Anomaly Logs</Link>
                </>
              )}
              <button onClick={handleLogout} className="dropdown-item">
                Logout {isAdmin ? '(Admin)' : ''}
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function AppContent() {
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Mobile optimizations
  const {
    pullToRefreshDistance,
    showPWAPrompt,
    installPWA,
    dismissPWAPrompt
  } = useMobileOptimizations();

  // Performance monitoring
  usePerformanceMonitor();

  useEffect(() => {
    // Initialize default data only after user is authenticated
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Run initializations with individual error handling
    // These functions check if data already exists, so permission errors are OK
    const initTasks = [
      initializeDefaultData().catch(e => {
        // Silently fail - data might already exist or will be created when needed
        if (e.code !== 'permission-denied') {
          console.warn('Could not initialize default data:', e.message);
        }
      }),
      initializeRegularPlayers().catch(e => {
        if (e.code !== 'permission-denied') {
          console.warn('Could not initialize players:', e.message);
        }
      }),
      initializeTournamentSeries().catch(e => {
        if (e.code !== 'permission-denied') {
          console.warn('Could not initialize tournament series:', e.message);
        }
      })
    ];

    Promise.all(initTasks).finally(() => {
      setLoading(false);
    });
  }, [currentUser]);

  if (loading) {
    return (
      <div className="App loading">
        <div className="spinner"></div>
        <p>Loading Ryder Cup...</p>
      </div>
    );
  }

  // Check if we're on a login page
  const isLoginPage = window.location.pathname === '/player-login' ||
                      window.location.pathname === '/admin/login';

  return (
    <div className="App">
      {/* Pull to Refresh Indicator */}
      <PullToRefresh distance={pullToRefreshDistance} />

      {/* Only show header if logged in */}
      {currentUser && !isLoginPage && <AppHeader />}

      <main className="App-main">
        <Routes>
          {/* Public routes */}
          <Route path="/player-login" element={<PlayerLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected routes - require authentication */}
          <Route path="/" element={<ProtectedRoute><Navigate to="/tournaments" replace /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><CourseLibrary /></ProtectedRoute>} />
          <Route path="/players" element={<ProtectedRoute><PlayerManagement /></ProtectedRoute>} />
          <Route path="/admin/migrate-players" element={<ProtectedRoute><PlayerMigration /></ProtectedRoute>} />
          <Route path="/admin/anomaly-logs" element={<ProtectedRoute><AnomalyLogs /></ProtectedRoute>} />
          <Route path="/tournaments" element={<ProtectedRoute><TournamentDashboard /></ProtectedRoute>} />
          <Route path="/tournaments/create" element={<ProtectedRoute><TournamentCreation /></ProtectedRoute>} />
          <Route path="/tournaments/:tournamentId" element={<ProtectedRoute><TournamentDetail /></ProtectedRoute>} />
          <Route path="/series-management" element={<ProtectedRoute><SeriesManagement /></ProtectedRoute>} />
          <Route path="/series/:seriesId/dashboard" element={<ProtectedRoute><SeriesDashboard /></ProtectedRoute>} />
          <Route path="/series/:seriesId" element={<ProtectedRoute><SeriesLeaderboard /></ProtectedRoute>} />
          <Route path="/honours" element={<ProtectedRoute><HonoursBoard /></ProtectedRoute>} />
          <Route path="/honours/admin" element={<ProtectedRoute><HonoursBoardAdmin /></ProtectedRoute>} />
          <Route path="/tournaments/:tournamentId/rounds/:roundId/scorecards/:scorecardId" element={<ProtectedRoute><ScorecardScoring /></ProtectedRoute>} />
          <Route path="/tournaments/:tournamentId/rounds/:roundId/stableford/:scorecardId" element={<ProtectedRoute><StablefordScoring /></ProtectedRoute>} />
          <Route path="/tournaments/:tournamentId/rounds/:roundId/bestball/:teamId" element={<ProtectedRoute><BestBallScoring /></ProtectedRoute>} />
          <Route path="/tournaments/:tournamentId/rounds/:roundId/team-stableford/:teamId" element={<ProtectedRoute><BestBallScoring /></ProtectedRoute>} />
          <Route path="/tournaments/:tournamentId/rounds/:roundId/scramble/:teamId" element={<ProtectedRoute><ScrambleScoring /></ProtectedRoute>} />
          <Route path="/tournaments/:tournamentId/rounds/:roundId/shamble/:teamId" element={<ProtectedRoute><ShambleScoring /></ProtectedRoute>} />
          <Route path="/course" element={<ProtectedRoute><CourseSetup /></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><MatchSetup /></ProtectedRoute>} />
          <Route path="/scoring/:matchId" element={<ProtectedRoute><Scoring /></ProtectedRoute>} />
          <Route path="/match/:matchId" element={<ProtectedRoute><MatchDetail /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><ErrorBoundary><Leaderboard /></ErrorBoundary></ProtectedRoute>} />
        </Routes>
      </main>

      {/* PWA Install Prompt */}
      {showPWAPrompt && (
        <PWAInstallPrompt
          onInstall={installPWA}
          onDismiss={dismissPWAPrompt}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
