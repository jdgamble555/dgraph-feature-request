import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { writable } from 'svelte/store';

export interface Auth {
    displayName: string;
    photoURL: string;
    uid: string;
    email: string;
}

initializeApp({
    apiKey: "AIzaSyBjDcDA1EdWkG7nkUEB6oaEqUD43JAoRl4",
    authDomain: "language-lover-dev.firebaseapp.com",
    databaseURL: "https://language-lover-dev.firebaseio.com",
    projectId: "language-lover-dev",
    storageBucket: "language-lover-dev.appspot.com",
    messagingSenderId: "1081124387924",
    appId: "1:1081124387924:web:9501df247987457b60c1c1",
    measurementId: "G-XKS6WT69QP"
});

// interface for database record, not firebase record
interface UserRec {
    id?: string;
    email?: string;
    displayName?: string;
}

export const isAuthenticated = writable(false);
export const user = writable<UserRec>();

export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

export async function getToken(): Promise<any> {
    return await new Promise((resolve: any, reject: any) =>
        onAuthStateChanged(auth, async (user: User) => {
            if (user) { resolve(await user.getIdToken()); }
        }, (e: any) => reject(e)));
}