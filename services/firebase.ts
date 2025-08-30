import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const auth = getAuth(app);
