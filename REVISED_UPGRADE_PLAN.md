# Ryder Cup Scoring App - REVISED Major Upgrade Plan

## Executive Summary

This revised plan incorporates critical feedback to create a comprehensive golf tournament management platform with proper player history tracking, recurring tournament series, and a classic honours board experience.

**Key Changes from Original Plan:**
- Individual Stableford separated from Chaps Cup (both supported)
- Proper recurring tournament series (e.g., annual Josef Memorial)
- Player-centric design with handicap history
- Playoff/tiebreaker system for tied tournaments
- Classic golf honours board aesthetic
- Aggregated honours by player/team
- Video upload support
- Public photo/video upload (admin delete only)
- Simplified security for 20-person group
- Proper Ambrose/Scramble handicap systems
- Max drive requirements for scrambles

---

## 1. Tournament Types & Formats

### 1.1 Ryder Cup Format (EXISTING - Enhanced)
- **Type:** Team Match Play
- **Formats:** Singles, Foursomes, Four-ball
- **Scoring:** Match play (holes won/lost/halved)
- **Duration:** Single or multi-day
- **Winner:** Team with most points
- **Series:** Can be recurring (e.g., Annual Ryder Cup Championship)

### 1.2 Chaps Cup Format (HISTORIC SERIES)
- **Type:** Individual Stableford Tournament Series
- **Format:** One round, Stableford points
- **Scoring:** Net Stableford with handicap adjustment
- **Duration:** Single day
- **Winner:** Individual with highest points
- **Historic:** Has past winners to be entered into honours board
- **Series:** Recurring annual tournament

### 1.3 Individual Stableford (ONE-OFF OR SERIES)
- **Type:** Individual Stableford (NOT Chaps Cup)
- **Format:** One round, Stableford points
- **Scoring:** Net Stableford with proper stroke index calculation
- **Duration:** Single day
- **Winner:** Individual with highest points
- **Series:** Can be one-off or recurring
- **Difference from Chaps Cup:** Generic format, not tied to historic series

**Stableford Scoring System (Proper Implementation):**
```
Based on NET score vs par (after handicap adjustment):
- 3+ under par: 5 points (Albatross or better)
- 2 under par: 4 points (Eagle)
- 1 under par: 3 points (Birdie)
- Par: 2 points
- 1 over par: 1 point (Bogey)
- 2+ over par: 0 points (Double bogey or worse)

Handicap Stroke Allocation:
- Handicap applied per hole based on stroke index
- Player with HCP 12 gets 1 stroke on holes with SI 1-12
- Player with HCP 23 gets 2 strokes on SI 1-5, 1 stroke on SI 6-18
- Net score = Gross score - strokes received
- Points calculated on net score vs hole par

Target: 36 points (2 per hole) = playing to handicap
```

### 1.4 Scramble/Ambrose Format (NEW)
- **Type:** Team format (2-4 players)
- **Format:** All tee off, select best shot, play from there
- **Scoring:** Team stroke play (lowest total score)
- **Duration:** Single day
- **Series:** Can be recurring (e.g., Annual Josef Memorial)
- **Handicap Options:**
  1. **No Handicap** - Gross scores only
  2. **USGA Scramble Method:**
     - 2-person: 35% + 15% of course handicaps
     - 3-person: 20% + 15% + 10% of course handicaps
     - 4-person: 20% + 15% + 10% + 5% of course handicaps
  3. **Traditional Ambrose:**
     - 2-person: Sum of handicaps ÷ 4
     - 3-person: Sum of handicaps ÷ 6
     - 4-person: Sum of handicaps ÷ 8
  4. **Percentage Method:**
     - 2-person: 35% + 15%
     - 3-person: 20% + 15% + 10%
     - 4-person: 20% + 15% + 10% + 5%

**Scramble Drive Requirements:**
- Option to enforce minimum drives per player
- Typical: Each player's drive must be used 3-4 times in 18 holes
- Configurable per tournament
- System tracks drive usage and alerts if requirement not met

### 1.5 Best Ball/Four-Ball Stroke Play (NEW)
- **Type:** Team format (2-4 players)
- **Format:** Each plays own ball, best score counts
- **Scoring:** Team stroke play
- **Duration:** Single day
- **Series:** Can be recurring

### 1.6 Shamble (NEW)
- **Type:** Team format (2-4 players)
- **Format:** All tee off, select best drive, then individual play
- **Scoring:** Team stroke play or Stableford
- **Duration:** Single day
- **Series:** Can be recurring

### 1.7 Multi-Day Stableford (NEW)
- **Type:** Individual or team
- **Format:** Stableford over multiple rounds/courses
- **Scoring:** Cumulative Stableford points
- **Duration:** 2-7 days
- **Series:** Can be recurring

---

## 2. Tournament Series & Recurring Events

### 2.1 Tournament Series Concept

**Series Definition:**
A series is a recurring tournament with the same name, format, and rules that occurs annually or periodically.

**Examples:**
- **Chaps Cup** - Annual individual Stableford (historic series with past winners)
- **Josef Memorial** - Annual scramble/Ambrose tournament
- **Annual Ryder Cup** - Yearly team match play
- **Summer Classic** - Annual best ball

**Series Features:**
- Each edition is a separate tournament with its own scores/photos
- Unified honours board showing all editions
- Winner history tracked across years
- Series statistics (most wins, best performances)
- Can filter honours board by series name

### 2.2 Tournament Metadata

```javascript
Tournament Document:
{
  id: "tournament_2025_chaps_cup",
  name: "Chaps Cup 2025",

  // Series information
  seriesId: "series_chaps_cup",
  seriesName: "Chaps Cup",
  seriesEdition: 15, // 15th edition
  isRecurring: true,

  // Tournament details
  type: "individual-stableford",
  status: "completed",
  startDate: "2025-12-15",
  endDate: "2025-12-15",

  // Results
  winner: "John Smith",
  winnerScore: "42 points",
  runnerUp: "Mike Jones", // For tied scenarios
  runnerUpScore: "42 points",

  // Playoff info (if applicable)
  hadPlayoff: true,
  playoffDescription: "Sudden death playoff on hole 18",
  playoffPhotoUrl: "...",
  playoffVideoUrl: "...",

  // Media
  coverPhotoUrl: "...",
  photoCount: 45,
  videoCount: 3,

  // Configuration
  courseId: "course_greenacres",
  allowPhotoUpload: true,
  allowVideoUpload: true,

  // Summary
  description: "Annual Chaps Cup competition...",
  summary: "Thrilling finish with John Smith winning in playoff..."
}
```

### 2.3 Series Management

**Creating a Series:**
1. Admin creates first tournament
2. Option: "Make this a recurring series"
3. Enter series name (e.g., "Josef Memorial")
4. Series created automatically
5. Future tournaments can be added to series

**Creating Next Edition:**
1. Admin selects "Create Next Edition"
2. Pre-fills with series defaults
3. Updates year/edition number
4. New tournament created linked to series

---

## 3. Player-Centric Architecture

