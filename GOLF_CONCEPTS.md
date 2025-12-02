# Golf Tournament Scoring System - Concepts & Terminology

## Tournament Formats

### Stroke Play (Medal Play)
- **Description**: Most common professional format
- **Scoring**: Total strokes over entire round(s)
- **Winner**: Lowest total score
- **Usage**: Most professional tournaments, qualifiers

### Match Play
- **Description**: Hole-by-hole competition
- **Scoring**: Win/lose/halve each hole
- **Winner**: Player/team winning most holes
- **Usage**: Ryder Cup, match play championships
- **Scoring System**:
  - Win hole: 1 point
  - Halve hole: 0.5 points each
  - Match result: "3&2" means 3 holes up with 2 to play

### Stableford
- **Description**: Points-based scoring system
- **Scoring**: Points awarded based on score vs. par
  - Albatross/Double Eagle (-3): 5 points
  - Eagle (-2): 4 points
  - Birdie (-1): 3 points
  - Par (0): 2 points
  - Bogey (+1): 1 point
  - Double Bogey or worse (+2+): 0 points
- **Winner**: Highest points total
- **Usage**: Social tournaments, encouraging aggressive play

### Modified Stableford
- Different point values (e.g., PGA Tour uses: Eagle=8, Birdie=3, Par=0, Bogey=-1, Double=-3)

## Team Formats

### Foursomes (Alternate Shot)
- **Players**: 2 per team
- **Ball**: 1 ball per team
- **Play**: Partners alternate hitting the same ball
  - Player A tees off odd holes
  - Player B tees off even holes
  - They alternate until hole is completed
- **Usage**: Ryder Cup, team competitions
- **Strategy**: Requires excellent teamwork and course management

### Fourball (Best Ball - 2 players)
- **Players**: 2 per team
- **Balls**: Each player plays own ball
- **Scoring**: Best score of the two partners counts
- **Usage**: Ryder Cup, team competitions
- **Strategy**: Allows for aggressive play from one partner while other plays safe

### Scramble
- **Players**: 2-4 per team
- **Play**: All players tee off, team selects best shot, all play from there
- **Scoring**: One team score per hole
- **Usage**: Charity events, corporate outings, social golf
- **Variations**:
  - **Texas Scramble**: Must use minimum number of each player's tee shots
  - **Florida Scramble**: Player whose shot is selected sits out next shot
  - **Ambrose**: Uses team handicap for net scoring

### Shamble
- **Players**: 2-4 per team
- **Play**: All tee off, select best drive, then play own ball from there
- **Scoring**: Best individual score counts
- **Usage**: Team events with individual accountability
- **Characteristics**: Hybrid between scramble and best ball

### Best Ball (4-Ball)
- **Players**: 2-4 per team
- **Balls**: Each plays own ball entire hole
- **Scoring**: Best score among team members counts
- **Usage**: Team competitions, league play

## Course Setup Concepts

### Tee Boxes
Standard color system (varies by course):

| Color | Name | Typical Yardage | Recommended For |
|-------|------|-----------------|-----------------|
| **Black** | Championship/Tips | 7,200+ yards | Professionals, scratch golfers (0 handicap) |
| **Blue** | Back/Championship | 6,800-7,200 yards | Low handicap (0-9), long hitters |
| **White** | Regular/Men's | 6,200-6,800 yards | Mid handicap (10-18), average male golfers |
| **Gold/Yellow** | Senior/Forward | 5,800-6,200 yards | High handicap (18-24), seniors |
| **Red** | Forward/Ladies | 5,000-5,800 yards | Beginners, high handicap (24+), shorter hitters |
| **Green** | Junior/Beginner | Varies | Between white and red |

### Course Rating
- **Definition**: Expected score for a scratch golfer (0 handicap)
- **Example**: Rating of 71.8 = scratch golfer would average 71.8 strokes
- **Varies by tee box**: Black tees typically have highest rating

### Slope Rating
- **Definition**: Relative difficulty for bogey golfer vs. scratch golfer
- **Range**: 55 (easiest) to 155 (hardest)
- **Standard**: 113 is average
- **Purpose**: Adjusts handicap for course difficulty
- **Calculation**: Higher slope = proportionally harder for higher handicap players

### Stroke Index (Handicap Index)
- **Purpose**: Determines order handicap strokes are applied
- **Range**: 1-18 (1 = hardest hole, 18 = easiest)
- **Match Play Allocation**:
  - Odd stroke indexes (1,3,5...) on front 9
  - Even stroke indexes (2,4,6...) on back 9
  - Avoids consecutive low indexes
  - Avoids low indexes at start/end of nine
- **Usage**: Player with 12 handicap gets strokes on holes indexed 1-12

### Par
- **Definition**: Expected strokes for a scratch golfer on a hole
- **Standard Pars** (distances in meters for this application):
  - Par 3: 137-229 meters (150-250 yards)
  - Par 4: 230-434 meters (251-475 yards)
  - Par 5: 435+ meters (476+ yards)
- **Course Par**: Typically 70-72 for 18 holes
  - Standard: 4 par 3s, 4 par 5s, 10 par 4s = Par 72

