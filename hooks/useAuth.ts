import { useState, useEffect } from 'react';
import { auth, GoogleSignin, initializeFirebase } from '../config/firebase';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleAuthProvider } from '@react-native-firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '798027807322-q1gtt0su6gttcqrmgit6lrsl2d188oaj.apps.googleusercontent.com',
      scopes: [
        'https://www.googleapis.com/auth/calendar.events.freebusy',
      ]
    });

    const unsubscribe = auth().onAuthStateChanged(user => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const { accessToken } = await GoogleSignin.getTokens();

      if (!accessToken) {
        throw new Error('No access token present in sign-in response');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(null, accessToken);

      // Sign-in the user with the credential
      return auth().signInWithCredential(googleCredential);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Try to sign out from Google first, if it fails continue with Firebase signout
      try {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      } catch (e) {
        console.log('Google sign out failed, continuing with Firebase signout');
      }
      
      // Always sign out from Firebase
      await auth().signOut();
    } catch (error) {
      console.error('Sign Out Error:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };
};
