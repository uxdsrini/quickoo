import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBkEaoFY33JQMKHSuuO93gIvBmEJ1Su67U",
  authDomain: "listing-business-6f8d2.firebaseapp.com",
  projectId: "listing-business-6f8d2",
  storageBucket: "listing-business-6f8d2.firebasestorage.app",
  messagingSenderId: "432679788303",
  appId: "1:432679788303:web:7a7e7e7282ba3f3ddde87a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
