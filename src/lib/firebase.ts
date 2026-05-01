import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDp7EmCFfuDhVHitWFnNn3OLvZ0DfTa7oY",
  authDomain: "hhr-kpi-manager.firebaseapp.com",
  projectId: "hhr-kpi-manager",
  storageBucket: "hhr-kpi-manager.firebasestorage.app",
  messagingSenderId: "174053403013",
  appId: "1:174053403013:web:e815812cf6dbcd71157cec"
};

// Next.js (SSR) での複数回初期化を防ぐ
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
