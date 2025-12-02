import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import './Help.css';

function Help() {
  const navigate = useNavigate();

  return (
    <div className="help-container">
      <div className="help-header">
        <button onClick={() => navigate('/settings')} className="back-button">
          <ArrowLeftIcon className="icon" />
          Back to Settings
        </button>
        <h1>Help & Guide</h1>
        <p>Understanding tournament structure and formats</p>
      </div>

      <div className="help-content">
        {/* Tournament Hierarchy */}
        <section className="help-section">
          <h2>Tournament Structure</h2>
          <p className="help-intro">
            The app organizes golf events in a hierarchical structure:
          </p>

          <div className="concept-card">
            <h3>📚 Series (Optional)</h3>
            <p>
              A collection of related tournaments that occur over time. For example:
              "2025 Club Championship Series" or "Summer Golf League".
            </p>
            <div className="example-box">
              <strong>Example:</strong> "Monthly Medal Series" containing 12 monthly tournaments
            </div>
            <ul className="feature-list">
              <li>Track cumulative standings across multiple events</li>
              <li>Compare performance over time</li>
              <li>Award overall series champion</li>
              <li>Tournaments can also stand alone without a series</li>
            </ul>
          </div>

          <div className="concept-card">
            <h3>🏆 Tournament</h3>
            <p>
              A single golf event with a specific format, dates, and participants.
              Each tournament contains one or more rounds.
            </p>
            <div className="example-box">
              <strong>Example:</strong> "October 2025 Ryder Cup" or "Spring Stableford"
            </div>
            <ul className="feature-list">
              <li>Set tournament format (Ryder Cup, Stableford, etc.)</li>
              <li>Select participants</li>
              <li>Configure multiple rounds</li>
              <li>Track overall tournament standings</li>
            </ul>
          </div>

          <div className="concept-card">
            <h3>⛳ Round</h3>
            <p>
              A single day or session of play within a tournament. Each round is
              played on a specific course and date.
            </p>
            <div className="example-box">
              <strong>Example:</strong> "Friday Morning Foursomes" or "Round 1"
            </div>
            <ul className="feature-list">
              <li>Assign a course to each round (can be different courses)</li>
              <li>Set match format for team events (Foursomes, Fourball, Singles)</li>
              <li>Record scores for the round</li>
              <li>Multi-day tournaments have multiple rounds</li>
            </ul>
          </div>

          <div className="hierarchy-visual">
            <div className="hierarchy-level">
              <span className="hierarchy-label">Series</span>
              <span className="hierarchy-example">2025 Club Championship</span>
            </div>
            <div className="hierarchy-arrow">↓</div>
            <div className="hierarchy-level">
              <span className="hierarchy-label">Tournament</span>
              <span className="hierarchy-example">October Match Play</span>
            </div>
            <div className="hierarchy-arrow">↓</div>
            <div className="hierarchy-level">
              <span className="hierarchy-label">Round</span>
              <span className="hierarchy-example">Round 1 • Round 2</span>
            </div>
            <div className="hierarchy-arrow">↓</div>
            <div className="hierarchy-level">
              <span className="hierarchy-label">Matches / Scorecards</span>
              <span className="hierarchy-example">Individual scores or team matches</span>
            </div>
          </div>
        </section>

        {/* Tournament Formats */}
        <section className="help-section">
          <h2>Tournament Formats</h2>
          <p className="help-intro">
            Different ways to play and score golf tournaments:
          </p>

          <div className="format-card team-format">
            <div className="format-header">
              <h3>👥 Ryder Cup (Team Match Play)</h3>
              <span className="format-badge team">Team Format</span>
            </div>
            <p>
              Head-to-head team competition where players compete in matches,
              not stroke totals. Each match is worth 1 point.
            </p>
            <div className="format-details">
              <div className="detail-section">
                <strong>Setup:</strong>
                <ul>
                  <li>Two teams with equal or unequal players</li>
                  <li>Multiple rounds with different match formats</li>
                  <li>Course assigned per round</li>
                </ul>
              </div>
              <div className="detail-section">
                <strong>Match Formats:</strong>
                <ul>
                  <li><strong>Foursomes:</strong> 2v2, alternate shot with one ball per team</li>
                  <li><strong>Fourball:</strong> 2v2, each plays their own ball, best score counts</li>
                  <li><strong>Singles:</strong> 1v1, head-to-head matches</li>
                </ul>
              </div>
              <div className="detail-section">
                <strong>Scoring:</strong>
                <ul>
                  <li>Win a hole: Team gets 1 point for that hole</li>
                  <li>Tie a hole: Half point each (halve)</li>
                  <li>Match winner: Gets 1 point for tournament total</li>
                  <li>Halved match: Half point each team</li>
                </ul>
              </div>
            </div>
            <div className="example-box">
              <strong>Example:</strong> Europe vs USA, Day 1 Morning (4 Foursomes matches),
              Day 1 Afternoon (4 Fourball matches), Day 2 (12 Singles)
            </div>
          </div>

          <div className="format-card individual-format">
            <div className="format-header">
              <h3>⭐ Individual Stableford</h3>
              <span className="format-badge individual">Individual Format</span>
            </div>
            <p>
              Points-based scoring where players earn points based on their
              score relative to par on each hole. Higher points win.
            </p>
            <div className="format-details">
              <div className="detail-section">
                <strong>Setup:</strong>
                <ul>
                  <li>Individual players compete</li>
                  <li>Net scores used (adjusted by handicap)</li>
                  <li>Encourages aggressive play</li>
                </ul>
              </div>
              <div className="detail-section">
                <strong>Points System:</strong>
                <ul>
                  <li><strong>Albatross (-3):</strong> 5 points</li>
                  <li><strong>Eagle (-2):</strong> 4 points</li>
                  <li><strong>Birdie (-1):</strong> 3 points</li>
                  <li><strong>Par (0):</strong> 2 points</li>
                  <li><strong>Bogey (+1):</strong> 1 point</li>
                  <li><strong>Double+ (+2+):</strong> 0 points</li>
                </ul>
              </div>
            </div>
            <div className="example-box">
              <strong>Example:</strong> Monthly medal competition where best points score wins
            </div>
          </div>

          <div className="format-card team-format">
            <div className="format-header">
              <h3>🎯 Scramble (Ambrose)</h3>
              <span className="format-badge team">Team Format</span>
            </div>
            <p>
              Team format where all players hit from each shot, then select
              the best ball position. Everyone plays from there.
            </p>
            <div className="format-details">
              <div className="detail-section">
                <strong>Setup:</strong>
                <ul>
                  <li>Teams of 2-4 players</li>
                  <li>Popular for social/charity events</li>
                  <li>Fast-paced and fun</li>
                </ul>
              </div>
              <div className="detail-section">
                <strong>How it Works:</strong>
                <ul>
                  <li>All players tee off</li>
                  <li>Team selects best drive location</li>
                  <li>All play next shot from there</li>
                  <li>Repeat until ball is holed</li>
                  <li>One team score per hole</li>
                </ul>
              </div>
            </div>
            <div className="example-box">
              <strong>Example:</strong> Charity scramble with 4-person teams
            </div>
          </div>

          <div className="format-card team-format">
            <div className="format-header">
              <h3>🏌️ Best Ball (4-Ball)</h3>
              <span className="format-badge team">Team Format</span>
            </div>
            <p>
              Each player plays their own ball. The best score from the team
              on each hole counts toward the team total.
            </p>
            <div className="format-details">
              <div className="detail-section">
                <strong>Setup:</strong>
                <ul>
                  <li>Teams of 2-4 players</li>
                  <li>Each plays full round with own ball</li>
                  <li>Can be stroke play or match play</li>
                </ul>
              </div>
              <div className="detail-section">
                <strong>Scoring:</strong>
                <ul>
                  <li>All team members complete each hole</li>
                  <li>Best individual score counts</li>
                  <li>Allows aggressive/conservative strategies</li>
                </ul>
              </div>
            </div>
            <div className="example-box">
              <strong>Example:</strong> 2-person best ball tournament
            </div>
          </div>

          <div className="format-card team-format">
            <div className="format-header">
              <h3>🎲 Shamble</h3>
              <span className="format-badge team">Team Format</span>
            </div>
            <p>
              Hybrid format: Team selects best drive, then each player
              plays their own ball from there.
            </p>
            <div className="format-details">
              <div className="detail-section">
                <strong>How it Works:</strong>
                <ul>
                  <li>All players tee off</li>
                  <li>Team selects best drive</li>
                  <li>Each player plays own ball from there</li>
                  <li>Best score (or two best) counts</li>
                </ul>
              </div>
            </div>
            <div className="example-box">
              <strong>Example:</strong> Corporate outing with mixed skill levels
            </div>
          </div>

          <div className="format-card team-format">
            <div className="format-header">
              <h3>⭐ Team Stableford</h3>
              <span className="format-badge team">Team Format</span>
            </div>
            <p>
              Teams compete using Stableford points. Combined points from
              team members determine team score.
            </p>
            <div className="format-details">
              <div className="detail-section">
                <strong>Variations:</strong>
                <ul>
                  <li>Combined total of all players</li>
                  <li>Best 2 of 4 scores per hole</li>
                  <li>Uses Stableford points system</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="format-card individual-format">
            <div className="format-header">
              <h3>📊 Multi-Day Stroke Play</h3>
              <span className="format-badge individual">Individual Format</span>
            </div>
            <p>
              Traditional stroke play over multiple rounds. Lowest total
              gross or net score wins.
            </p>
            <div className="format-details">
              <div className="detail-section">
                <strong>Setup:</strong>
                <ul>
                  <li>Multiple rounds (typically 2-4)</li>
                  <li>Can be different courses</li>
                  <li>Most professional format</li>
                  <li>Gross and/or net divisions</li>
                </ul>
              </div>
            </div>
            <div className="example-box">
              <strong>Example:</strong> 36-hole club championship
            </div>
          </div>
        </section>

        {/* Key Concepts */}
        <section className="help-section">
          <h2>Key Concepts</h2>

          <div className="concept-grid">
            <div className="concept-item">
              <h4>🎯 Handicap</h4>
              <p>
                A number representing a player's playing ability. Lower handicaps
                indicate better players. Used to level the playing field in net competitions.
              </p>
            </div>

            <div className="concept-item">
              <h4>📈 Gross Score</h4>
              <p>
                Actual number of strokes taken, without handicap adjustment.
                Used for scratch competitions.
              </p>
            </div>

            <div className="concept-item">
              <h4>📉 Net Score</h4>
              <p>
                Gross score minus handicap strokes. Allows players of different
                abilities to compete fairly.
              </p>
            </div>

            <div className="concept-item">
              <h4>⛳ Course</h4>
              <p>
                The golf course layout including hole pars, distances, and
                stroke indexes. Each round is assigned a specific course.
              </p>
            </div>

            <div className="concept-item">
              <h4>🎨 Tee Box</h4>
              <p>
                Different starting positions (White, Blue, Red, etc.) that
                affect course difficulty and length.
              </p>
            </div>

            <div className="concept-item">
              <h4>🔢 Stroke Index</h4>
              <p>
                Ranking of hole difficulty (1-18). Determines where handicap
                strokes are applied. 1 is hardest, 18 is easiest.
              </p>
            </div>

            <div className="concept-item">
              <h4>🏁 Match Status</h4>
              <p>
                In match play: "3&2" means 3 holes up with 2 to play (match won).
                "AS" means All Square (tied).
              </p>
            </div>

            <div className="concept-item">
              <h4>📊 Leaderboard</h4>
              <p>
                Real-time standings showing player/team positions, scores, and
                points throughout the tournament.
              </p>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="help-section">
          <h2>Getting Started</h2>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Add Players</h4>
                <p>Go to Player Management and add all participants with their handicaps.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Configure Courses</h4>
                <p>Set up course details (pars, stroke indexes) in the Course Library.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Create Tournament</h4>
                <p>Choose format, select players, configure rounds, and assign courses.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Set Up Matches</h4>
                <p>For team formats: pair players into matches. For individual: create scorecards.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">5</div>
              <div className="step-content">
                <h4>Score Rounds</h4>
                <p>Enter scores as play progresses. Leaderboard updates automatically.</p>
              </div>
            </div>

            <div className="step-card">
              <div className="step-number">6</div>
              <div className="step-content">
                <h4>View Results</h4>
                <p>Check final standings, statistics, and declare winners.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="help-section tips-section">
          <h2>💡 Tips & Best Practices</h2>

          <div className="tips-grid">
            <div className="tip-card">
              <h4>📱 Use During Play</h4>
              <p>Update scores hole-by-hole for real-time leaderboards that keep players engaged.</p>
            </div>

            <div className="tip-card">
              <h4>🔄 Create Series</h4>
              <p>For recurring events, create a series to track cumulative standings over time.</p>
            </div>

            <div className="tip-card">
              <h4>⛳ Multiple Courses</h4>
              <p>Different rounds can use different courses - great for multi-venue tournaments.</p>
            </div>

            <div className="tip-card">
              <h4>👥 Balance Teams</h4>
              <p>For Ryder Cup, try to balance team handicaps for competitive matches.</p>
            </div>

            <div className="tip-card">
              <h4>📸 Capture Moments</h4>
              <p>Upload photos during rounds to create a tournament gallery (coming soon).</p>
            </div>

            <div className="tip-card">
              <h4>💾 Save Often</h4>
              <p>Changes save automatically, but check for the success message after updates.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Help;
