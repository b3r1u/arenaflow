import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCeJKzK1ohdcN7xlEej_X1hRpd_yZSvyrU",
  authDomain: "arenaflow-f0dac.firebaseapp.com",
  projectId: "arenaflow-f0dac",
  storageBucket: "arenaflow-f0dac.firebasestorage.app",
  messagingSenderId: "375607227609",
  appId: "1:375607227609:web:efa503a4e316813a9a3ac8"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
