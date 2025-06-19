import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { demoAuth } from "./demoAuth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is configured
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.appId &&
  firebaseConfig.apiKey !== 'undefined' &&
  firebaseConfig.projectId !== 'undefined' &&
  firebaseConfig.appId !== 'undefined'
);

let app: any;
let auth: any;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    auth = null;
  }
} else {
  console.log('Using demo authentication - Firebase credentials not configured');
  auth = null;
}

const googleProvider = isFirebaseConfigured ? new GoogleAuthProvider() : null;
if (googleProvider) {
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
}

const facebookProvider = isFirebaseConfigured ? new FacebookAuthProvider() : null;
if (facebookProvider) {
  facebookProvider.addScope('email');
}

export { auth };

export const signInWithGoogle = async () => {
  if (auth && googleProvider) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  } else {
    // Use demo authentication
    return await demoAuth.signInWithGoogle();
  }
};

export const signInWithFacebook = async () => {
  if (auth && facebookProvider) {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      return result;
    } catch (error) {
      console.error('Facebook sign-in error:', error);
      throw error;
    }
  } else {
    // Use demo authentication
    return await demoAuth.signInWithFacebook();
  }
};

export const logOut = () => {
  if (auth) {
    return signOut(auth);
  } else {
    return demoAuth.signOut();
  }
};

export const onAuthStateChangedWrapper = (callback: (user: any) => void) => {
  if (auth) {
    return onAuthStateChanged(auth, callback);
  } else {
    return demoAuth.onAuthStateChanged(callback);
  }
};