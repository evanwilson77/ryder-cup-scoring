import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { getPlayerByUserId } from '../firebase/services';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    // Set persistence to LOCAL (survives browser restarts)
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Error setting persistence:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Check if admin (email = admin@rydercup.local)
        if (user.email === 'admin@rydercup.local') {
          setIsAdmin(true);
          setCurrentPlayer(null);
        } else {
          // Load player profile
          setIsAdmin(false);
          const player = await getPlayerByUserId(user.uid);
          setCurrentPlayer(player);
        }
      } else {
        setIsAdmin(false);
        setCurrentPlayer(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Admin login
  const loginAsAdmin = async (password) => {
    const adminEmail = 'admin@rydercup.local';
    await signInWithEmailAndPassword(auth, adminEmail, password);
  };

  // Player login
  const loginAsPlayer = async (playerEmail) => {
    const commonPassword = 'rydercup2025';
    await signInWithEmailAndPassword(auth, playerEmail, commonPassword);
  };

  // Sign out
  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const value = {
    currentUser,
    currentPlayer,
    isAdmin,
    loading,
    loginAsAdmin,
    loginAsPlayer,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
