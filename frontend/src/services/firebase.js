import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDT734g6_6LKd0NGLwFWeqL-0GuutRwgNA",
  authDomain: "dental-clinic-system-8ec1c.firebaseapp.com",
  projectId: "dental-clinic-system-8ec1c",
  storageBucket: "dental-clinic-system-8ec1c.firebasestorage.app",
  messagingSenderId: "925895588558",
  appId: "1:925895588558:web:4143bffe171c155493ae9f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;