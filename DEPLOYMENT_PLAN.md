# 🚀 GitHub & Cloud Deployment Plan

## Current Status
- ✅ GitHub repository: https://github.com/evanwilson77/ryder-cup-scoring.git
- ✅ Firebase Hosting configured (firebase.json exists)
- ✅ 5 commits ahead of origin/main (need to push)
- ⚠️ Large refactoring changes uncommitted (shared components)

---

## 📋 Step-by-Step Deployment Plan

### Phase 1: Commit Refactoring Changes to Git

#### Step 1: Add All New Files
```bash
# Add new shared components and hooks
git add src/hooks/
git add src/components/shared/
git add src/components/BestBallScoring.js
git add src/components/ScorecardScoring.js
git add src/components/StablefordScoring.js
git add src/components/ScrambleScoring.js
git add src/components/ShambleScoring.js

# Add documentation
git add SHARED_COMPONENTS_REFACTORING_GUIDE.md
git add REFACTORING_COMPLETE_SUMMARY.md
git add DEPLOYMENT_PLAN.md
```

#### Step 2: Review Changes
```bash
# See what's staged
git status

# Review the diff (optional but recommended)
git diff --cached --stat
```

#### Step 3: Commit the Refactoring
```bash
git commit -m "Refactor scoring components to use shared components

- Created 3 custom hooks (useAutoSave, useScoreEntry, useHoleNavigation)
- Created 9 shared UI components (LeaderboardSummary, AutoSaveIndicator, etc.)
- Refactored 5 scoring components (Scorecard, Stableford, BestBall, Scramble, Shamble)
- Eliminated 561 lines of duplicated code (22% reduction)
- Replaced 480 lines of leaderboard duplication with reusable component

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### Step 4: Add Other Modified Files
```bash
# Review what else changed
git status

# Add other modified files if they're part of this work
git add src/components/
git add src/firebase/
git add src/utils/
git add public/

# Add documentation files (optional - you may want to .gitignore some)
git add *.md

# Commit remaining changes
git commit -m "Add supporting features and documentation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Phase 2: Push to GitHub

#### Step 5: Push All Commits
```bash
# Push to GitHub
git push origin main
```

**Expected result**: All commits pushed to https://github.com/evanwilson77/ryder-cup-scoring.git

---

### Phase 3: Deploy to Firebase Hosting

#### Step 6: Install Firebase CLI (if not installed)
```bash
# Check if Firebase CLI is installed
firebase --version

# If not installed:
npm install -g firebase-tools
```

#### Step 7: Login to Firebase
```bash
firebase login
```

#### Step 8: Initialize Firebase Project (if needed)
```bash
# Check current Firebase project
firebase projects:list

# If .firebaserc doesn't exist, link to your project:
firebase use --add

# Select your Firebase project from the list
# This creates .firebaserc file
```

#### Step 9: Build the React App
```bash
# Create production build
npm run build
```

**Expected output**: Optimized build in `build/` folder

#### Step 10: Deploy to Firebase Hosting
```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting
```

