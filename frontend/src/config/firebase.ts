import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCFNd-eYVkjBEUcN5COuHVkB1WcaKEWRvM",
  authDomain: "japan-lanka-d9caa.firebaseapp.com",
  projectId: "japan-lanka-d9caa",
  storageBucket: "japan-lanka-d9caa.firebasestorage.app",
  messagingSenderId: "1011061202370",
  appId: "1:1011061202370:web:a0f95a762a099c72408a5b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Add additional scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;
