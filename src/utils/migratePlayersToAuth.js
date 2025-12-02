/**
 * Migration Script: Add Firebase Auth Accounts to Existing Players
 *
 * This script creates Firebase Auth accounts for players that don't have userId fields.
 * Run this ONCE after setting up the admin account.
 *
 * HOW TO USE:
 * 1. Make sure admin account exists in Firebase Auth (admin@rydercup.local)
 * 2. Open browser console (F12) on your app
 * 3. Import and run this function
 *
 * EXAMPLE:
 * import { migratePlayersToAuth } from './utils/migratePlayersToAuth';
 * migratePlayersToAuth();
 */

import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getPlayers } from '../firebase/services';

export const migratePlayersToAuth = async () => {
  console.log('🚀 Starting player migration to Firebase Auth...\n');

  // Store current user (should be admin)
  const currentUser = auth.currentUser;
  const isAdmin = currentUser && currentUser.email === 'admin@rydercup.local';

  if (!isAdmin) {
    console.error('❌ ERROR: You must be logged in as admin to run this migration!');
    console.log('   Please log in as admin first, then run this script again.');
    return;
  }

  try {
    // Get all players
    const players = await getPlayers();
    console.log(`📋 Found ${players.length} total players in database\n`);

    // Filter players without auth accounts
    const playersNeedingAuth = players.filter(p => !p.userId);

    if (playersNeedingAuth.length === 0) {
      console.log('✅ All players already have auth accounts!');
      console.log('   No migration needed.');
      return;
    }

    console.log(`🔧 ${playersNeedingAuth.length} players need auth accounts\n`);
    console.log('═'.repeat(60));

    let successCount = 0;
    let errorCount = 0;

    for (const player of playersNeedingAuth) {
      try {
        // Generate email from player name
        const email = `${player.name.toLowerCase().replace(/\s+/g, '.')}@rydercup.local`;
        const commonPassword = 'rydercup2025';

        console.log(`\n🔐 Creating auth account for: ${player.name}`);
        console.log(`   Email: ${email}`);

        // Create Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          commonPassword
        );

        const userId = userCredential.user.uid;

        // Update auth user display name
        await updateProfile(userCredential.user, {
          displayName: player.name
        });

        // Update player document with userId and email
        await updateDoc(doc(db, 'players', player.id), {
          userId: userId,
          email: email,
          updatedAt: new Date().toISOString()
        });

        console.log(`   ✅ SUCCESS - Auth account created`);
        console.log(`   UID: ${userId}`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ FAILED - ${player.name}`);
        console.error(`   Error: ${error.message}`);

        if (error.code === 'auth/email-already-in-use') {
          console.log(`   ℹ️  Account may already exist for this email`);
        }

        errorCount++;
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 MIGRATION SUMMARY:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📝 Total processed: ${playersNeedingAuth.length}`);

    // Re-authenticate admin
    if (isAdmin) {
      console.log('\n🔄 Re-authenticating admin...');
      try {
        await signInWithEmailAndPassword(auth, 'admin@rydercup.local', 'Greenacres');
        console.log('✅ Admin re-authenticated successfully');
      } catch (error) {
        console.error('⚠️  Could not re-authenticate admin:', error.message);
        console.log('   Please log in again manually');
      }
    }

    console.log('\n✨ Migration complete!');
    console.log('   Players should now appear on the login screen.');
    console.log('   Refresh the page to see the updated player list.\n');

  } catch (error) {
    console.error('\n💥 MIGRATION FAILED');
    console.error('Error:', error);
  }
};

// Alternative: Migrate a single player by ID
export const migrateSinglePlayer = async (playerId) => {
  console.log(`🚀 Migrating single player: ${playerId}\n`);

  const currentUser = auth.currentUser;
  const isAdmin = currentUser && currentUser.email === 'admin@rydercup.local';

  if (!isAdmin) {
    console.error('❌ ERROR: You must be logged in as admin!');
    return;
  }

  try {
    const players = await getPlayers();
    const player = players.find(p => p.id === playerId);

    if (!player) {
      console.error(`❌ Player not found: ${playerId}`);
      return;
    }

    if (player.userId) {
      console.log(`ℹ️  Player ${player.name} already has an auth account`);
      console.log(`   User ID: ${player.userId}`);
      return;
    }

    const email = `${player.name.toLowerCase().replace(/\s+/g, '.')}@rydercup.local`;
    const commonPassword = 'rydercup2025';

    console.log(`🔐 Creating auth account for: ${player.name}`);
    console.log(`   Email: ${email}`);

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      commonPassword
    );

    const userId = userCredential.user.uid;

    await updateProfile(userCredential.user, {
      displayName: player.name
    });

    await updateDoc(doc(db, 'players', player.id), {
      userId: userId,
      email: email,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ SUCCESS - Auth account created`);
    console.log(`   UID: ${userId}`);

    // Re-authenticate admin
    if (isAdmin) {
      await signInWithEmailAndPassword(auth, 'admin@rydercup.local', 'Greenacres');
      console.log('✅ Admin re-authenticated');
    }

  } catch (error) {
    console.error(`❌ FAILED`);
    console.error(`Error: ${error.message}`);
  }
};

// Export default function
export default migratePlayersToAuth;
