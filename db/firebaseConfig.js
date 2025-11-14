// db/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAIKzawR-N7y9p9jeYq6nKs4C3R5Y802m0",
  authDomain: "chat-f521d.firebaseapp.com",
  databaseURL: "https://chat-f521d-default-rtdb.firebaseio.com",
  projectId: "chat-f521d",
  storageBucket: "chat-f521d.appspot.com", // este era el original: chat-f521d.firebasestorage.app
  messagingSenderId: "338129547003",
  appId: "1:338129547003:web:cfe7b3c5cdc715a6b5ca5e",
  measurementId: "G-47PE6Q5MF2",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getDatabase(app);
const dbFirestore = getFirestore(app);

export { app, auth, db, dbFirestore };
