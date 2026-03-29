import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
