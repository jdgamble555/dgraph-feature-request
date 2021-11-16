import { initializeApp } from 'firebase/app';
import { getAuth, getIdToken, getIdTokenResult, GoogleAuthProvider, isSignInWithEmailLink, onAuthStateChanged, sendSignInLinkToEmail, signInWithEmailLink } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { writable } from 'svelte/store';
import { Observable, take } from 'rxjs';

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

export async function getToken() {

    const u = new Observable<User>((observer) => {
        onAuthStateChanged(auth, (observer));
    });
    return await u.pipe(take(1))
        .toPromise()
        .then(async (_user) => {
            if (_user) {
                const token = await getIdToken(_user);
                //console.log(token);
                //console.log(await getIdTokenResult(_user));
                return token;
            }
            return null;
        });
}

export async function sendEmailLink(host: string, email: string, isDev = false): Promise<void> {
    const actionCodeSettings = {
        // Your redirect URL
        url: (isDev ? 'http://' : 'https://') + host,
        handleCodeInApp: true,
    };
    try {
        await sendSignInLinkToEmail(
            auth,
            email,
            actionCodeSettings
        );
        localStorage.setItem('emailForSignIn', email);
    } catch (e: any) {
        console.error(e);
    }
}

export async function confirmSignIn(url: string, email?: string): Promise<boolean> {
    if (!email) {
        email = localStorage.getItem('emailForSignIn') || undefined;
    }
    try {
        if (isSignInWithEmailLink(auth, url)) {

            // login user and remove the email localStorage
            if (email) {
                const r = await signInWithEmailLink(auth as any, email, url)
                localStorage.removeItem('emailForSignIn');
                await auth.updateCurrentUser(r.user);
                return true;
            }
        }
    } catch (e: any) {
        console.error(e);
    }
    return false;
}
