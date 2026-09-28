
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCzP05sFOj9XI5fMjNkuE6BThcNk09loJs",
    authDomain: "bb-high-school-portal.firebaseapp.com",
    projectId: "bb-high-school-portal",
    storageBucket: "bb-high-school-portal.firebasestorage.app",
    messagingSenderId: "395494679896",
    appId: "1:395494679896:web:0562c0cf6cfd12a982f12d",
    measurementId: "G-GE2W48WR17"
  };

const app = initializeApp(firebaseConfig);

// Export db and storage for all pages
export const db = getFirestore(app);
export const storage = getStorage(app);
