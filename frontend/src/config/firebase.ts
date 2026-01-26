import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Add additional scopes if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');

/**
 * Register a new user in Firebase and send verification email.
 * The user is NOT added to the backend database until they verify their email.
 * Returns the Firebase UID for reference.
 */
export const registerWithFirebase = async (email: string, password: string): Promise<string> => {
  // Create the user in Firebase
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Send verification email
  await sendEmailVerification(userCredential.user);

  // Sign out immediately - user shouldn't be signed in until verified
  await auth.signOut();

  return userCredential.user.uid;
};

/**
 * Resend verification email by signing in temporarily.
 */
export const resendVerificationEmail = async (email: string, password: string): Promise<void> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(userCredential.user);
  await auth.signOut();
};

/**
 * Send password reset email using Firebase's built-in email service.
 * Firebase handles secure token generation, expiration, and email delivery.
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export default app;
