// assets/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCvrYIgelXE4KAmdE8Cz45EzQpyEp4hLgU",
  authDomain: "cookio-f9dfe.firebaseapp.com",
  projectId: "cookio-f9dfe",
  storageBucket: "cookio-f9dfe.firebasestorage.app",
  messagingSenderId: "438977520776",
  appId: "1:438977520776:web:53c6484ba7c49193c5ab3d",
  measurementId: "G-ZXNHWR4NNR"
};

// Init Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