**Note:** This application uses meters for all distance measurements (common in countries outside the US).

## Handicap System

### Playing Handicap
- **Calculation**: (Handicap Index × Slope Rating) / 113
- **Purpose**: Levels playing field across different courses and tees
- **Net Score**: Gross Score - Playing Handicap = Net Score

### Course Handicap
- Adjusted handicap for specific course and tee combination
- Accounts for course difficulty via slope and rating

## Ryder Cup Specific

### Format
- **Team**: 2 teams (Europe vs. USA, or any two teams)
- **Duration**: Typically 3 days
- **Traditional Schedule**:
  - **Day 1**: Morning Foursomes (4 matches) + Afternoon Fourball (4 matches) = 8 points
  - **Day 2**: Morning Foursomes (4 matches) + Afternoon Fourball (4 matches) = 8 points
  - **Day 3**: Singles (12 matches) = 12 points
  - **Total**: 28 points available
- **Winner**: First team to 14.5 points

### Scoring
- **Win**: 1 point
- **Halve**: 0.5 points each team
- **Each session is a separate round** in our system

## Application Architecture

### Tournament Structure
```
Tournament
├── Basic Info (name, edition, dates, format, courseName)
├── Format (determines structure):
│   ├── Individual formats: stableford, stroke_play
│   ├── Team formats: ryder_cup, scramble, shamble, best_ball, team_stableford
├── Teams[] (ONLY for team formats)
│   ├── Team 1 (name, color, players[])
│   └── Team 2 (name, color, players[])
├── Players[] (all tournament participants - player IDs)
└── Rounds[] (each round = one session)
    ├── Round Info (name, date, matchFormat for Ryder Cup)
    ├── Course Selection (savedCourseId → links to Course Library)
    ├── Matches[] (for team formats)
    │   ├── Match details (team1Players, team2Players)
    │   ├── Status (not_started, in_progress, completed)
    │   └── HoleScores[] (results per hole)
    └── Scorecards[] (for individual formats)
        ├── Player
        ├── Holes[] (grossScore, netScore, stablefordPoints)
        └── Status
```

### Tournament Creation Workflow

**Step 1: Basic Information**
- Tournament name, edition, dates
- Format selection (determines subsequent steps)

**Step 2: Player Selection**
- Select participants from player pool
- All formats require players

**Step 3: Format-Specific Setup**
- **IF Ryder Cup or Team Format:**
  - Create teams (typically 2 for Ryder Cup)
  - Set team names and colors
  - Assign players to teams
- **IF Individual Format:**
  - Skip to next step

**Step 4: Round Configuration**
- Create rounds (one per day/session)
- For each round:
  - Name (e.g., "Friday Morning Foursomes")
  - Date
  - Select course from Course Library
  - Match format (for Ryder Cup: foursomes/fourball/singles)

**Step 5: Review & Create**
- Confirm all settings
- Create tournament

### Course + Tee Box System
- **Course**: Named golf course (e.g., "Akarana Golf Club")
- **Tee Box**: Specific set of tees (e.g., "Blue", "White", "Gold")
- **Course/Tee Combo**: Defines unique par and stroke index configuration
- **Saved Courses**: Library of configured course/tee combinations
- **Reusability**: Same course/tee can be used across multiple tournaments/rounds

### Format-Specific Features
- **Ryder Cup**: Teams, match play, foursomes/fourball/singles
- **Individual Stableford**: Scorecards, points calculation, leaderboard
- **Scramble/Shamble**: Team scoring, single score per hole
- **Multi-day Stroke Play**: Total score across multiple rounds

## Scoring Terminology

### Relative to Par
- **Albatross/Double Eagle**: -3 (e.g., hole-in-one on par 4)
- **Eagle**: -2
- **Birdie**: -1
- **Par**: 0
- **Bogey**: +1
- **Double Bogey**: +2
- **Triple Bogey**: +3

### Match Play Terminology
- **All Square (AS)**: Match is tied
- **Dormie**: Player/team is up by same number of holes remaining (can't lose)
- **3&2**: 3 holes up with 2 to play (match won)
- **Conceded**: Opponent concedes hole or match

## System Features to Implement

### Course Management
- [ ] Saved course library with course name + tee box combinations
- [ ] Each course/tee defines: holes[par, strokeIndex], totalPar, yardage, rating, slope
- [ ] Course selection dropdown in round configuration
- [ ] Ability to edit/copy existing course configurations

### Tournament Management
- [ ] Format-aware UI (shows/hides teams, matches, scorecards based on format)
- [ ] Team management for Ryder Cup formats
- [ ] Round-based structure with match format per round
- [ ] Proper hierarchy: Tournament → Rounds → Matches/Scorecards

### Scoring Features
- [ ] Match play hole-by-hole scoring
- [ ] Stableford points calculation with net scores
- [ ] Live scoreboards with provisional results
- [ ] Match status tracking (holes up/down, AS)
- [ ] Net score calculation using playing handicap

### Future Enhancements
- [ ] Team scramble/shamble formats
- [ ] Multi-day stroke play with cut lines
- [ ] Best ball team formats
- [ ] Gross and net competitions simultaneously
- [ ] Course rating/slope input for accurate handicap calculation
