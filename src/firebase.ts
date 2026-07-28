import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const dbId = (firebaseConfig as any).firestoreDatabaseId;

// Primary Firestore Database Instance (connected to custom database ID if specified)
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
