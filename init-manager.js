/**
 * init-manager.js - Gestionnaire d'initialisation pour mathX_searcher
 * Assure l'ordre correct d'initialisation des modules
 */

class InitManager {
    constructor() {
        this.modules = {};
        this.initialized = false;
        this.initQueue = [];
    }
    
    registerModule(name, initFunction, dependencies = []) {
        this.modules[name] = {
            initFunction,
            dependencies,
            initialized: false
        };
    }
    
    async initialize() {
        if (this.initialized) return;
        
        console.log('🚀 Initialisation des modules...');
        
        // Ordre d'initialisation fixe
        const initOrder = [
            'firebase',
            'auth',
            'session',
            'firestore',
            'ui'
        ];
        
        for (const moduleName of initOrder) {
            await this.initModule(moduleName);
        }
        
        this.initialized = true;
        console.log('✅ Tous les modules initialisés');
        
        // Émettre événement
        document.dispatchEvent(new CustomEvent('appInitialized'));
    }
    
    async initModule(moduleName) {
        const module = this.modules[moduleName];
        if (!module || module.initialized) return;
        
        console.log(`🔄 Initialisation: ${moduleName}`);
        
        // Vérifier dépendances
        for (const dep of module.dependencies) {
            if (!this.modules[dep]?.initialized) {
                console.warn(`⏳ Attente dépendance: ${moduleName} -> ${dep}`);
                await new Promise(resolve => setTimeout(resolve, 100));
                return this.initModule(moduleName); // Réessayer
            }
        }
        
        try {
            await module.initFunction();
            module.initialized = true;
            console.log(`✅ ${moduleName} initialisé`);
        } catch (error) {
            console.error(`❌ Erreur initialisation ${moduleName}:`, error);
        }
    }
    
    isModuleReady(moduleName) {
        return this.modules[moduleName]?.initialized || false;
    }
    
    getModule(moduleName) {
        return window[moduleName] || null;
    }
}

// Créer et configurer
const initManager = new InitManager();

// Enregistrer les modules
initManager.registerModule('firebase', () => {
    return new Promise((resolve) => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            console.log('✅ Firebase déjà chargé');
            resolve();
        } else {
            // Attendre Firebase
            const checkFirebase = setInterval(() => {
                if (typeof firebase !== 'undefined') {
                    clearInterval(checkFirebase);
                    console.log('✅ Firebase détecté');
                    resolve();
                }
            }, 100);
            
            // Timeout après 10s
            setTimeout(() => {
                clearInterval(checkFirebase);
                console.error('❌ Firebase non chargé après timeout');
                resolve();
            }, 10000);
        }
    });
});

initManager.registerModule('auth', () => {
    return new Promise((resolve) => {
        if (window.AuthManager) {
            console.log('✅ AuthManager déjà initialisé');
            resolve();
        } else {
            // Initialiser AuthManager
            if (typeof AuthManager !== 'undefined') {
                window.authManager = new AuthManager();
                window.AuthManager = window.authManager;
                console.log('✅ AuthManager créé');
            }
            resolve();
        }
    });
}, ['firebase']);

initManager.registerModule('session', () => {
    return new Promise((resolve) => {
        if (window.SessionManager) {
            console.log('✅ SessionManager déjà initialisé');
            resolve();
        } else {
            if (typeof SessionManager !== 'undefined') {
                window.sessionManager = new SessionManager();
                window.SessionManager = window.sessionManager;
                console.log('✅ SessionManager créé');
            }
            resolve();
        }
    });
}, ['auth']);

// Auto-initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => initManager.initialize(), 500);
    });
} else {
    setTimeout(() => initManager.initialize(), 500);
}

window.InitManager = initManager;
console.log('✅ InitManager chargé');