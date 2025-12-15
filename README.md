# ⛳ Ryder Cup Scoring App

**By Evan Wilson**

A comprehensive real-time golf tournament management and scoring application built for Ryder Cup-style competitions. Features live scoring, multiple tournament formats, handicap calculations, analytics, and mobile-optimized Progressive Web App (PWA) capabilities.

## 🎯 Features

### Tournament Management
- **Multi-Round Tournaments**: Create tournaments with multiple rounds and different formats
- **Tournament Series**: Track performance across multiple tournaments throughout a season
- **Flexible Formats**: Support for individual and team-based competitions
- **Tournament Dashboard**: Comprehensive overview of all active and past tournaments
- **Edition Tracking**: Automatic tournament numbering and historical records

### Scoring Formats

#### Individual Formats
- **Stroke Play**: Traditional gross and net scoring with handicap adjustments
- **Stableford**: Points-based scoring system with par-based point allocation

#### Team Formats
- **Best Ball**: Each player plays their own ball, best score counts
- **Team Stableford**: Best Stableford points per hole
- **Scramble**: All players hit, team plays best shot, extensive drive tracking
- **Shamble**: Scramble off the tee, individual play after, best score counts

### Player & Team Management
- **Player Profiles**: Comprehensive player management with handicap tracking
- **Team Configuration**: Create and manage teams with custom names and colors
- **Handicap System**: Full stroke index-based handicapping with automatic adjustments
- **Player Statistics**: Detailed performance analytics per player
- **Honours Board**: Historical records of tournament winners and achievements

### Scoring Features
- **Live Scoring**: Real-time hole-by-hole scoring with instant leaderboard updates
- **Auto-Save**: Automatic score persistence to prevent data loss
- **Swipe Navigation**: Mobile-friendly swipe gestures for hole navigation
- **Score Validation**: Automatic calculation of net scores, points, and totals
- **Visual Scorecard**: Traditional golf scorecard view for in-progress matches

### Analytics & Insights
- **Tournament Analytics**:
  - Hole difficulty analysis
  - Score distribution (eagles, birdies, pars, bogeys)
  - Top hardest/easiest holes
- **Player Statistics**:
  - Career performance metrics
  - Best scores and averages
  - Score distribution visualization
  - Total rounds and points
- **Series Leaderboard**: Season-long standings across multiple tournaments

### Mobile & PWA Features
- **Progressive Web App**: Install to home screen, works offline
- **Service Worker**: Sophisticated caching for offline functionality
- **Pull-to-Refresh**: Visual refresh indicator
- **Code Splitting**: Optimized loading with lazy-loaded routes
- **Bottom Sheets**: Native mobile-style modals
- **Touch Optimized**: Swipe gestures and mobile-first design
- **Responsive Design**: Seamless experience on all devices

### Additional Features
- **Course Library**: Save and reuse course configurations
- **Media Management**: Photo uploads for tournaments (with compression)
- **Admin Controls**: Secure admin authentication for management functions
- **Anomaly Detection**: Automatic detection of unusual scores for data integrity
- **Error Boundaries**: Graceful error handling throughout the app
- **Help System**: Built-in user guide and documentation

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 with Hooks
- **Backend**: Firebase (Firestore, Storage, Authentication)
- **Routing**: React Router v6
- **Styling**: Custom CSS with Tailwind utilities
- **Icons**: Heroicons
- **State Management**: React Context API
- **PWA**: Service Workers, Web App Manifest

### Project Structure
```
src/
├── components/          # React components
│   ├── shared/         # Reusable shared components
│   ├── media/          # Media handling components
│   └── ...             # Feature components
├── contexts/           # React Context providers
├── firebase/           # Firebase services and config
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and calculations
├── App.js              # Main app component with routing
└── index.js            # App entry point

public/
├── service-worker.js   # PWA service worker
└── manifest.json       # PWA manifest
```

