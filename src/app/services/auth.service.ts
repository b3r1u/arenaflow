import { Injectable, signal } from '@angular/core';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { firebaseAuth } from '../firebase.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<User | null>(null);
  loading = signal(true);

  constructor() {
    onAuthStateChanged(firebaseAuth, (u) => {
      this.user.set(u);
      this.loading.set(false);
    });
  }

  loginWithGoogle() {
    return signInWithPopup(firebaseAuth, new GoogleAuthProvider());
  }

  logout() {
    return signOut(firebaseAuth);
  }

  isLoggedIn(): boolean {
    return !!this.user();
  }
}
