import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  get,
  child,
  remove,
  update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAwv0kDiGGvFcpZm2lKhD9Jq6dFoJXWGm0",
  authDomain: "global-power-ranking.firebaseapp.com",
  databaseURL: "https://global-power-ranking-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "global-power-ranking",
  storageBucket: "global-power-ranking.firebasestorage.app",
  messagingSenderId: "382870176620",
  appId: "1:382870176620:web:2223021ac756c798a2e949"
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  if (error?.code !== "app/duplicate-app") {
    console.error("Firebase initialization error:", error);
  }
  app = initializeApp(firebaseConfig, "pickem-app");
}

const db = getDatabase(app);

export { app, db, ref, push, set, onValue, get, child, remove, update };