import { writable } from 'svelte/store';

// user
export const userState = writable<any>(null);

// snackbar
export const showSnackbarMsg = writable<string | null>(null);
export const showAuthSettings = writable<boolean>(false);

// feature
export const featureStore = writable<any>(null);
export const delFeatureRec = writable<any>(null);
export const editFeatureRec = writable<any>(null);
export const showFeatureForm = writable<boolean>(false);

// dialogs
export const showConfirm = writable<boolean>(false);
export const showDialog =  writable<boolean>(false);

// other
export const loading = writable<boolean>(false);


