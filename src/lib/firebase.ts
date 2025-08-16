import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error('NEXT_PUBLIC_FIREBASE_API_KEY is required');
}
if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
  throw new Error('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required');
}
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required');
}
if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
  throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is required');
}
if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
  throw new Error('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is required');
}
if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID) {
  throw new Error('NEXT_PUBLIC_FIREBASE_APP_ID is required');
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;