### 3.1 Player as Central Entity

**Key Principle:** Players exist independently of tournaments. They participate in many tournaments over time.

### 3.2 Player Data Structure

```javascript
/players/
  {playerId}/
    // Core identity
    id: "player_john_smith",
    name: "John Smith",
    email: "john@example.com", // Optional
    phone: "+64...", // Optional
    photoUrl: "...", // Optional avatar

    // Current handicap
    currentHandicap: 12,
    handicapUpdatedAt: timestamp,
    handicapHistory: [
      { handicap: 14, date: "2024-01-15" },
      { handicap: 13, date: "2024-06-20" },
      { handicap: 12, date: "2025-01-10" }
    ],

    // Statistics (calculated)
    totalTournaments: 15,
    tournamentsWon: 3,
    tournamentsRunnerUp: 2,
    bestStableford: 45,
    averageStableford: 38,

    // Metadata
    createdAt: timestamp,
    lastTournament: "2025-12-15",

    // Tags for filtering
    tags: ["regular", "competitive", "member"]
}

/players/{playerId}/tournaments/
  {tournamentId}/
    tournamentId: "tournament_2025_chaps_cup",
    tournamentName: "Chaps Cup 2025",
    date: "2025-12-15",
    format: "individual-stableford",
    handicapUsed: 12,
    result: {
      position: 1,
      score: "42 points",
      scoreNumeric: 42
    }
```

### 3.3 Player Selection UI

**Player Selection During Tournament Creation:**
```
+------------------------------------------+
|    Add Players to Tournament             |
+------------------------------------------+
| Search existing players:                 |
| [Search by name...........] 🔍           |
|                                          |
| Recent Players:                          |
| ☐ John Smith (HCP 12) - Last: 2 weeks   |
| ☐ Mike Jones (HCP 15) - Last: 1 month   |
| ☐ Dave Brown (HCP 9) - Last: 3 months   |
|                                          |
| All Players: (A-Z)                       |
| ☐ Andy Wilson (HCP 18)                   |
| ☐ Bob Taylor (HCP 7)                     |
| ... (scrollable list)                    |
|                                          |
| [+ Add New Player]                       |
|                                          |
| Selected (6):                            |
| • John Smith, Mike Jones, Dave Brown...  |
|                                          |
| [Cancel] [Continue]                      |
+------------------------------------------+
```

**Add New Player:**
```
+------------------------------------------+
|    Add New Player                        |
+------------------------------------------+
| Name: [___________________________]      |
| Handicap: [___]                          |
| Email (optional): [_______________]      |
| Phone (optional): [_______________]      |
|                                          |
| [Cancel] [Add Player]                    |
+------------------------------------------+
```

### 3.4 Handicap Management

**Updating Player Handicap:**
- Admin can update player handicap at any time
- Handicap change is logged with date
- Historic tournament results retain handicap used at that time
- Player profile shows current handicap + history graph

**Handicap History Display:**
```
John Smith's Handicap History:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14 ●
   │ ╲
13 │  ●
   │   ╲
12 │    ●━━━━━ Current
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Jan'24  Jun'24  Jan'25
```

---

## 4. Playoff/Tiebreaker System

### 4.1 Tied Tournament Handling

**When Tournament Ends in Tie:**
1. System identifies tied players/teams
2. Admin presented with playoff options
3. Admin enters playoff details
4. Winner selected from tied participants

### 4.2 Playoff Entry Interface

```
+------------------------------------------+
|    Tournament Tied - Enter Playoff       |
+------------------------------------------+
| Tournament: Chaps Cup 2025               |
| Tied Players (42 points each):           |
|  • John Smith                            |
|  • Mike Jones                            |
|  • Dave Brown                            |
+------------------------------------------+
| Playoff Type:                            |
|  ( ) Sudden death                        |
|  ( ) Count-back (last 9/6/3/1)           |
|  ( ) Additional holes (specify number)   |
|  (•) Other                               |
+------------------------------------------+
| Playoff Description:                     |
| [Sudden death playoff starting on hole   |
|  18. John Smith won with par on 2nd      |
|  playoff hole.]                          |
+------------------------------------------+
| Playoff Photos: [Upload] [Drag & Drop]   |
| [thumbnail] [thumbnail] [thumbnail]      |
+------------------------------------------+
| Playoff Videos: [Upload] [Drag & Drop]   |
| [video thumbnail] [Duration: 2:15]       |
+------------------------------------------+
| Winner (select one):                     |
|  ( ) John Smith                          |
|  ( ) Mike Jones                          |
|  ( ) Dave Brown                          |
+------------------------------------------+
| Final Standings:                         |
|  1. [Selected winner]                    |
|  2. [Runner-up dropdown]                 |
|  3. [Third place dropdown]               |
+------------------------------------------+
| [Cancel] [Save Playoff Result]           |
+------------------------------------------+
```

### 4.3 Playoff Data Structure

```javascript
tournament: {
  // ... other fields

  // Tie handling
  hadTie: true,
  tiedPlayers: ["player_john_smith", "player_mike_jones", "player_dave_brown"],
  tiedScore: "42 points",

  // Playoff details
  hadPlayoff: true,
  playoffType: "sudden-death",
  playoffDescription: "Sudden death playoff starting on hole 18...",
  playoffPhotos: ["url1", "url2", "url3"],
  playoffVideos: ["url1"],

  // Final result
  winner: "player_john_smith",
  winnerScore: "42 points (won in playoff)",
  runnerUp: "player_mike_jones",
  runnerUpScore: "42 points",
  thirdPlace: "player_dave_brown",
  thirdPlaceScore: "42 points"
}
```

### 4.4 Count-Back System

For count-back playoffs, system automatically calculates:
- Back 9 score
- Back 6 score
- Back 3 score
- Last hole score

Admin can review and confirm, or override if needed.

---

## 5. Honours Board System

### 5.1 Classic Golf Honours Board Design

**Design Inspiration:** Traditional wooden honours boards found in golf clubhouses

**Visual Style:**
- Classic serif font (Georgia, Times New Roman)
- Gold/brass engraving effect on dark wood background
- Shield or crest at top
- Ornate borders
- Year + Winner + Score format
- Grouped by decade or tournament type

### 5.2 Honours Board Main View