### Key Design Patterns
- **Component Extraction**: Shared components for consistency (HoleInfo, ScoreCard, etc.)
- **Custom Hooks**: Reusable logic (useAutoSave, useTournamentRound, useSwipeGestures)
- **Firebase Subscriptions**: Real-time data synchronization with Firestore
- **Code Splitting**: Lazy-loaded routes for optimal performance
- **Error Boundaries**: Graceful error handling and recovery

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the wizard
   - Choose a project name (e.g., "ryder-cup-scoring")

2. **Enable Firestore Database**
   - Navigate to Build > Firestore Database
   - Click "Create database"
   - Start in **test mode** for development
   - Choose your preferred region

3. **Enable Firebase Storage** (for photos)
   - Navigate to Build > Storage
   - Click "Get started"
   - Use default security rules for development

4. **Enable Authentication**
   - Navigate to Build > Authentication
   - Click "Get started"
   - Enable Email/Password provider

5. **Get Firebase Configuration**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Click the web icon (</>)
   - Register your app
   - Copy the configuration object

### 3. Configure Environment Variables

1. Create `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

2. Add your Firebase configuration to `.env`:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key_here
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

### 4. Firestore Security Rules

**Development Rules** (Firestore Database > Rules):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Production Rules** (recommended):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access
    match /{document=**} {
      allow read: if true;
    }

    // Write access requires authentication
    match /tournaments/{tournamentId} {
      allow write: if request.auth != null;
    }

    match /players/{playerId} {
      allow write: if request.auth != null;
    }

    match /courses/{courseId} {
      allow write: if request.auth != null;
    }
  }
}
```

### 5. Start Development Server
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### 6. Initial Setup in App

1. **Player Login**: Navigate to Player Login (no password required initially)
2. **Admin Login** (optional): Use admin credentials for management features
3. **Create Players**: Add players with handicaps
4. **Create Course**: Add courses to the course library
5. **Create Tournament**: Set up your first tournament with rounds
6. **Start Scoring**: Begin scoring from the tournament detail page

## 📊 Firestore Data Structure

```
tournaments/
  {tournamentId}: {
    name: string
    startDate: timestamp
    endDate: timestamp
    status: 'draft' | 'in-progress' | 'completed'
    type: 'ryder-cup' | 'individual'
    edition: number
    seriesId?: string
    teams?: [{id, name, color, players}]
    rounds: [{
      id: string
      name: string
      format: 'individual' | 'individual_stableford' | 'best_ball' |
              'scramble' | 'shamble' | 'team_stableford'
      courseData: {holes: [...]}
      matchPairings?: [...]
      status: 'not-started' | 'in-progress' | 'completed'
    }]
  }

players/
  {playerId}: {
    name: string
    handicap: number
    teamId?: string
    isRegular: boolean
    photoURL?: string
  }

courses/
  {courseId}: {
    name: string
    tee: string
    holes: [{
      number: number
      par: number
      strokeIndex: number
      distance?: number
    }]
  }

series/
  {seriesId}: {
    name: string
    startDate: timestamp
    endDate: timestamp
    tournamentIds: string[]
    status: 'active' | 'completed'
  }

scorecards/
  {scorecardId}: {
    tournamentId: string
    roundId: string
    playerId: string
    scores: [{holeNumber, grossScore, netScore, points}]
    totalGross: number
    totalNet: number
    totalPoints: number
    completed: boolean
  }

honours/
  {year}: {
    tournaments: [{
      name: string
      winners: [...]
      date: timestamp
    }]
  }
```

## 🎮 Using the App

### Creating a Tournament

1. **Navigate to Tournaments** → "Create New Tournament"
2. **Configure Tournament**:
   - Choose type (Individual or Ryder Cup)
   - Set name, dates, and series (optional)
   - Select teams and players (for Ryder Cup)
3. **Add Rounds**:
   - Click "Add Round"
   - Choose format and course
   - Configure format-specific settings
4. **Set Up Matches** (team formats):
   - Configure team pairings
   - Set match order
5. **Start Tournament**

### Scoring a Round

1. **Navigate to Tournament** → Select Round
2. **Choose Match/Player** to score
3. **Enter Scores**:
   - Use +/- buttons or type scores directly
   - Swipe left/right to navigate holes (mobile)
   - Auto-save preserves progress
