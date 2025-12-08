/**
 * firebase-config.js - Configuration Firebase pour mathX_searcher
 * Utilise la version compatibilité pour support large
 */

console.log('🚀 Chargement configuration Firebase...');

// Configuration Firebase
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDivYRv6NdEmXx42atklaMREwF8o4n1kSo",
    authDomain: "mathx-f5396.firebaseapp.com",
    projectId: "mathx-f5396",
    storageBucket: "mathx-f5396.firebasestorage.app",
    messagingSenderId: "1036348961010",
    appId: "1:1036348961010:web:fd648d5c462b62f040606b",
    measurementId: "G-0NMWPL3ZWM"
};

// Initialiser Firebase
let firebaseApp;
let firebaseAuth;
let firebaseFirestore;
let firebaseAnalytics;

try {
    // Vérifier si Firebase est déjà chargé
    if (typeof firebase !== 'undefined') {
        firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        firebaseAuth = firebase.auth();
        firebaseFirestore = firebase.firestore();
        
        // Analytics optionnel
        if (firebase.analytics) {
            firebaseAnalytics = firebase.analytics();
            console.log('📊 Firebase Analytics initialisé');
        }
        
        console.log('✅ Firebase initialisé avec succès');
        
        // Configurer la persistance de session
        firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                console.log('💾 Persistance LOCAL activée (reste connecté)');
            })
            .catch((error) => {
                console.error('❌ Erreur persistance:', error);
            });
            
    } else {
        console.error('❌ Firebase non détecté. Vérifiez les scripts.');
    }
} catch (error) {
    console.error('❌ Erreur initialisation Firebase:', error);
}

// Fonctions utilitaires
const FirebaseManager = {
    // Getters
    getApp: () => firebaseApp,
    getAuth: () => firebaseAuth,
    getFirestore: () => firebaseFirestore,
    getAnalytics: () => firebaseAnalytics,
    
    // Vérifications
    isInitialized: () => !!firebaseApp,
    isAuthenticated: () => firebaseAuth && firebaseAuth.currentUser,
    
    // Configuration
    config: FIREBASE_CONFIG,
    
    // Mode développement
    isDevelopment: () => window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1',
    
    // Logs
    logEvent: (eventName, eventParams = {}) => {
        if (firebaseAnalytics) {
            firebaseAnalytics.logEvent(eventName, eventParams);
        }
    }
};

// Exposer globalement
window.FirebaseManager = FirebaseManager;

console.log('✅ firebase-config.js chargé');