import { initializeApp } from 'firebase/app';
import {
    getAuth,
    getIdToken,
    GoogleAuthProvider,
    isSignInWithEmailLink,
    onIdTokenChanged,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    signInWithPopup,
    signOut
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { Observable, take } from 'rxjs';
import config from '../config.json';

export interface Auth {
    displayName: string;
    photoURL: string;
    uid: string;
    email: string;
}

initializeApp(config['firebase']);

// interface for database record, not firebase record
export interface UserRec {
    id?: string;
    email?: string;
    displayName?: string;
}

const auth = getAuth();

export async function loginWithGoogle() {
    return await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function logout() {
    return await signOut(auth);
}

export async function getToken() {
    const u = new Observable<User>((observer) => {
        onIdTokenChanged(auth, (observer));
    });
    return await u.pipe(take(1))
        // look at this todo!
        .toPromise()
        .then(async (_user) => _user
            ? await getIdToken(_user)
            : null
        );
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

export function user(): Observable<User | null> {
    return new Observable((subscriber) => {
        const unsubscribe = onIdTokenChanged(auth,
            subscriber.next.bind(subscriber),
            subscriber.error.bind(subscriber),
            subscriber.complete.bind(subscriber),
        );
        return { unsubscribe };
    });
}
