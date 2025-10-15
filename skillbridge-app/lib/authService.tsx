import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider, 
  signInWithPopup,
  UserCredential,
  AuthError
} from 'firebase/auth';

export const signUpWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error signing up with email and password", error);
    throw error as AuthError;
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error signing in with email and password", error);
    throw error as AuthError;
  }
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error as AuthError;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    return await auth.signOut();
  } catch (error) {
    console.error("Error signing out", error);
    throw error as AuthError;
  }
}; 