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
    apiKey: "AIzaSyCJknZXPXhNUrDd4tPFQUSv8c8cA1IBS80",
    authDomain: "dgraph-projects.firebaseapp.com",
    projectId: "dgraph-projects",
    storageBucket: "dgraph-projects.appspot.com",
    messagingSenderId: "312138459032",
    appId: "1:312138459032:web:0f808bfeebebbdbe31eded",
    measurementId: "G-SWSZLXNZ8V"
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