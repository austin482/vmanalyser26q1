// Firebase configuration
// IMPORTANT: Replace these values with your own Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your apps > SDK setup and configuration

import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase config for jom-kira project
const firebaseConfig = {
  apiKey: "AIzaSyBOLbMEv8e_swTxUpp4YlRGwq6h5z98DlI",
  authDomain: "jom-kira.firebaseapp.com",
  databaseURL: "https://jom-kira-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jom-kira",
  storageBucket: "jom-kira.firebasestorage.app",
  messagingSenderId: "871156379936",
  appId: "1:871156379936:web:915875aa417aae1c882745"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Realtime Database
const database = getDatabase(app);

export { auth, database };
