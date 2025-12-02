# Setup Admin Account - One-Time Setup

## Step 1: Create Admin Firebase Auth Account

You need to manually create the admin account in Firebase Console (one time only):

### Option A: Via Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Authentication"** → **"Users"** tab
4. Click **"Add User"**
5. Enter:
   - **Email:** `admin@rydercup.local`
   - **Password:** `Greenacres`
6. Click **"Add User"**

### Option B: Via Browser Console (Alternative)
1. Open your app in the browser
2. Log out if you're logged in
3. Open browser console (F12)
4. Paste this code and press Enter:

```javascript
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
const auth = getAuth();
createUserWithEmailAndPassword(auth, 'admin@rydercup.local', 'Greenacres')
  .then(() => console.log('✅ Admin account created!'))
  .catch(err => console.error('Error:', err));
```

## Step 2: Test Admin Login
1. Go to your app
2. Navigate to `/admin/login`
3. Enter password: `Greenacres`
4. You should be logged in as admin

## Step 3: Add Players
Now you can add players and they will:
1. Get Firebase Auth accounts automatically
2. Appear on the player login screen
3. Admin stays logged in (no longer gets logged out)

## Troubleshooting

**"Email already exists"**
- Admin account already exists, you're good to go!

**"Password too weak"**
- Firebase requires minimum 6 characters (Greenacres is fine)

**Can't login as admin**
- Check password is exactly: `Greenacres` (capital G)
- Check email is exactly: `admin@rydercup.local`

**Players still not appearing**
- Check browser console for errors
- Verify Email/Password auth is enabled in Firebase Console
- Try adding a player and check the console logs
