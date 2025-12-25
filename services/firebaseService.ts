
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAiUPNX3iPOktB2oBC4u7ZCAoWaBYOPpXU",
  authDomain: "brandflow-d9af9.firebaseapp.com",
  databaseURL: "https://brandflow-d9af9-default-rtdb.firebaseio.com",
  projectId: "brandflow-d9af9",
  storageBucket: "brandflow-d9af9.firebasestorage.app",
  messagingSenderId: "261178397052",
  appId: "1:261178397052:web:a01b3d73205f06dea314f9",
  measurementId: "G-K5HD3TN500"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
