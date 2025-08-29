// FIX: Reverted to Firebase v8 compatibility syntax to resolve module import error.
// The error 'Module "firebase/app" has no exported member "initializeApp"' indicates
// that the installed Firebase version is likely v8, not v9+.
import firebase from "firebase/app";
import "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
   apiKey: process.env.VITE_FIREBASE_API_KEY as string,
    authDomain: "ipiaksua-bf287.firebaseapp.com",
    projectId: "ipiaksua-bf287",
    storageBucket: "ipiaksua-bf287.firebasestorage.app",
    messagingSenderId: "797680463523",
    appId: "1:797680463523:web:5b639fde8ddcb83053d916",
    measurementId: "G-20LZ7T83K2"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = firebase.firestore();