**Expected output**:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR-PROJECT-ID/overview
Hosting URL: https://YOUR-PROJECT-ID.web.app
```

---

## 🔧 Configuration Checklist

### Firebase Configuration

#### 1. Update Firebase Config (if needed)
Check `src/firebase/config.js` - ensure it has your production Firebase credentials:
```javascript
const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "YOUR-PROJECT.firebaseapp.com",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-PROJECT.appspot.com",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP-ID"
};
```

#### 2. Firebase Services to Enable
In [Firebase Console](https://console.firebase.google.com):
- ✅ **Firestore Database** (for tournament data)
- ✅ **Authentication** (for admin/player login)
- ✅ **Storage** (for media uploads)
- ✅ **Hosting** (for web deployment)

#### 3. Security Rules
Ensure your Firestore and Storage security rules are deployed:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## 🌐 Alternative Deployment Options

### Option 1: Firebase Hosting (Recommended - Already Configured!)
**Pros:**
- ✅ Already configured in your project
- ✅ Integrates seamlessly with Firebase services
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Custom domain support
- ✅ Automatic atomic deploys

**Cost**: Free tier includes 10GB storage, 360MB/day transfer

**Commands:**
```bash
npm run build
firebase deploy --only hosting
```

### Option 2: Vercel
**Pros:**
- Fast deploys
- Automatic deployments from GitHub
- Great developer experience
- Free for personal projects

**Setup:**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import your repository
4. Set build command: `npm run build`
5. Set output directory: `build`
6. Add environment variables (Firebase config)
7. Deploy!

### Option 3: Netlify
**Pros:**
- Easy GitHub integration
- Automatic deploys on push
- Free SSL
- Form handling, serverless functions

**Setup:**
1. Go to [netlify.com](https://netlify.com)
2. "New site from Git"
3. Connect to GitHub repository
4. Build command: `npm run build`
5. Publish directory: `build`
6. Add environment variables
7. Deploy!

### Option 4: GitHub Pages
**Pros:**
- Free for public repositories
- Simple setup

**Setup:**
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json:
```json
{
  "homepage": "https://evanwilson77.github.io/ryder-cup-scoring",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```
3. Deploy: `npm run deploy`

---

## 🎯 Recommended Approach

### For Your Project: Use Firebase Hosting

**Why?**
1. ✅ Already configured
2. ✅ Tightly integrated with Firebase (Firestore, Auth, Storage)
3. ✅ No CORS issues
4. ✅ Same security domain
5. ✅ Easy rollbacks
6. ✅ Preview channels for testing

### Quick Start Commands
```bash
# 1. Commit changes
git add .
git commit -m "Refactor: Add shared components and reduce duplication"
git push origin main

# 2. Build and deploy
npm run build
firebase deploy --only hosting

# Done! Your app is live at https://YOUR-PROJECT.web.app
```

---

## 📦 Continuous Deployment (Optional)

### Set up GitHub Actions for Auto-Deploy

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: YOUR-PROJECT-ID
```

**Setup:**
1. Generate Firebase service account key
2. Add as GitHub secret: `FIREBASE_SERVICE_ACCOUNT`
3. Push to main → auto-deploy!

---

## 🔒 Environment Variables

### For Firebase Config (if using other platforms)
If deploying to Vercel/Netlify, add these environment variables:

```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

Update `src/firebase/config.js` to use env vars:
```javascript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
```

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] Build completes without errors: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] Firebase config is correct
- [ ] Firestore security rules are set
- [ ] Storage security rules are set
- [ ] Authentication is configured
- [ ] Test locally with production build: `npx serve -s build`
- [ ] Check responsive design works
- [ ] Test on mobile devices
- [ ] Review error handling
- [ ] Check analytics (if configured)

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules build
npm install
npm run build
```

### Firebase Deploy Issues
```bash
# Check you're logged in
firebase login

# Check current project
firebase use

# Deploy with debug
firebase deploy --only hosting --debug
```

### Routing Issues (404 on refresh)
Already configured in `firebase.json`:
```json
"rewrites": [
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

---

## 🎉 Success!

Once deployed, your app will be live at:
- **Firebase**: `https://YOUR-PROJECT-ID.web.app`
- **Custom Domain** (if configured): `https://yourdomain.com`

### Next Steps After Deployment:
1. Test all scoring formats work
2. Test media uploads
3. Test authentication
4. Share URL with users
5. Monitor Firebase usage/quotas
6. Set up custom domain (optional)

---

## 📊 Monitoring & Maintenance

### Firebase Console
- **Hosting**: View deployments, rollback if needed
- **Firestore**: Monitor database usage
- **Storage**: Check media upload usage
- **Authentication**: See user activity

### GitHub
- Review pull requests
- Monitor issues
- Track releases

---

**Ready to deploy?** Start with Phase 1 above! 🚀
