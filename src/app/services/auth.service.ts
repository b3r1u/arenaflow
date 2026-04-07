import { Injectable, signal } from '@angular/core';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { firebaseAuth } from '../firebase.config';
import { ProfileService } from './profile.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<User | null>(null);
  loading = signal(true);

  constructor(private profileService: ProfileService) {
    onAuthStateChanged(firebaseAuth, (u) => {
      if (u) {
        this.profileService.init(u.uid);
      } else {
        this.profileService.clear();
      }
      this.user.set(u);
      this.loading.set(false);
    });
  }

  loginWithGoogle() {
    return signInWithPopup(firebaseAuth, new GoogleAuthProvider());
  }

  loginWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(firebaseAuth, email, password);
  }

  registerWithEmail(name: string, email: string, password: string) {
    return createUserWithEmailAndPassword(firebaseAuth, email, password).then(cred =>
      updateProfile(cred.user, { displayName: name }).then(() => cred)
    );
  }

  resetPassword(email: string) {
    return sendPasswordResetEmail(firebaseAuth, email);
  }

  logout() {
    return signOut(firebaseAuth);
  }

  isLoggedIn(): boolean {
    return !!this.user();
  }
}
