import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBCI-Lqe1fC6VqISHy-r6DFzOXD_tqnxo",
  authDomain: "dudhkhata.firebaseapp.com",
  projectId: "dudhkhata",
  storageBucket: "dudhkhata.firebasestorage.app",
  messagingSenderId: "400840636169",
  appId: "1:400840636169:web:f304c15fb60e08e5cb85d8",
  measurementId: "G-B7WY9KK9ZD",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Multiple tabs open, persistence enabled in first tab only");
  } else if (err.code === "unimplemented") {
    console.warn("Browser does not support offline persistence");
  }
});
