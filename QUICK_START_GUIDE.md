# Quick Start Guide - Player Authentication Setup

## 🚨 IMPORTANT: Do These Steps IN ORDER

### Step 1: Create Admin Firebase Auth Account (REQUIRED FIRST!)

**You MUST do this before adding any players!**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Authentication"** → **"Users"** tab
4. Click **"Add User"**
5. Enter:
   - Email: `admin@rydercup.local`
   - Password: `Greenacres`
6. Click **"Add User"**

✅ **Verify it worked:** You should see admin@rydercup.local in the users list

---

### Step 2: Log In As Admin

1. Open your app
2. Navigate to `/admin/login`
3. Enter password: `Greenacres`
4. You should be redirected to tournaments

---

### Step 3: Option A - Add New Players (Recommended)

If you don't have existing players, just add them through the UI:

1. While logged in as admin, go to `/players`
2. Click "Add Player"
3. Enter name and handicap
4. Player will automatically get a Firebase Auth account
5. They will appear on the player login screen

**Email format:** `firstname.lastname@rydercup.local`
**Password:** `rydercup2025`

---

### Step 3: Option B - Migrate Existing Players

If you have players already in the database without auth accounts:

1. Log in as admin
2. Navigate to `/admin/migrate-players`
3. Click "Start Migration"
4. Wait for completion
5. All existing players will get auth accounts

---

### Step 4: Test Player Login

1. Log out from admin account
2. Go to `/player-login`
3. You should see player cards with names
4. Click a player name to log in
5. You should be redirected to tournaments

---

## 🐛 Troubleshooting

### "Test player didn't work"

**Cause:** Admin account doesn't exist in Firebase Auth yet

**Fix:** Complete Step 1 above FIRST before adding players

### "No player accounts found"

**Cause:** No players have Firebase Auth accounts (no `userId` field)

**Fix:** Either:
- Add new players through UI (Step 3A)
- Migrate existing players (Step 3B)

### "Can't log in as admin"

**Check:**
- Password is exactly `Greenacres` (capital G)
- Admin account exists in Firebase Console
- You're at `/admin/login` not `/player-login`

### "Adding player fails silently"

**Check browser console for errors:**
- If you see `auth/admin-restricted-operation`: Admin account doesn't exist
- If you see `auth/email-already-in-use`: Player account already exists
- If you see other errors: Check Firebase Auth is enabled in console

---

## 📋 Current System Status

### What Works:
✅ Logout redirects to login screen
✅ Protected routes require authentication
✅ Player login UI ready
✅ Admin re-authentication after adding players
✅ Migration script for existing players

### What Needs Manual Setup:
⏳ Admin Firebase Auth account (Step 1)
⏳ Players with Firebase Auth accounts (Step 3)

---

## 🔐 Password Reference

| Account | Email | Password |
|---------|-------|----------|
| Admin | admin@rydercup.local | Greenacres |
| All Players | firstname.lastname@rydercup.local | rydercup2025 |

---

## 🎯 Next Steps

1. ⚠️ **FIRST:** Create admin account in Firebase Console
2. Log in as admin at `/admin/login`
3. Either add new players OR run migration for existing players
4. Test player login
5. You're done!
