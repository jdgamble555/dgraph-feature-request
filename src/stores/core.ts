import { writable } from 'svelte/store';

// user
export const userState = writable<any>(null);

// snackbar
export const showSnackbarMsg = writable<string | null>(null);

// feature
export const featureStore = writable<any>(null);
export const delFeatureRec = writable<any>(null);
export const editFeatureRec = writable<any>(null);

// dialogs
export const showConfirm = writable<boolean>(false);
export const showDialog =  writable<boolean>(false);
export const showForm = writable<boolean>(false);
export const showSettings = writable<boolean>(false);