```
╔════════════════════════════════════════╗
║                                        ║
║          🏆 HONOURS BOARD 🏆          ║
║     Greenacres Golf Club               ║
║                                        ║
╠════════════════════════════════════════╣
║                                        ║
║  View By:                              ║
║  [Tournament Type ▼] [Series ▼] [Year ▼]
║  [Player/Team ▼]                       ║
║                                        ║
╠════════════════════════════════════════╣
║                                        ║
║  ┌──────  CHAPS CUP  ──────┐          ║
║  │                          │          ║
║  │  2025  John Smith    42pts │         ║
║  │  2024  Mike Jones    40pts │         ║
║  │  2023  Dave Brown    41pts │         ║
║  │  2022  Tom Wilson    39pts │         ║
║  │  2021  John Smith    43pts │         ║
║  │          [View All]        │          ║
║  └──────────────────────────┘          ║
║                                        ║
║  ┌────  JOSEF MEMORIAL  ────┐          ║
║  │      (Ambrose/Scramble)   │          ║
║  │                          │          ║
║  │  2025  Team Alpha    65   │          ║
║  │  2024  Team Bravo    67   │          ║
║  │  2023  Team Alpha    66   │          ║
║  │          [View All]        │          ║
║  └──────────────────────────┘          ║
║                                        ║
║  ┌────  RYDER CUP  ────┐              ║
║  │                     │              ║
║  │  2025  Tawa Lads  15.5-12.5 │      ║
║  │  2024  Rest of World  14-13 │      ║
║  │          [View All]          │      ║
║  └──────────────────────────┘          ║
║                                        ║
╚════════════════════════════════════════╝
```

### 5.3 Player/Team Aggregated View

```
╔════════════════════════════════════════╗
║                                        ║
║     🏆 HONOURS BY PLAYER/TEAM 🏆      ║
║                                        ║
╠════════════════════════════════════════╣
║                                        ║
║  [Search player/team...] 🔍            ║
║                                        ║
║  Filter: [All Types ▼] [All Years ▼]  ║
║                                        ║
╠════════════════════════════════════════╣
║                                        ║
║  ┌─── JOHN SMITH ───┐                 ║
║  │  Total Wins: 5   │                 ║
║  │  Runner-up: 3    │                 ║
║  │                  │                 ║
║  │  Championships:  │                 ║
║  │  2025 - Chaps Cup (42pts)          ║
║  │  2023 - Summer Classic (Winner)    ║
║  │  2021 - Chaps Cup (43pts) ⭐ Record│
║  │  2020 - Autumn Trophy (Winner)     ║
║  │  2019 - Spring Open (Winner)       ║
║  │                  │                 ║
║  │  Runner-up:      │                 ║
║  │  2024 - Chaps Cup (40pts)          ║
║  │  2022 - Josef Memorial (Team)      ║
║  │  2018 - Winter Classic             ║
║  │                  │                 ║
║  │  [View Full History]               ║
║  └────────────────────┘               ║
║                                        ║
║  ┌─── TEAM TAWA LADS ───┐             ║
║  │  Total Wins: 8     │               ║
║  │  Format: Ryder Cup │               ║
║  │                    │               ║
║  │  Championships:    │               ║
║  │  2025 - 15.5-12.5  │               ║
║  │  2023 - 14-13      │               ║
║  │  2021 - 16-12 ⭐ Best │             ║
║  │  ... [View All]    │               ║
║  └────────────────────┘               ║
║                                        ║
╚════════════════════════════════════════╝
```

### 5.4 Individual Tournament Honours Entry

```
╔════════════════════════════════════════╗
║  Chaps Cup 2025                        ║
║                                        ║
║  Winner: John Smith                    ║
║  Score: 42 points                      ║
║                                        ║
║  Playoff: Sudden death on hole 18      ║
║  defeated Mike Jones (also 42 pts)     ║
║                                        ║
║  Date: December 15, 2025               ║
║  Course: Greenacres Golf Club          ║
║  Conditions: Sunny, light wind         ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │  [Cover Photo]                 │   ║
║  │                                │   ║
║  │  [Trophy presentation photo]   │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  Summary:                              ║
║  A thrilling finish saw John Smith...  ║
║  [Read More]                           ║
║                                        ║
║  [View Full Results]                   ║
║  [Photo Gallery (45)] [Videos (3)]     ║
║                                        ║
║  [Admin: Edit Entry]                   ║
║                                        ║
╚════════════════════════════════════════╝
```

### 5.5 Honours Board Data Structure

```javascript
/honoursBoard/
  {entryId}/
    // Basic info
    id: "honour_2025_chaps_cup",
    year: 2025,
    tournamentId: "tournament_2025_chaps_cup",
    tournamentName: "Chaps Cup 2025",
    tournamentType: "individual-stableford",

    // Series info
    seriesId: "series_chaps_cup",
    seriesName: "Chaps Cup",
    edition: 15,

    // Winner
    winner: "John Smith",
    winnerId: "player_john_smith",
    winnerType: "player", // or "team"
    winnerScore: "42 points",

    // Runner-up (if applicable)
    runnerUp: "Mike Jones",
    runnerUpId: "player_mike_jones",
    runnerUpScore: "42 points",

    // Playoff
    hadPlayoff: true,
    playoffSummary: "Sudden death on hole 18",

    // Media
    coverPhotoUrl: "...",
    playoffPhotoUrls: ["..."],
    playoffVideoUrls: ["..."],

    // Summary
    date: timestamp,
    summary: "A thrilling finish...",
    conditions: "Sunny, light wind",
    course: "Greenacres Golf Club",

    // Sorting
    order: 202512, // YYYYMM for sorting
    featured: false,

    // Metadata
    createdAt: timestamp,
    createdBy: "admin",
    updatedAt: timestamp

/honoursByPlayer/
  {playerId}/
    playerId: "player_john_smith",
    playerName: "John Smith",
    totalWins: 5,
    totalRunnerUp: 3,
    totalThird: 2,

    wins: [
      {
        year: 2025,
        tournamentName: "Chaps Cup 2025",
        score: "42 points",
        honourId: "honour_2025_chaps_cup"
      },
      // ... more wins
    ],

    runnersUp: [/* ... */],

    bestPerformances: {
      bestStableford: { score: 45, tournament: "...", year: 2021 },
      mostWins: { count: 5, latestYear: 2025 }
    }

/honoursBySeries/
  {seriesId}/
    seriesId: "series_chaps_cup",
    seriesName: "Chaps Cup",
    format: "individual-stableford",
    firstYear: 2010,
    editions: 15,

    winners: [
      { year: 2025, winner: "John Smith", score: "42 points" },
      { year: 2024, winner: "Mike Jones", score: "40 points" },
      // ... all past winners
    ],

    mostWins: {
      player: "John Smith",
      count: 3,
      years: [2025, 2021, 2019]
    },

    recordScore: {
      score: 45,
      player: "Dave Brown",
      year: 2018
    }
```

---

## 6. Media Management (Photos & Videos)

### 6.1 Media Upload System

**Upload Permissions:**
- **Anyone:** Can upload photos and videos
- **Admin only:** Can delete photos and videos
- **Optimization:** All media optimized for mobile viewing

### 6.2 Photo Management

**Photo Specifications:**
- Max size: 5MB per photo
- Formats: JPEG, PNG, WEBP
- Limit: 50 photos per tournament
- Automatic optimization for mobile

**Generated Sizes:**
- Thumbnail: 200x200px (for grids)
- Medium: 800x600px (for viewing)
- Original: Stored for downloads

