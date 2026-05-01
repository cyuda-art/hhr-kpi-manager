import { create } from 'zustand';
import { User, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, Unsubscribe } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  initializeAuth: () => Unsubscribe;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true, // 初期状態はローディング中として、ちらつきを防ぐ
  
  initializeAuth: () => {
    // Firebaseのログイン状態の変更を監視
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, isLoading: false });
    });
    return unsubscribe;
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null });
    } catch (error) {
      console.error("Logout failed", error);
    }
  },

  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged が発火するので set({ user }) は不要
    } catch (error) {
      console.error("Google login failed", error);
      throw error;
    }
  }
}));
