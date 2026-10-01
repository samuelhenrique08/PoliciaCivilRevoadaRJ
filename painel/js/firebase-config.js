/* ============================================================
   FIREBASE CONFIG
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA5JrkOmf9VSUk1yyuj63IQQeIPREGeb-k",
  authDomain: "policia-civil-revoada-rj.firebaseapp.com",
  projectId: "policia-civil-revoada-rj",
  storageBucket: "policia-civil-revoada-rj.firebasestorage.app",
  messagingSenderId: "804779854094",
  appId: "1:804779854094:web:51405c4c47c0222fbe6f5f"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);