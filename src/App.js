import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { initializeDefaultData } from './firebase/services';
import TeamManagement from './components/TeamManagement';
import CourseSetup from './components/CourseSetup';
import MatchSetup from './components/MatchSetup';
import Leaderboard from './components/Leaderboard';
import Scoring from './components/Scoring';
import MatchDetail from './components/MatchDetail';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize default data on app load
    initializeDefaultData()
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
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>⛳ Ryder Cup Scoring</h1>
          <nav>
            <Link to="/">Leaderboard</Link>
            <Link to="/teams">Teams</Link>
            <Link to="/course">Course</Link>
            <Link to="/matches">Matches</Link>
          </nav>
        </header>

        <main className="App-main">
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/teams" element={<TeamManagement />} />
            <Route path="/course" element={<CourseSetup />} />
            <Route path="/matches" element={<MatchSetup />} />
            <Route path="/scoring/:matchId" element={<Scoring />} />
            <Route path="/match/:matchId" element={<MatchDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
