import React, { useState } from 'react';
import { XMarkIcon, UserGroupIcon, UserIcon, TrophyIcon } from '@heroicons/react/24/outline';
import './FormatExplainerModal.css';

/**
 * Modal explaining different golf tournament formats
 */
function FormatExplainerModal({ onClose, onSelect }) {
  const [selectedFormat, setSelectedFormat] = useState(null);

  const formats = [
    {
      id: 'individual_stroke',
      name: 'Individual Stroke Play',
      icon: UserIcon,
      category: 'Individual',
      players: '1 player per group',
      scoring: 'Total strokes over 18 holes. Lowest score wins.',
      description: 'Classic individual golf. Each player plays their own ball and counts every stroke. Best for general individual competitions.',
      bestFor: 'Standard tournaments, qualifiers, club championships',
      handicap: 'Playing handicap applied to gross score'
    },
    {
      id: 'individual_stableford',
      name: 'Individual Stableford',
      icon: UserIcon,
      category: 'Individual',
      players: '1 player per group',
      scoring: 'Points based on net score vs par: Eagle=4pts, Birdie=3pts, Par=2pts, Bogey=1pt, Double+=0pts',
      description: 'Points-based scoring where players earn points based on their net score on each hole. Encourages aggressive play and is more forgiving of bad holes.',
      bestFor: 'Social golf, mixed ability groups, fun competitions',
      handicap: 'Full handicap applied (e.g., 18 handicap gets 1 shot on each hole)'
    },
    {
      id: 'match_play_singles',
      name: 'Match Play - Singles',
      icon: UserIcon,
      category: 'Match Play',
      players: '2 players (head-to-head)',
      scoring: 'Hole-by-hole competition. Win hole = 1 up. Lowest score on hole wins.',
      description: 'Classic head-to-head format. Players compete hole by hole rather than counting total strokes. First to be more holes up than holes remaining wins.',
      bestFor: 'Ryder Cup format, knockout tournaments, rivalries',
      handicap: '75% of difference between handicaps applied'
    },
    {
      id: 'four_ball',
      name: 'Four-Ball (Better Ball)',
      icon: UserGroupIcon,
      category: 'Team - Match Play',
      players: '4 players (2 vs 2 teams)',
      scoring: 'Best score from each team counts per hole. Teams compare best scores.',
      description: 'Two players per team, each plays their own ball. The lower score of the two partners counts as the team score for that hole. Can be match play or stroke play.',
      bestFor: 'Ryder Cup Day 1 & 2, casual team golf',
      handicap: '90% of course handicap for each player'
    },
    {
      id: 'foursomes',
      name: 'Foursomes (Alternate Shot)',
      icon: UserGroupIcon,
      category: 'Team - Match Play',
      players: '4 players (2 vs 2 teams)',
      scoring: 'Partners alternate shots on same ball. One score per team.',
      description: 'True team golf. Partners play one ball alternately - one hits tee shot, other hits approach, etc. Requires strong partnership and strategy.',
      bestFor: 'Ryder Cup Day 1 & 2, testing partnerships',
      handicap: '50% of combined team handicap'
    },
    {
      id: 'scramble',
      name: 'Scramble / Ambrose',
      icon: UserGroupIcon,
      category: 'Team - Stroke Play',
      players: '2-4 players per team',
      scoring: 'All players tee off, team selects best shot, all play from there. Count total strokes.',
      description: 'Fun team format where everyone tees off, team picks the best shot, then everyone plays from that spot. Continues until holed. Fast-paced and social.',
      bestFor: 'Charity events, corporate golf, social tournaments',
      handicap: 'Team handicap = (lowest HCP × 0.2) + (2nd lowest × 0.15) + (3rd × 0.10) + (4th × 0.05)'
    },
    {
      id: 'best_ball',
      name: 'Best Ball (Stroke Play)',
      icon: UserGroupIcon,
      category: 'Team - Stroke Play',
      players: '2-4 players per team',
      scoring: 'All players play own ball. Best individual score per hole counts for team.',
      description: 'Each player plays their own ball throughout. On each hole, the lowest score among team members is the team score. Combines individual play with team scoring.',
      bestFor: 'Team tournaments, mixed ability groups',
      handicap: 'Full individual handicaps applied, then best net score taken'
    },
    {
      id: 'team_stableford',
      name: 'Team Stableford',
      icon: UserGroupIcon,
      category: 'Team - Stroke Play',
      players: '2-4 players per team',
      scoring: 'Individual stableford points, team score = sum of points',
      description: 'Each player scores stableford points individually. Team score is the sum of all members\' points. Can take best 2 of 4 scores per hole for variation.',
      bestFor: 'Team social events, club competitions',
      handicap: 'Full handicap for each player'
    },
    {
      id: 'shamble',
      name: 'Shamble',
      icon: UserGroupIcon,
      category: 'Team - Stroke Play',
      players: '2-4 players per team',
      scoring: 'Team scramble off tee, then each plays own ball. Best individual score counts.',
      description: 'Hybrid format: team scrambles off the tee (choose best drive), then each player plays their own ball from there. Best score on hole counts for team.',
      bestFor: 'Mix of team play and individual accountability',
      handicap: '80% of individual handicaps'
    }
  ];

  const handleSelect = () => {
    if (selectedFormat && onSelect) {
      onSelect(selectedFormat);
    }
    onClose();
  };

  const categories = [...new Set(formats.map(f => f.category))];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content format-explainer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Golf Tournament Formats</h2>
            <p className="modal-subtitle">Choose the format for your round</p>
          </div>
          <button onClick={onClose} className="close-button">
            <XMarkIcon className="icon" />
          </button>
        </div>

        <div className="modal-body">
          {categories.map(category => (
            <div key={category} className="format-category">
              <h3 className="category-title">{category}</h3>
              <div className="formats-grid">
                {formats.filter(f => f.category === category).map(format => {
                  const FormatIcon = format.icon;
                  const isSelected = selectedFormat === format.id;

                  return (
                    <div
                      key={format.id}
                      className={`format-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedFormat(format.id)}
                    >
                      <div className="format-card-header">
                        <div className="format-icon-wrapper">
                          <FormatIcon className="format-icon" />
                        </div>
                        <h4>{format.name}</h4>
                      </div>

                      <div className="format-details">
                        <div className="detail-row">
                          <span className="detail-label">Players:</span>
                          <span className="detail-value">{format.players}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Scoring:</span>
                          <span className="detail-value">{format.scoring}</span>
                        </div>
                      </div>

                      <p className="format-description">{format.description}</p>

                      <div className="format-meta">
                        <div className="meta-item">
                          <span className="meta-label">Best For:</span>
                          <span className="meta-text">{format.bestFor}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Handicap:</span>
                          <span className="meta-text">{format.handicap}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="selection-indicator">
                          <TrophyIcon className="icon" />
                          Selected
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button secondary">
            Cancel
          </button>
          <button
            onClick={handleSelect}
            className="button primary"
            disabled={!selectedFormat}
          >
            Select Format
          </button>
        </div>
      </div>
    </div>
  );
}

export default FormatExplainerModal;
