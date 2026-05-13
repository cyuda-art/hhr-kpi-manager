import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

// Using the config from src/lib/firebase.ts
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy",
  projectId: "hhr-kpi-manager",
  storageBucket: "hhr-kpi-manager.appspot.com",
  messagingSenderId: "dummy",
  appId: "dummy"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const orgId = "8st95gq6t";
  const projectId = "ncm9kjfef";
  const docRef = doc(db, 'organizations', orgId, 'projects', projectId, 'kpiData', 'main');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    fs.writeFileSync('dump.json', JSON.stringify(data, null, 2));
    console.log("Dumped to dump.json");
  } else {
    console.log("No data");
  }
}
check();