**Photo Upload Interface:**
```
+------------------------------------------+
|    Upload Photos - Chaps Cup 2025       |
+------------------------------------------+
| Drag & drop photos here                  |
| or [Browse Files]                        |
|                                          |
| ┌─────────────────────────────────────┐ |
| │  Drop photos here...                 │ |
| │                                      │ |
| │  Accepted: JPG, PNG, WEBP            │ |
| │  Max size: 5MB per photo             │ |
| │  Limit: 50 photos per tournament     │ |
| └─────────────────────────────────────┘ |
|                                          |
| Uploading (3/5):                         |
| ▓▓▓▓▓▓▓▓▓▓░░░░ 75% IMG_1234.jpg        |
| ✓ IMG_1235.jpg (optimized to 1.2MB)     |
| ✓ IMG_1236.jpg (optimized to 980KB)     |
|                                          |
| Add captions: (optional)                 |
| [Trophy presentation_______________]     |
| [Winning putt______________________]    |
|                                          |
| Tag match/round: (optional)              |
| [Select round ▼]                         |
|                                          |
| [Cancel] [Finish Upload]                 |
+------------------------------------------+
```

### 6.3 Video Management

**Video Specifications:**
- Max size: 100MB per video
- Formats: MP4, MOV, AVI
- Limit: 10 videos per tournament
- Automatic thumbnail generation
- Mobile-optimized streaming

**Video Upload Interface:**
```
+------------------------------------------+
|    Upload Videos - Chaps Cup 2025       |
+------------------------------------------+
| Drag & drop videos here                  |
| or [Browse Files]                        |
|                                          |
| ┌─────────────────────────────────────┐ |
| │  Drop videos here...                 │ |
| │                                      │ |
| │  Accepted: MP4, MOV, AVI             │ |
| │  Max size: 100MB per video           │ |
| │  Limit: 10 videos per tournament     │ |
| └─────────────────────────────────────┘ |
|                                          |
| Uploading (1/2):                         |
| ▓▓▓▓▓▓▓▓░░░░░░ 60% playoff.mp4         |
| ⏱ Processing video... (2 min remaining) |
|                                          |
| Add captions:                            |
| [Playoff sudden death on 18_________]    |
|                                          |
| [Cancel] [Finish Upload]                 |
+------------------------------------------+
```

### 6.4 Media Gallery View

```
+------------------------------------------+
|    Tournament Gallery - Chaps Cup 2025  |
+------------------------------------------+
| [Upload Photos] [Upload Videos]          |
| (Anyone can upload)                      |
+------------------------------------------+
| Filter: [All ▼] [Photos] [Videos]        |
| Sort: [Newest ▼] [Oldest] [Most Liked]   |
+------------------------------------------+
| Photos (45/50)                           |
| ┌────┬────┬────┬────┐                   |
| │ 📷 │ 📷 │ 📷 │ 📷 │                   |
| ├────┼────┼────┼────┤                   |
| │ 📷 │ 📷 │ 📷 │ 📷 │                   |
| └────┴────┴────┴────┘                   |
|                                          |
| Videos (3/10)                            |
| ┌─────────────┬─────────────┐           |
| │ ▶️ Playoff  │ ▶️ Winner   │           |
| │   (2:15)    │   (1:30)    │           |
| └─────────────┴─────────────┘           |
|                                          |
| [Load More]                              |
+------------------------------------------+
```

**Photo/Video Detail View:**
```
+------------------------------------------+
|    Photo Detail                          |
+------------------------------------------+
|  ┌──────────────────────────────────┐   |
|  │                                  │   |
|  │     [Full Size Photo]            │   |
|  │                                  │   |
|  └──────────────────────────────────┘   |
|                                          |
|  Trophy presentation - John Smith       |
|                                          |
|  Uploaded by: Mike Jones                |
|  Date: Dec 15, 2025 4:30 PM             |
|  Round: Final Round                      |
|                                          |
|  [< Previous] [Next >]                   |
|  [Download] [Admin: Delete 🗑️]          |
+------------------------------------------+
```

### 6.5 Media Storage Structure

```
Firebase Storage:

/tournaments/{tournamentId}/photos/
  original/
    {photoId}.jpg (original upload)
  optimized/
    {photoId}_800x600.jpg (mobile viewing)
  thumbnails/
    {photoId}_200x200.jpg (gallery grid)

/tournaments/{tournamentId}/videos/
  original/
    {videoId}.mp4
  thumbnails/
    {videoId}_thumb.jpg

/tournaments/{tournamentId}/playoff/
  photos/
    {photoId}.jpg
  videos/
    {videoId}.mp4

Firestore:

/tournaments/{tournamentId}/media/
  {mediaId}/
    type: "photo" | "video",
    originalUrl: "...",
    optimizedUrl: "...", // photos only
    thumbnailUrl: "...",
    caption: "Trophy presentation",
    uploadedBy: "Mike Jones" | "Admin",
    uploadedAt: timestamp,
    fileSize: 1234567,
    dimensions: { width: 4000, height: 3000 }, // photos
    duration: 135, // seconds, videos only
    matchId: "...", // optional
    roundId: "...", // optional
    tags: ["playoff", "winner"],

    // Metadata
    exif: { /* camera data */ }, // optional
    location: { /* GPS */ } // optional
```

---

## 7. Security Model (Simplified for 20 People)

### 7.1 Security Philosophy

**Context:**
- Small trusted group (~20 people)
- No need for complex auth system
- Focus on preventing accidental damage, not malicious attacks
- Simple admin controls

### 7.2 Authentication System

**Single Admin Account:**
- Username: `admin`
- Password: `Greenacres` (stored as bcrypt hash)
- Session-based authentication
- 24-hour token expiration

**No User Authentication:**
- Public can view everything
- Anyone can upload photos/videos
- No login required for viewing

