// panel-firebase-config.js

// Firebase Configuration για το Panel Διαχειριστή
const firebaseConfig = {
    apiKey: "AIzaSyDL2tuBeILoot2NpyWDw7bDrvaofG1c0FM",
    authDomain: "studio-525168498-48aed.firebaseapp.com",
    projectId: "studio-525168498-48aed",
    storageBucket: "studio-525168498-48aed.firebasestorage.app",
    messagingSenderId: "1055521759551",
    appId: "1:1055521759551:web:58a0799b4aacc3c8b4338a"
};

// Initialize Firebase
try {
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully for Admin Panel');
    } else {
        firebase.app(); // Use existing app
        console.log('Firebase app already initialized');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

console.log('Firebase Auth initialized:', typeof auth !== 'undefined');
console.log('Firestore initialized:', typeof db !== 'undefined');