4. **Submit** when complete

### Viewing Results

- **Tournament Detail**: Overall standings and round results
- **Leaderboard**: Real-time tournament rankings
- **Analytics**: Hole difficulty and score distribution
- **Player Statistics**: Individual performance metrics
- **Series Leaderboard**: Season-long standings

## 📱 Mobile Usage

### Installing as PWA
1. Open app in mobile browser
2. Look for "Install App" prompt or
3. Use browser's "Add to Home Screen" option

### Offline Mode
- App caches essential data
- Scores save locally when offline
- Syncs automatically when connection restored

### Mobile Features
- **Swipe Navigation**: Swipe left/right between holes
- **Pull to Refresh**: Pull down to refresh data
- **Bottom Sheets**: Native-style modals
- **Optimized Performance**: Code splitting for fast loads

## 🚀 Deployment

### Building for Production
```bash
npm run build
```

### Deploy to Firebase Hosting

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login**:
   ```bash
   firebase login
   ```

3. **Initialize** (first time only):
   ```bash
   firebase init hosting
   ```
   - Choose your Firebase project
   - Set public directory to: `build`
   - Configure as single-page app: Yes
   - Set up automatic builds: No

4. **Deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

5. **Your app is live!**
   - URL: `https://your-project-id.web.app`

### Continuous Deployment (Optional)

Set up GitHub Actions for automatic deployment on push:

```yaml
# .github/workflows/firebase-hosting.yml
name: Deploy to Firebase Hosting
on:
  push:
    branches: [ main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Run Tests Once (CI)
```bash
npm run test:once
```

### Coverage Report
```bash
npm run test:coverage
```

## 🔧 Troubleshooting

### Firebase Connection Issues
- Verify `.env` file exists with correct values
- Check Firebase project is active in console
- Ensure Firestore and Storage are enabled
- Verify security rules allow access

### Build Errors
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check Node version: `node --version` (should be v14+)
- Clear build folder: `rm -rf build`

### Real-time Updates Not Working
- Check Firestore security rules
- Verify network connection
- Check browser console for errors
- Ensure subscriptions are properly set up

### PWA Not Installing
- Must be served over HTTPS (or localhost)
- Check `manifest.json` is accessible
- Verify service worker is registered
- Check browser console for errors

### Scores Not Saving
- Check browser console for errors
- Verify Firebase authentication status
- Ensure proper write permissions in Firestore rules
- Check network connectivity

## 🛠️ Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests in watch mode
- `npm run test:once` - Run tests once
- `npm run test:coverage` - Generate coverage report
- `npm run eject` - Eject from Create React App (irreversible)

### Code Style

The project uses ESLint with React defaults. To check for issues:
```bash
npx eslint src/
```

### Adding New Features

1. Create feature branch: `git checkout -b feature/new-feature`
2. Implement feature with tests
3. Update documentation
4. Submit pull request

## 📝 API Documentation

### Firebase Services

Key service files:
- `src/firebase/services.js` - Core Firestore operations
- `src/firebase/tournamentServices.js` - Tournament management
- `src/firebase/mediaServices.js` - Image upload/management
- `src/firebase/config.js` - Firebase configuration

### Custom Hooks

- `useAutoSave(data, onSave)` - Auto-save with debouncing
- `useTournamentRound(tournamentId, roundId)` - Tournament data subscription
- `useSwipeGestures(onLeft, onRight)` - Touch gesture detection
- `useMobileOptimizations()` - PWA features (pull-to-refresh, install prompt)

### Utility Functions

- `calculateStablefordPoints()` - Stableford scoring
- `calculateStrokesReceived()` - Handicap calculations
- `calculateScrambleTeamHandicap()` - Team handicap formulas
- `calculatePlayerStatistics()` - Player performance metrics
- `calculateTournamentAnalytics()` - Tournament insights

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Update documentation
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

**Evan Wilson**

## 🙏 Acknowledgments

Built with Create React App and Firebase
Icons by Heroicons

## 📞 Support

For issues, questions, or feature requests:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting guide above

---

**Enjoy your tournaments! ⛳🏆**
