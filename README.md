# Ryder Cup Scoring App
By Evan Wilson
A real-time golf tournament scoring application built for Ryder Cup format competitions, featuring live scoring, match play formats, and handicap calculations.

## Features

- **Team Management**: Configure two teams with custom names and colors (default: Tawa Lads in red, Rest of World)
- **Player Management**: Add players with handicaps to each team
- **Course Configuration**: Set up 18 holes with par values and stroke indexes
- **Multiple Match Formats**:
  - Singles (1v1)
  - Foursomes (2v2 alternate shot)
  - Four-ball (2v2 best ball)
- **Live Scoring**: Real-time hole-by-hole scoring with automatic match play calculations
- **Handicap System**: Stroke index-based handicapping
- **Real-time Leaderboard**: Live tournament standings with match results
- **Firebase Backend**: Cloud-hosted data with real-time updates

## Tech Stack

- **Frontend**: React 18
- **Backend**: Firebase (Firestore)
- **Routing**: React Router v6
- **Styling**: Custom CSS

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable Firestore Database:
   - Go to Build > Firestore Database
   - Click "Create database"
   - Start in **test mode** (for development)
   - Choose your region

4. Get your Firebase configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (</>)
   - Register your app
   - Copy the configuration values

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

### 4. Firestore Security Rules (Important!)

For production, update your Firestore security rules. In Firebase Console:
- Go to Firestore Database > Rules
- Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for now
    // TODO: Add proper authentication and authorization
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note**: This allows anyone to read/write. For production, implement proper authentication!

### 5. Start the Development Server

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Initial Setup Workflow

1. **Teams Setup**: Navigate to "Teams" - The default teams (Tawa Lads and Rest of World) are already created
2. **Add Players**: Add players to each team with their handicaps
3. **Course Setup**: Navigate to "Course" and configure your 18 holes (default values are provided)
4. **Create Matches**: Navigate to "Matches" and create your tournament matches
5. **Start Scoring**: Begin scoring matches from the Matches page or Leaderboard
6. **View Results**: Check the real-time leaderboard for tournament standings

## Firestore Data Structure

```
tournament/
  current: { name, startDate, status }

teams/
  team1: { name: "Tawa Lads", color: "#DC2626", points, order }
  team2: { name: "Rest of World", color: "#2563EB", points, order }

players/
  {playerId}: { name, handicap, teamId }

course/
  current: { name, totalPar, holesCount }

holes/
  hole1-hole18: { number, par, strokeIndex }

matches/
  {matchId}: {
    name,
    format: "singles" | "foursomes" | "fourball",
    team1Players: [playerIds],
    team2Players: [playerIds],
    holeScores: [{...}],
    currentHole,
    status,
    result
  }
```

## Match Formats

### Singles
- 1v1 individual match play
- Each player's net score compared per hole
- Winner takes the hole, or it's halved

### Foursomes (Alternate Shot)
- 2v2 with teams alternating shots
- One ball per team
- Average team handicap applied

### Four-ball (Best Ball)
- 2v2 with each player playing their own ball
- Best net score per team wins the hole
- Individual handicaps applied

## Scoring System

- Match play format (holes won/lost)
- Completed match = 1 point
- Halved match = 0.5 points each
- Automatic handicap adjustments based on stroke index
- Match ends when result is mathematically certain

## Deployment

### Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase:
   ```bash
   firebase init
   ```
   - Select "Hosting"
   - Choose your project
   - Set build directory to `build`
   - Configure as single-page app: Yes

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## Customization

### Team Colors
Edit in `src/firebase/services.js` in the `initializeDefaultData` function:
```javascript
color: '#DC2626' // Red for Tawa Lads
color: '#2563EB' // Blue for Rest of World
```

### Course Setup
Default course includes standard par values and stroke indexes. Modify through the Course Setup page in the app.

## Troubleshooting

### Firebase Connection Issues
- Verify `.env` file has correct configuration
- Check Firebase project is active
- Ensure Firestore is enabled in Firebase Console

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be v14+)

### Real-time Updates Not Working
- Check Firestore security rules
- Verify network connection
- Check browser console for errors

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
