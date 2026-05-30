import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmK8q_8Y0G-gHNrhxllOq5o5OtdMcQKvo",
  authDomain: "pulse-b1dd9.firebaseapp.com",
  projectId: "pulse-b1dd9",
  storageBucket: "pulse-b1dd9.firebasestorage.app",
  messagingSenderId: "523423135739",
  appId: "1:523423135739:web:8ead0200dab767ed82fd5e",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
