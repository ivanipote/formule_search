/**
 * auth.js - Gestionnaire d'authentification pour mathX_searcher
 * Gère connexion, inscription, déconnexion avec Firebase Auth
 */

class AuthManager {
    constructor() {
        if (!window.FirebaseManager || !FirebaseManager.isInitialized()) {
            console.error('❌ Firebase non initialisé');
            return;
        }
        
        this.auth = FirebaseManager.getAuth();
        this.db = FirebaseManager.getFirestore();
        this.currentUser = null;
        this.authListeners = [];
        
        this.init();
    }
    
    init() {
        console.log('🔐 Initialisation AuthManager...');
        
        // Écouter les changements d'état d'authentification
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.notifyAuthChange(user);
            
            if (user) {
                console.log('👤 Utilisateur connecté:', user.email);
                this.saveUserToLocalStorage(user);
                this.syncUserData(user);
                
                // Log analytics
                FirebaseManager.logEvent('login', {
                    method: user.providerData[0]?.providerId || 'email'
                });
            } else {
                console.log('👤 Utilisateur déconnecté');
                this.clearLocalStorage();
            }
        });
    }
    
    // ================= CONNEXION =================
    
    /**
     * Connexion avec email et mot de passe
     */
    async signInWithEmail(email, password) {
        try {
            if (!email || !password) {
                throw new Error('Email et mot de passe requis');
            }
            
            console.log('🔐 Tentative connexion:', email);
            
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            
            // Mettre à jour le dernier accès
            await this.updateLastLogin(result.user);
            
            return {
                success: true,
                user: result.user,
                message: 'Connexion réussie'
            };
            
        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            
            let message = 'Erreur de connexion';
            switch (error.code) {
                case 'auth/invalid-email':
                    message = 'Email invalide';
                    break;
                case 'auth/user-disabled':
                    message = 'Compte désactivé';
                    break;
                case 'auth/user-not-found':
                    message = 'Compte non trouvé';
                    break;
                case 'auth/wrong-password':
                    message = 'Mot de passe incorrect';
                    break;
                case 'auth/too-many-requests':
                    message = 'Trop de tentatives. Réessayez plus tard';
                    break;
                default:
                    message = error.message;
            }
            
            return {
                success: false,
                error: error.code,
                message: message
            };
        }
    }
    
    /**
     * Connexion avec Google
     */
    async signInWithGoogle() {
        try {
            console.log('🔐 Tentative connexion Google...');
            
            const provider = new firebase.auth.GoogleAuthProvider();
            // Demander l'accès au profil
            provider.addScope('profile');
            provider.addScope('email');
            
            const result = await this.auth.signInWithPopup(provider);
            
            // Vérifier si c'est un nouvel utilisateur
            const isNewUser = result.additionalUserInfo?.isNewUser;
            
            if (isNewUser) {
                console.log('👤 Nouvel utilisateur Google');
                await this.createUserProfile(result.user, {
                    firstName: result.user.displayName?.split(' ')[0] || '',
                    lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
                    level: '' // À compléter plus tard
                });
            }
            
            await this.updateLastLogin(result.user);
            
            return {
                success: true,
                user: result.user,
                isNewUser: isNewUser,
                message: 'Connexion Google réussie'
            };
            
        } catch (error) {
            console.error('❌ Erreur connexion Google:', error);
            
            let message = 'Erreur connexion Google';
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    message = 'Connexion annulée';
                    break;
                case 'auth/popup-blocked':
                    message = 'Popup bloqué. Autorisez les popups';
                    break;
                case 'auth/account-exists-with-different-credential':
                    message = 'Compte existe déjà avec un autre méthode';
                    break;
                default:
                    message = error.message;
            }
            
            return {
                success: false,
                error: error.code,
                message: message
            };
        }
    }
    
    // ================= INSCRIPTION =================
    
    /**
     * Création de compte avec formulaire complet
     */
    async signUp(userData) {
        try {
            const { email, password, firstName, lastName, level } = userData;
            
            // Validation
            if (!email || !password || !firstName || !lastName || !level) {
                throw new Error('Tous les champs sont requis');
            }
            
            if (password.length < 6) {
                throw new Error('Le mot de passe doit faire au moins 6 caractères');
            }
            
            console.log('📝 Création compte pour:', email);
            
            // 1. Créer l'utilisateur dans Firebase Auth
            const authResult = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = authResult.user;
            
            // 2. Mettre à jour le nom d'affichage
            await user.updateProfile({
                displayName: `${firstName} ${lastName}`
            });
            
            // 3. Créer le profil dans Firestore
            await this.createUserProfile(user, { firstName, lastName, level });
            
            // 4. Envoyer l'email de vérification
            await user.sendEmailVerification();
            
            return {
                success: true,
                user: user,
                message: 'Compte créé avec succès! Vérifiez votre email.'
            };
            
        } catch (error) {
            console.error('❌ Erreur inscription:', error);
            
            let message = 'Erreur lors de l\'inscription';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    message = 'Cet email est déjà utilisé';
                    break;
                case 'auth/invalid-email':
                    message = 'Email invalide';
                    break;
                case 'auth/operation-not-allowed':
                    message = 'L\'inscription par email est désactivée';
                    break;
                case 'auth/weak-password':
                    message = 'Mot de passe trop faible';
                    break;
                default:
                    message = error.message;
            }
            
            return {
                success: false,
                error: error.code,
                message: message
            };
        }
    }
    
    // ================= PROFIL UTILISATEUR =================
    
    /**
     * Créer/MAJ profil utilisateur dans Firestore
     */
    async createUserProfile(user, additionalData = {}) {
        try {
            const userRef = this.db.collection('users').doc(user.uid);
            
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || additionalData.firstName + ' ' + additionalData.lastName,
                firstName: additionalData.firstName || '',
                lastName: additionalData.lastName || '',
                level: additionalData.level || '',
                photoURL: user.photoURL || '',
                emailVerified: user.emailVerified || false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await userRef.set(userData, { merge: true });
            console.log('✅ Profil créé pour:', user.email);
            
            return userData;
            
        } catch (error) {
            console.error('❌ Erreur création profil:', error);
            throw error;
        }
    }
    
    /**
     * Mettre à jour le dernier accès
     */
    async updateLastLogin(user) {
        try {
            if (!user) return;
            
            await this.db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            
        } catch (error) {
            console.warn('⚠️ Impossible MAJ dernier login:', error);
        }
    }
    
    /**
     * Récupérer les données du profil
     */
    async getUserProfile(uid = null) {
        try {
            const userId = uid || (this.currentUser ? this.currentUser.uid : null);
            if (!userId) return null;
            
            const doc = await this.db.collection('users').doc(userId).get();
            
            if (doc.exists) {
                return doc.data();
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération profil:', error);
            return null;
        }
    }
    
    // ================= MOT DE PASSE OUBLIÉ =================
    
    async resetPassword(email) {
        try {
            if (!email) {
                throw new Error('Email requis');
            }
            
            await this.auth.sendPasswordResetEmail(email);
            
            return {
                success: true,
                message: 'Email de réinitialisation envoyé'
            };
            
        } catch (error) {
            console.error('❌ Erreur reset password:', error);
            
            let message = 'Erreur lors de l\'envoi';
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'Aucun compte avec cet email';
                    break;
                case 'auth/invalid-email':
                    message = 'Email invalide';
                    break;
                default:
                    message = error.message;
            }
            
            return {
                success: false,
                error: error.code,
                message: message
            };
        }
    }
    
    // ================= DÉCONNEXION =================
    
    async signOut() {
        try {
            // Log analytics
            FirebaseManager.logEvent('logout');
            
            await this.auth.signOut();
            
            return {
                success: true,
                message: 'Déconnexion réussie'
            };
            
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
            
            return {
                success: false,
                error: error.code,
                message: 'Erreur lors de la déconnexion'
            };
        }
    }
    
    // ================= GESTION SESSION LOCALE =================
    
    saveUserToLocalStorage(user) {
        try {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLogin: Date.now()
            };
            
            localStorage.setItem('mathx_user', JSON.stringify(userData));
            localStorage.setItem('mathx_last_auth', Date.now().toString());
            
        } catch (error) {
            console.warn('⚠️ Impossible sauvegarde localStorage:', error);
        }
    }
    
    clearLocalStorage() {
        try {
            localStorage.removeItem('mathx_user');
            localStorage.removeItem('mathx_last_auth');
            localStorage.removeItem('mathx_favorites');
            localStorage.removeItem('mathx_history');
        } catch (error) {
            console.warn('⚠️ Impossible suppression localStorage:', error);
        }
    }
    
    getCachedUser() {
        try {
            const userStr = localStorage.getItem('mathx_user');
            const lastAuth = localStorage.getItem('mathx_last_auth');
            
            if (userStr && lastAuth) {
                const diff = Date.now() - parseInt(lastAuth);
                // Valide pendant 7 jours
                if (diff < 7 * 24 * 60 * 60 * 1000) {
                    return JSON.parse(userStr);
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }
    
    // ================= ÉVÉNEMENTS =================
    
    onAuthStateChanged(callback) {
        this.authListeners.push(callback);
        
        // Appeler immédiatement si utilisateur déjà connecté
        if (this.currentUser) {
            callback(this.currentUser);
        }
        
        // Retourner une fonction pour se désabonner
        return () => {
            this.authListeners = this.authListeners.filter(cb => cb !== callback);
        };
    }
    
    notifyAuthChange(user) {
        this.authListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('❌ Erreur listener auth:', error);
            }
        });
    }
    
    // ================= UTILITAIRES =================
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    getUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }
    
    getUserEmail() {
        return this.currentUser ? this.currentUser.email : null;
    }
}

// Initialiser et exposer globalement
let authManager = null;

function initAuthManager() {
    if (!authManager && typeof firebase !== 'undefined') {
        authManager = new AuthManager();
        window.AuthManager = authManager;
        console.log('✅ AuthManager initialisé');
    }
    return authManager;
}

// Auto-initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAuthManager, 500);
    });
} else {
    setTimeout(initAuthManager, 500);
}

// Exporter
window.initAuthManager = initAuthManager;
window.AuthManager = AuthManager;

console.log('✅ auth.js chargé');