### 7.3 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if admin
    function isAdmin() {
      return request.auth != null &&
             request.auth.token.isAdmin == true;
    }

    // Tournaments - Read: Everyone, Write: Admin only
    match /tournaments/{tournamentId}/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Players - Read: Everyone, Write: Admin only
    match /players/{playerId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Honours Board - Read: Everyone, Write: Admin only
    match /honoursBoard/{entryId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Series - Read: Everyone, Write: Admin only
    match /series/{seriesId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Media metadata - Read: Everyone, Create: Anyone, Delete: Admin only
    match /tournaments/{tournamentId}/media/{mediaId} {
      allow read: if true;
      allow create: if true; // Anyone can upload
      allow update: if isAdmin();
      allow delete: if isAdmin(); // Only admin can delete
    }

    // Admin users collection - Admin only
    match /adminUsers/{userId} {
      allow read, write: if isAdmin();
    }

    // Active tournament reference
    match /activeTournament/current {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

### 7.4 Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper function to check file size
    function isValidSize(maxSize) {
      return request.resource.size <= maxSize;
    }

    // Helper to check image type
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }

    // Helper to check video type
    function isVideo() {
      return request.resource.contentType.matches('video/.*');
    }

    // Photos - Upload: Anyone (with size limit), Delete: Admin only
    match /tournaments/{tournamentId}/photos/{allPaths=**} {
      allow read: if true;
      allow create: if isImage() && isValidSize(5 * 1024 * 1024); // 5MB
      allow delete: if request.auth != null &&
                       request.auth.token.isAdmin == true;
    }

    // Videos - Upload: Anyone (with size limit), Delete: Admin only
    match /tournaments/{tournamentId}/videos/{allPaths=**} {
      allow read: if true;
      allow create: if isVideo() && isValidSize(100 * 1024 * 1024); // 100MB
      allow delete: if request.auth != null &&
                       request.auth.token.isAdmin == true;
    }
  }
}
```

### 7.5 Admin Login Flow

```
+------------------------------------------+
|    Admin Login                           |
+------------------------------------------+
|                                          |
|  Username: [admin___________________]    |
|                                          |
|  Password: [••••••••••••••••••••••••]    |
|                                          |
|  [ ] Remember me (24 hours)              |
|                                          |
|  [Login]                                 |
|                                          |
|  (No registration - single admin only)   |
|                                          |
+------------------------------------------+
```

**Login Process:**
1. Admin enters username/password
2. Client hashes password (bcrypt)
3. Compares with stored hash in Firestore
4. Generate JWT with `isAdmin: true` claim
5. Store token in localStorage
6. Redirect to admin dashboard

**Session Management:**
- Token stored in localStorage
- Token includes: userId, isAdmin, expiry
- Token verified on each admin route
- Expires after 24 hours
- "Remember me" extends to 7 days

### 7.6 Public Upload Tracking

```javascript
// When anyone uploads media, track uploader name
uploadMedia(file, tournamentId) {
  const uploaderName = prompt("Enter your name (optional):");

  const metadata = {
    uploadedBy: uploaderName || "Anonymous",
    uploadedAt: new Date(),
    tournamentId: tournamentId
  };

  // Upload to Storage with metadata
  // Create Firestore document with metadata
}
```

**Media Upload Attribution:**
- Optional name entry on upload
- Defaults to "Anonymous" if not provided
- Admin can see all uploads
- Admin can delete any media

---

## 8. Revised Data Architecture

### 8.1 Complete Firebase Schema

```
Firestore Collections:

/players/
  {playerId}/
    [Player data - see Section 3.2]

/players/{playerId}/tournaments/
  {tournamentId}/
    [Tournament participation data]

/players/{playerId}/handicapHistory/
  {dateId}/
    handicap: number
    date: timestamp
    changedBy: "admin"

/series/
  {seriesId}/
    id: string
    name: string
    format: string
    description: string
    firstYear: number
    totalEditions: number
    isActive: boolean
    createdAt: timestamp

/tournaments/
  {tournamentId}/
    [Core tournament data - see Section 2.2]

/tournaments/{tournamentId}/teams/
  {teamId}/
    [Team data for team formats]

/tournaments/{tournamentId}/rounds/
  {roundId}/
    [Round data for individual formats]

/tournaments/{tournamentId}/matches/
  {matchId}/
    [Match data for match play]

/tournaments/{tournamentId}/courses/
  {courseId}/
    [Course data]

/tournaments/{tournamentId}/holes/
  {holeId}/
    [Hole data]

/tournaments/{tournamentId}/media/
  {mediaId}/
    [Photo/video metadata - see Section 6.5]

/tournaments/{tournamentId}/leaderboard/
  current:
    [Cached leaderboard data]
    positions: [
      { position: 1, playerId: "...", score: "..." },
      // ...
    ]
    updatedAt: timestamp

/honoursBoard/
  {entryId}/
    [Honours entry - see Section 5.5]

/honoursByPlayer/
  {playerId}/
    [Aggregated player honours - see Section 5.5]

/honoursBySeries/
  {seriesId}/
    [Series honours history - see Section 5.5]

/activeTournament/
  current:
    tournamentId: string

/adminUsers/
  admin:
    username: "admin"
    passwordHash: "$2a$10$..." // bcrypt hash of "Greenacres"
    createdAt: timestamp
    lastLogin: timestamp

/savedCourses/
  {courseId}/
    [Saved course templates]

/appSettings/
  config:
    photoLimit: 50
    videoLimit: 10
    maxPhotoSize: 5242880 // 5MB in bytes
    maxVideoSize: 104857600 // 100MB
    allowPublicUpload: true
```

---

## 9. Scramble/Ambrose Implementation Details

### 9.1 Scramble Configuration Options

**Tournament Setup - Scramble Format:**
```
+------------------------------------------+
|    Scramble Configuration                |
+------------------------------------------+
| Team Size: (•) 4-person  ( ) 3-person    |
|            ( ) 2-person                  |
+------------------------------------------+
| Handicap System:                         |
|  ( ) No handicap (gross scores only)     |
|  (•) USGA Scramble Method                |
|      4-person: 20%+15%+10%+5%            |
|  ( ) Traditional Ambrose                 |
|      4-person: Sum ÷ 8                   |
|  ( ) Custom percentages                  |
|      [20]% [15]% [10]% [5]%             |
+------------------------------------------+
| Drive Requirements:                      |
|  [✓] Enforce minimum drives per player   |
|      Minimum: [3] drives per player      |
|      Total holes: 18                     |
+------------------------------------------+
| Scramble Rules:                          |
|  [✓] All players must tee off            |
|  [✓] Select best drive before 2nd shots  |
|  [ ] Require each player to putt once    |
|  [ ] Maximum team handicap: [___]        |
+------------------------------------------+
| [Back] [Continue]                        |
+------------------------------------------+
```

### 9.2 Scramble Scoring Interface

**Drive Selection Tracking:**
```
+------------------------------------------+
|    Josef Memorial Scramble - Team Alpha  |
+------------------------------------------+
| Players:                                 |
| • John Smith (HCP 12) - 2 drives used    |
| • Mike Jones (HCP 15) - 3 drives used    |
| • Dave Brown (HCP 9) - 2 drives used     |
| • Tom Wilson (HCP 18) - 2 drives used    |
+------------------------------------------+
| Hole 10 - Par 4 - SI 8                   |
+------------------------------------------+
| Select Best Drive:                       |
| ( ) John Smith - 250y (Fairway)          |
| (•) Mike Jones - 275y (Fairway) ✓        |
| ( ) Dave Brown - 240y (Light rough)      |
| ( ) Tom Wilson - 260y (Fairway)          |
+------------------------------------------+
| All players now play from Mike's ball    |
|                                          |
| Team Score for Hole:                     |
| [-] [4] [+]                              |
|                                          |
| Par • Birdie                             |
+------------------------------------------+
| Drive Usage Summary:                     |
| ⚠️ John needs 1 more drive (7 holes left)|
| ✓ Mike has met minimum (3/3)             |
| ⚠️ Dave needs 1 more drive               |
| ⚠️ Tom needs 1 more drive                |
+------------------------------------------+
| [< Previous Hole] [Next Hole →]          |
+------------------------------------------+
```

### 9.3 Scramble Handicap Calculation

**USGA Scramble Method (Example - 4 person):**
```javascript
// Team: John(12), Mike(15), Dave(9), Tom(18)
// Sorted ascending: Dave(9), John(12), Mike(15), Tom(18)

teamHandicap = (9 * 0.20) + (12 * 0.15) + (15 * 0.10) + (18 * 0.05)
teamHandicap = 1.8 + 1.8 + 1.5 + 0.9
teamHandicap = 6.0 (rounded)

// Apply to course
// Team gets 6 strokes allocated by hole stroke index
// Stroke on holes with SI 1-6
```

**Traditional Ambrose Method:**
```javascript
teamHandicap = (9 + 12 + 15 + 18) / 8
teamHandicap = 54 / 8
teamHandicap = 6.75 (round to 7)
```

### 9.4 Drive Requirement Validation

```javascript
// Check drive requirements at end of round
function validateDriveRequirements(round, minDrives = 3) {
  const playerDrives = {};

  round.holes.forEach(hole => {
    const selectedDriver = hole.selectedDriver;
    playerDrives[selectedDriver] = (playerDrives[selectedDriver] || 0) + 1;
  });

  const violations = [];
  round.players.forEach(player => {
    const drivesUsed = playerDrives[player.id] || 0;
    if (drivesUsed < minDrives) {
      violations.push({
        player: player.name,
        required: minDrives,
        actual: drivesUsed,
        missing: minDrives - drivesUsed
      });
    }
  });

  if (violations.length > 0) {
    // Alert scorer about violations
    // Optionally: Add penalty strokes
  }

  return violations;
}
```

---

## 10. Implementation Phases (REVISED)

### Phase 1: Foundation & Core Architecture (Weeks 1-3)

**Goal:** Establish new multi-tournament architecture and player-centric system

**Tasks:**
1. ✅ Design complete Firebase schema
2. ✅ Create player management system
   - Player CRUD operations
   - Handicap history tracking
   - Player search and selection UI
3. ✅ Implement series concept
   - Series CRUD
   - Edition tracking
4. ✅ Build admin authentication
   - Simple username/password (admin/Greenacres)
   - Session management with JWT
   - Protected routes
5. ✅ Create data migration utilities
   - Migrate current tournament to new structure
   - Preserve all existing data
6. ✅ Set up Firebase Storage
   - Photo/video upload infrastructure
   - Size limits and optimization

**Deliverables:**
- Players exist independently with history
- Admin can log in (username: admin, password: Greenacres)
- Migration script ready
- Foundation for tournaments

### Phase 2: Tournament Management (Weeks 4-5)

**Goal:** Create, manage, and switch between tournaments

**Tasks:**
1. Build tournament creation wizard
   - Type selection (6 formats)
   - Series assignment (new or existing)
   - Course selection
   - Player/team selection with search
2. Tournament list views
   - Active/upcoming/completed/archived
   - Filter by type, series, year
3. Tournament switching
   - Select active tournament
   - All views update to show selected tournament
4. Tournament status management
   - Draft → Active → Completed → Archived
5. Tournament detail pages

**Deliverables:**
- Can create all tournament types
- Can switch between tournaments
- Tournament series working

### Phase 3: Individual Stableford & Chaps Cup (Weeks 6-7)

**Goal:** Full implementation of Stableford scoring with proper handicap

**Tasks:**
1. Implement proper Stableford calculation
   - Stroke index allocation
   - Net score calculation
   - Points calculation (0-5 points)
2. Build Individual Stableford scoring UI
   - Mobile-optimized score entry
   - Real-time points display
   - Handicap visualization
3. Create Stableford leaderboard
   - Live updates
   - Points display
   - Position tracking
4. Chaps Cup as series
   - Link to historic series
   - Special honours board section
5. Playoff system
   - Tie detection
   - Playoff entry form
   - Winner selection from tied players

**Deliverables:**
- Stableford scoring works correctly
- Chaps Cup tournaments can be created
- Playoff system functional

### Phase 4: Scramble/Ambrose Format (Week 8)

**Goal:** Complete Ambrose/Scramble implementation

**Tasks:**
1. Scramble configuration options
   - Team size selection (2/3/4)
   - Handicap system selection (4 options)
   - Drive requirement setup
2. Scramble scoring interface
   - Drive selection per hole
   - Drive usage tracking
   - Requirement warnings
3. Team handicap calculation
   - USGA method
   - Traditional Ambrose
   - Custom percentages
4. Drive requirement validation
   - Real-time tracking
   - End-of-round validation
5. Josef Memorial series setup
   - Historic data entry

**Deliverables:**
- Scramble fully functional
- All handicap methods working
- Drive requirements enforced

### Phase 5: Best Ball, Shamble, Multi-Day (Week 9)

**Goal:** Implement remaining formats

**Tasks:**
1. Best Ball implementation
   - Each player own ball
   - Best score selection
   - Leaderboard
2. Shamble implementation
   - Hybrid drive selection + individual
   - Scoring interface
3. Multi-day Stableford
   - Multi-round support
   - Cumulative scoring
   - Multi-course option
4. Format-specific leaderboards

**Deliverables:**
- All 6 formats implemented
- Each format tested

### Phase 6: Honours Board (Weeks 10-11)

**Goal:** Complete honours board with classic design

**Tasks:**
1. Classic honours board UI design
   - Traditional golf club aesthetic
   - Gold/brass text effect
   - Serif fonts
   - Shield/crest design
2. Honours board views
   - By tournament type
   - By series
   - By year
3. Player/team aggregated honours
   - Search functionality
   - Filter by type
   - Win/runner-up history
4. Admin honours editor
   - Add/edit/delete entries
   - Playoff description
   - Winner selection
5. Historic Chaps Cup data entry
   - Bulk entry interface
   - Past winners import

**Deliverables:**
- Beautiful classic honours board
- Player honours aggregation
- Historic data entered
- Fully editable by admin

### Phase 7: Photo & Video System (Weeks 12-13)

**Goal:** Complete media management system

**Tasks:**
1. Photo upload system
   - Drag & drop interface
   - Client-side optimization
   - Thumbnail generation
   - 50 photo limit per tournament
2. Video upload system
   - Video upload with progress
   - Thumbnail extraction
   - 10 video limit per tournament
3. Photo/video galleries
   - Grid layout
   - Lightbox viewer
   - Swipe navigation (mobile)
   - Lazy loading
4. Media management (Admin)
   - View all uploads
   - Delete media
   - Manage captions
5. Public upload tracking
   - Optional uploader name
   - Upload attribution

**Deliverables:**
- Photos upload and display beautifully
- Videos play smoothly
- Mobile-optimized viewing
- Admin can manage all media

### Phase 8: Mobile UX Optimization (Week 14)

**Goal:** Perfect mobile experience

**Tasks:**
1. Touch optimization
   - Larger touch targets
   - Swipe gestures
   - Pull-to-refresh
2. Performance optimization
   - Lazy loading
   - Image optimization
   - Faster page loads
3. PWA implementation
   - Service worker
   - Offline mode
   - Add to home screen
4. Responsive refinements
   - Test all screens on mobile
   - Fix any layout issues

**Deliverables:**
- Excellent mobile UX
- Fast performance
- Works offline

### Phase 9: Testing & Refinement (Weeks 15-16)

**Goal:** Comprehensive testing with real data

**Tasks:**
1. Create test tournaments
   - Each format
   - Multiple series
   - Test players
2. Enter historic Chaps Cup data
3. Upload test photos/videos
4. Test all user flows
   - Tournament creation
   - Scoring (all formats)
   - Playoffs
   - Honours board
   - Media upload/delete
5. Performance testing
   - Large datasets
   - Many photos
   - Slow connections
6. Bug fixes
7. Documentation

**Deliverables:**
- All features fully tested
- Historic data entered
- Known bugs fixed
- Ready for local deployment

### Phase 10: Local Testing with Real Users (Weeks 17-18)

**Goal:** Real-world testing before production

**Tasks:**
1. Local deployment
   - Run on local network
   - Multiple device testing
2. Real tournament test
   - Run actual tournament
   - Real scoring
   - Real photos
3. Gather feedback
4. Final refinements
5. Performance tuning

**Deliverables:**
- Fully tested with real users
- Final bugs fixed
- Ready for production deployment

---

## 11. Success Criteria (REVISED)

### 11.1 Functional Requirements

✅ **Player Management**
- Players exist independently
- Handicap history tracked
- Easy player selection
- Search works well

✅ **Tournament Creation**
- All 6 formats supported
- Series assignment works
- Configuration options clear
- Player/team selection intuitive

✅ **Scoring**
- Stableford calculates correctly with stroke index
- Scramble drive tracking works
- All format scoring interfaces functional
- Mobile-friendly

✅ **Playoffs**
- Tied tournaments detected
- Playoff entry intuitive
- Winner selection clear
- Photos/videos supported

✅ **Honours Board**
- Classic aesthetic achieved
- All historic data entered
- Player aggregation works
- Filtering functional

✅ **Media**
- Photo upload smooth (50 per tournament)
- Video upload works (10 per tournament)
- Mobile-optimized viewing
- Anyone can upload, admin can delete

✅ **Security**
- Admin login works (admin/Greenacres)
- Protected routes secure
- Public upload tracked
- Simple and functional

### 11.2 Performance Requirements

✅ Page load < 3 seconds
✅ Photo galleries smooth
✅ Video playback seamless
✅ Works on 3G
✅ 50 photos load quickly
✅ Real-time scoring responsive

### 11.3 User Experience Requirements

✅ Intuitive navigation
✅ Clear tournament switching
✅ Beautiful honours board
✅ Easy scoring on mobile
✅ Smooth photo viewing
✅ No critical bugs
✅ Classic golf club feel

---

## 12. Key Differences from Original Plan

### 12.1 Major Changes

1. **Player-Centric Design**
   - Players are independent entities
   - Handicap history tracked over time
   - Player selection from existing pool
   - Player honours aggregation

2. **Series Concept**
   - Tournaments belong to series
   - Series have honours boards
   - Recurring tournaments (Josef Memorial, Chaps Cup)
   - Edition tracking

3. **Separate Stableford Types**
   - Chaps Cup = historic series
   - Individual Stableford = generic format
   - Both use same scoring logic

4. **Playoff System**
   - Dedicated tie-breaking workflow
   - Photo/video documentation
   - Runner-up tracking
   - Count-back calculation

5. **Enhanced Scramble**
   - Multiple handicap systems
   - Drive requirement tracking
   - Real-time validation
   - Team handicap calculation

6. **Classic Honours Board**
   - Traditional golf aesthetic
   - Player/team aggregation
   - Series-specific views
   - Decade grouping

7. **Public Media Upload**
   - Anyone can upload
   - Admin-only delete
   - Upload attribution
   - 50 photo limit

8. **Simplified Security**
   - Single admin account
   - admin/Greenacres
   - No user auth needed
   - Trusted group model

9. **Video Support**
   - Video upload (10 per tournament)
   - Playoff videos
   - Mobile-optimized playback
   - 100MB limit

---

## 13. Implementation Details

### 13.1 Stableford Points Calculation (Proper)

```javascript
/**
 * Calculate Stableford points for a hole
 * @param {number} grossScore - Actual strokes taken
 * @param {number} holePar - Par for the hole
 * @param {number} holeStrokeIndex - Hole difficulty (1-18)
 * @param {number} playerHandicap - Player's course handicap
 * @returns {number} Stableford points (0-5)
 */
function calculateStablefordPoints(grossScore, holePar, holeStrokeIndex, playerHandicap) {
  // Calculate strokes received on this hole
  let strokesReceived = 0;

  if (holeStrokeIndex <= playerHandicap) {
    strokesReceived = 1;
  }

  if (holeStrokeIndex <= (playerHandicap - 18)) {
    strokesReceived = 2; // For handicaps > 18
  }

  if (holeStrokeIndex <= (playerHandicap - 36)) {
    strokesReceived = 3; // For handicaps > 36
  }

  // Calculate net score
  const netScore = grossScore - strokesReceived;

  // Calculate Stableford points based on net score vs par
  const scoreDiff = holePar - netScore;

  if (scoreDiff >= 3) return 5;  // Albatross or better (3+ under)
  if (scoreDiff === 2) return 4; // Eagle (2 under)
  if (scoreDiff === 1) return 3; // Birdie (1 under)
  if (scoreDiff === 0) return 2; // Par
  if (scoreDiff === -1) return 1; // Bogey (1 over)
  return 0; // Double bogey or worse (2+ over)
}

/**
 * Example usage:
 * Hole: Par 4, Stroke Index 5
 * Player: Handicap 12
 * Gross Score: 5 (bogey)
 *
 * Strokes received: 1 (because SI 5 <= HCP 12)
 * Net score: 5 - 1 = 4 (net par)
 * Score vs par: 4 - 4 = 0 (level)
 * Points: 2 (par)
 */
```

### 13.2 Scramble Team Handicap Calculation

```javascript
/**
 * Calculate team handicap for scramble
 * @param {Array} playerHandicaps - Array of player course handicaps
 * @param {string} method - 'usga', 'ambrose', 'percentage', 'none'
 * @param {Array} customPercentages - For custom method
 * @returns {number} Team handicap
 */
function calculateScrambleTeamHandicap(playerHandicaps, method = 'usga', customPercentages = null) {
  const teamSize = playerHandicaps.length;

  // Sort handicaps ascending for USGA method
  const sortedHandicaps = [...playerHandicaps].sort((a, b) => a - b);

  let teamHandicap = 0;

  switch (method) {
    case 'none':
      return 0;

    case 'usga':
      // Standard USGA percentages
      const usgaPercentages = {
        2: [0.35, 0.15],
        3: [0.20, 0.15, 0.10],
        4: [0.20, 0.15, 0.10, 0.05]
      };

      const percentages = usgaPercentages[teamSize];
      sortedHandicaps.forEach((hcp, idx) => {
        teamHandicap += hcp * percentages[idx];
      });
      break;

    case 'ambrose':
      // Traditional Ambrose method
      const divisor = teamSize * 2;
      teamHandicap = sortedHandicaps.reduce((sum, hcp) => sum + hcp, 0) / divisor;
      break;

    case 'percentage':
      // Custom percentages (same as USGA in practice)
      if (customPercentages && customPercentages.length === teamSize) {
        sortedHandicaps.forEach((hcp, idx) => {
          teamHandicap += hcp * (customPercentages[idx] / 100);
        });
      }
      break;
  }

  return Math.round(teamHandicap);
}

/**
 * Example:
 * Team: [12, 15, 9, 18]
 * Sorted: [9, 12, 15, 18]
 * USGA 4-person: 20%, 15%, 10%, 5%
 *
 * Calculation:
 * 9 * 0.20 = 1.8
 * 12 * 0.15 = 1.8
 * 15 * 0.10 = 1.5
 * 18 * 0.05 = 0.9
 * Total = 6.0
 * Team Handicap = 6
 */
```

### 13.3 Drive Requirement Tracking

```javascript
/**
 * Track drive usage in scramble
 */
class ScrambleDriveTracker {
  constructor(players, minDrivesRequired = 3, totalHoles = 18) {
    this.players = players;
    this.minDrivesRequired = minDrivesRequired;
    this.totalHoles = totalHoles;
    this.driveUsage = {};

    players.forEach(player => {
      this.driveUsage[player.id] = {
        used: 0,
        required: minDrivesRequired,
        remaining: minDrivesRequired
      };
    });
  }

  recordDriveUsed(playerId, holeNumber) {
    if (this.driveUsage[playerId]) {
      this.driveUsage[playerId].used++;
      this.driveUsage[playerId].remaining = Math.max(
        0,
        this.minDrivesRequired - this.driveUsage[playerId].used
      );
    }
  }

  getPlayerStatus(playerId, currentHole) {
    const usage = this.driveUsage[playerId];
    const holesRemaining = this.totalHoles - currentHole;

    return {
      used: usage.used,
      required: usage.required,
      remaining: usage.remaining,
      holesLeft: holesRemaining,
      isCompliant: usage.used >= usage.required,
      warning: usage.remaining > holesRemaining,
      message: this.getStatusMessage(playerId, currentHole)
    };
  }

  getStatusMessage(playerId, currentHole) {
    const status = this.getPlayerStatus(playerId, currentHole);
    const player = this.players.find(p => p.id === playerId);

    if (status.isCompliant) {
      return `✓ ${player.name} has met minimum (${status.used}/${status.required})`;
    } else if (status.warning) {
      return `⚠️ ${player.name} needs ${status.remaining} more drive${status.remaining > 1 ? 's' : ''} (${status.holesLeft} holes left)`;
    } else {
      return `${player.name} needs ${status.remaining} more drive${status.remaining > 1 ? 's' : ''}`;
    }
  }

  validate() {
    const violations = [];

    Object.keys(this.driveUsage).forEach(playerId => {
      const usage = this.driveUsage[playerId];
      const player = this.players.find(p => p.id === playerId);

      if (usage.used < usage.required) {
        violations.push({
          playerId: playerId,
          playerName: player.name,
          used: usage.used,
          required: usage.required,
          missing: usage.remaining
        });
      }
    });

    return {
      isValid: violations.length === 0,
      violations: violations
    };
  }
}
```

---

## 14. Timeline Summary (REVISED)

**Total Estimated Time:** 18 weeks (4.5 months)

**Phase 1:** Foundation (Weeks 1-3)
- Player-centric architecture
- Admin auth
- Series concept
- Migration utilities

**Phase 2:** Tournament Management (Weeks 4-5)
- Tournament creation wizard
- Series assignment
- Switching tournaments

**Phase 3:** Stableford/Chaps Cup (Weeks 6-7)
- Proper stroke index calculation
- Stableford scoring
- Playoff system

**Phase 4:** Scramble/Ambrose (Week 8)
- Handicap systems
- Drive tracking
- Josef Memorial

**Phase 5:** Other Formats (Week 9)
- Best Ball, Shamble, Multi-day

**Phase 6:** Honours Board (Weeks 10-11)
- Classic design
- Player aggregation
- Historic data entry

**Phase 7:** Media System (Weeks 12-13)
- Photo/video upload
- Galleries
- Public upload

**Phase 8:** Mobile UX (Week 14)
- Touch optimization
- PWA
- Performance

**Phase 9:** Testing (Weeks 15-16)
- All formats
- Historic data
- Bug fixes

**Phase 10:** Local Testing (Weeks 17-18)
- Real tournament test
- User feedback
- Final polish

---

## 15. Next Steps

### 15.1 Before Starting Implementation

**Information Needed:**
1. ✅ Historic Chaps Cup winners (years, names, scores)
2. ✅ Josef Memorial history (if any)
3. ✅ Other recurring tournaments to set up
4. ✅ Player list to pre-populate database

**Decisions Needed:**
1. ✅ Exact colour scheme for honours board (gold on dark wood?)
2. ✅ Logo/crest for honours board (if any)
3. ✅ Default course(s) to include
4. ✅ Priority order for format implementation

### 15.2 Development Environment Setup

1. Create new Git branch: `major-upgrade`
2. Install new dependencies (see below)
3. Set up Firebase emulators for local testing
4. Create development Firebase project (separate from production)

### 15.3 New Dependencies to Install

```json
{
  "dependencies": {
    "browser-image-compression": "^2.0.2",
    "react-dropzone": "^14.2.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "react-image-gallery": "^1.3.0",
    "date-fns": "^3.0.0",
    "react-quill": "^2.0.0",
    "firebase": "^10.7.0" (already installed, may need update)
  },
  "devDependencies": {
    "firebase-tools": "^13.0.0" (for emulators)
  }
}
```

---

## Conclusion

This revised plan incorporates all your feedback and creates a comprehensive golf tournament management platform that:

✅ Separates Chaps Cup (historic series) from Individual Stableford (generic format)
✅ Implements proper Stableford scoring with stroke index and handicap
✅ Supports recurring tournament series (Josef Memorial, etc.)
✅ Features player-centric design with handicap history
✅ Includes playoff system for tied tournaments
✅ Creates classic honours board with player aggregation
✅ Supports photo AND video upload (anyone), admin delete only
✅ Implements proper Ambrose/Scramble handicap systems with drive tracking
✅ Uses simple security (admin/Greenacres) for 20-person group
✅ Maintains all existing Ryder Cup functionality

**Key Principles:**
- Player history preserved across tournaments
- Recurring series maintain honours boards
- Classic golf club aesthetic
- Mobile-optimized throughout
- Simple but functional security
- Comprehensive media management

**Ready to start implementation once approved!**

**Remember: All testing local only - NO production deployment until fully tested.** ✅
