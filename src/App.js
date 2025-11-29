import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { initializeDefaultData } from './firebase/services';
import { initializeRegularPlayers } from './utils/initializePlayers';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import TeamManagement from './components/TeamManagement';
import CourseSetup from './components/CourseSetup';
import MatchSetup from './components/MatchSetup';
import Leaderboard from './components/Leaderboard';
import Scoring from './components/Scoring';
import MatchDetail from './components/MatchDetail';
import PlayerManagement from './components/PlayerManagement';
import AdminLogin from './components/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';

function AppHeader() {
  const { isAdmin, logout } = useAuth();

  return (
    <header className="App-header">
      <h1>⛳ Ryder Cup Scoring</h1>
      <nav>
        <Link to="/">Leaderboard</Link>
        <Link to="/teams">Teams</Link>
        <Link to="/players">Players</Link>
        <Link to="/course">Course</Link>
        <Link to="/matches">Matches</Link>
        {isAdmin ? (
          <button onClick={logout} className="admin-logout">
            Logout (Admin)
          </button>
        ) : (
          <Link to="/admin/login" className="admin-login">Admin</Link>
        )}
      </nav>
    </header>
  );
}

function AppContent() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize default data on app load
    Promise.all([
      initializeDefaultData(),
      initializeRegularPlayers()
    ])
      .then(() => {
        setLoading(false);
      })
      .catch(error => {
        console.error('Error initializing data:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="App loading">
        <div className="spinner"></div>
        <p>Loading Ryder Cup...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <AppHeader />
      <main className="App-main">
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/teams" element={<TeamManagement />} />
          <Route path="/players" element={<PlayerManagement />} />
          <Route path="/course" element={<CourseSetup />} />
          <Route path="/matches" element={<MatchSetup />} />
          <Route path="/scoring/:matchId" element={<Scoring />} />
          <Route path="/match/:matchId" element={<MatchDetail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
