import { initializeApp, getApp, getApps } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Firebase configuration
const firebaseConfig = {
  clientId: '798027807322-q1gtt0su6gttcqrmgit6lrsl2d188oaj.apps.googleusercontent.com',
  appId: '1:798027807322:android:ae42afaba7c1aef9b97663',
  apiKey: 'AIzaSyA8RRhz2lesza91NnmCSmZS23a4Enj1ots',
  projectId: 'lumi-mobile-27038',
  storageBucket: 'lumi-mobile-27038.firebasestorage.app',
};

// Function to initialize Firebase
export const initializeFirebase = () => {
  if (!getApps().length) {
    initializeApp(firebaseConfig);

    // Configure Google Sign In
    GoogleSignin.configure({
      webClientId: '798027807322-q1gtt0su6gttcqrmgit6lrsl2d188oaj.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/calendar.events.public.readonly']
    });

    console.log('Firebase initialized successfully', GoogleSignin);
  }
  return getApp();
};

export { auth, GoogleSignin };
export default getApp;
