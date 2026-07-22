import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Standard default Firestore database instance
export const dbDefault = getFirestore(app);

// Custom named Firestore database instance (if configured)
export const dbCustom = firebaseConfig.firestoreDatabaseId
  ? initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId)
  : null;

// Primary default export
export const db = dbDefault;
