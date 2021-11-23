export let firebase_config: any;
export let dgraph_config: any;

let process: any;

if (process && process.env) {
    dgraph_config = process.env.VITE_DGRAPH_ENDPOINT;
    firebase_config = {
        "apiKey": process.env.VITE_FIREBASE_APIKEY,
        "authDomain": process.env.VITE_FIREBASE_AUTH_DOMAIN,
        "projectId": process.env.VITE_FIREBASE_PROJECT_ID,
        "storageBucket": process.env.VITE_FIREBASE_STORAGE_BUCKET,
        "messagingSenderId": process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        "appId": process.env.VITE_FIREBASE_MEASUREMENT_ID,
        "measurementId": process.env.VITE_DGRAPH_ENDPOINT
    };
} else {
    dgraph_config = import.meta.env.VITE_DGRAPH_ENDPOINT;
    firebase_config = {
        "apiKey": import.meta.env.VITE_FIREBASE_APIKEY,
        "authDomain": import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        "projectId": import.meta.env.VITE_FIREBASE_PROJECT_ID,
        "storageBucket": import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        "messagingSenderId": import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        "appId": import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
        "measurementId": import.meta.env.VITE_DGRAPH_ENDPOINT
    };
}
