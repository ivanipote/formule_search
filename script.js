/**
 * script.js - Logique UI de mathX_searcher
 * Version simplifiée SANS SPA
 */

// Variables globales
let profilePreloader = null;

// ================= INITIALISATION =================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 script.js - Initialisation');
    
    // 1. Initialiser l'UI basique
    initBasicUI();
    
    // 2. Initialiser l'authentification
    initAuthSystem();
    
    // 3. Initialiser le préchargeur
    initProfilePreloader();
    
    console.log('✅ script.js - Initialisé');
});

// ================= UI BASIQUE =================

function initBasicUI() {
    // Sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (!sidebarToggle || !sidebar || !overlay) {
        console.warn('⚠️ Éléments sidebar manquants');
        return;
    }
    
    // Ouvrir sidebar
    sidebarToggle.addEventListener('click', function() {
        console.log('📱 Ouverture sidebar');
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Fermer sidebar
    function closeSidebar() {
        console.log('📱 Fermeture sidebar');
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Fermer avec bouton
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }
    
    // Fermer avec overlay
    overlay.addEventListener('click', closeSidebar);
    
    // Fermer avec Échap
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
    
    // Navigation active
    updateActiveNav();
    
    // Feedback interactions
    addInteractionFeedback();
}

function updateActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-tab').forEach(tab => {
        const href = tab.getAttribute('href');
        if (href === currentPage) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function addInteractionFeedback() {
    // Feedback filtres
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', function() {
            const customBox = this.querySelector('.filter-custom-checkbox');
            if (customBox) {
                customBox.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    customBox.style.transform = 'scale(1)';
                }, 150);
            }
        });
    });
}

// ================= AUTHENTIFICATION =================

function initAuthSystem() {
    console.log('🔐 Initialisation authentification...');
    
    // Attendre que Firebase soit chargé
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            clearInterval(checkFirebase);
            
            try {
                // Vérifier si Firebase est initialisé
                const apps = firebase.apps;
                if (!apps || apps.length === 0) {
                    console.log('⏳ Firebase non initialisé');
                    setTimeout(initAuthSystem, 500);
                    return;
                }
                
                console.log('✅ Firebase prêt');
                
                // Configurer persistance
                firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                    .then(() => {
                        console.log('💾 Persistance activée');
                        
                        // Surveiller les changements d'authentification
                        firebase.auth().onAuthStateChanged(handleAuthChange);
                        
                        // Vérifier état actuel
                        const currentUser = firebase.auth().currentUser;
                        if (currentUser) {
                            console.log('👤 Utilisateur déjà connecté:', currentUser.email);
                            handleAuthChange(currentUser);
                        } else {
                            console.log('👤 Aucun utilisateur connecté');
                            setUserDisconnected();
                        }
                    })
                    .catch(error => {
                        console.error('❌ Erreur persistance:', error);
                        // Fallback
                        firebase.auth().onAuthStateChanged(handleAuthChange);
                    });
                
            } catch (error) {
                console.error('❌ Erreur initialisation auth:', error);
            }
        }
    }, 100);
    
    // Timeout sécurité
    setTimeout(() => {
        clearInterval(checkFirebase);
    }, 10000);
}

function handleAuthChange(user) {
    console.log('🔄 Changement état auth:', user ? user.email : 'déconnecté');
    
    if (user) {
        // Utilisateur connecté
        setUserConnected(user);
    } else {
        // Utilisateur déconnecté
        setUserDisconnected();
    }
}

function setUserConnected(user) {
    console.log('✅ Mise à jour interface: connecté');
    
    // Sauvegarder dans localStorage
    localStorage.setItem('mathx_auth_status', 'connected');
    localStorage.setItem('mathx_user_email', user.email);
    localStorage.setItem('mathx_user_id', user.uid);
    localStorage.setItem('mathx_last_check', Date.now().toString());
    
    // Mettre à jour le lien Profil
    updateProfileLink(true, user.email);
    
    // Afficher message UNIQUEMENT si première connexion
    const firstConnection = localStorage.getItem('mathx_first_connection') !== 'false';
    if (firstConnection) {
        showAuthMessage('✅ Vous êtes connecté à votre compte MTX', 'connected');
        localStorage.setItem('mathx_first_connection', 'false');
    }
    
    // Précharger les données du profil
    if (profilePreloader) {
        profilePreloader.preloadProfileData(user);
    }
}

function setUserDisconnected() {
    console.log('🚫 Mise à jour interface: déconnecté');
    
    // Vérifier si c'est une déconnexion manuelle
    const manualLogout = localStorage.getItem('mathx_manual_logout') === 'true';
    
    if (manualLogout) {
        // Déconnexion manuelle
        localStorage.removeItem('mathx_auth_status');
        localStorage.removeItem('mathx_user_email');
        localStorage.removeItem('mathx_user_id');
        localStorage.removeItem('mathx_manual_logout');
        showAuthMessage('✅ Déconnecté de votre compte MTX', 'disconnected');
    } else {
        // Déconnexion automatique, garder email pour référence
        localStorage.removeItem('mathx_auth_status');
        localStorage.removeItem('mathx_user_id');
    }
    
    // Mettre à jour le lien Profil
    updateProfileLink(false);
    
    // Nettoyer cache
    if (profilePreloader) {
        profilePreloader.clearCache();
    }
}

function updateProfileLink(isConnected, email = '') {
    const profileTab = document.getElementById('profileTab');
    if (!profileTab) return;
    
    if (isConnected) {
        // Connecté → profil.html
        profileTab.href = 'profil.html';
        profileTab.innerHTML = '<i class="fas fa-user"></i><span class="tab-label">Profil</span>';
        
        // Ajouter indicateur si préchargé
        if (profilePreloader?.isProfileReady()) {
            addPreloadIndicator(profileTab);
        }
        
    } else {
        // Non connecté → auth.html
        profileTab.href = 'auth.html';
        profileTab.innerHTML = '<i class="fas fa-user"></i><span class="tab-label">Profil</span>';
        
        // Retirer indicateur
        removePreloadIndicator(profileTab);
    }
}

// ================= PRÉCHARGEMENT =================

class ProfilePreloader {
    constructor() {
        this.cacheDuration = 10 * 60 * 1000; // 10 minutes
        console.log('🚀 ProfilePreloader créé');
    }
    
    preloadProfileData(user) {
        try {
            // Vérifier si déjà préchargé
            if (this.isProfileReady()) {
                console.log('✅ Profil déjà préchargé');
                return true;
            }
            
            console.log('📥 Préchargement données profil...');
            
            const name = user.displayName || user.email.split('@')[0];
            const avatarLetter = name.charAt(0).toUpperCase();
            
            const profileData = {
                name: name,
                email: user.email,
                avatarLetter: avatarLetter,
                level: localStorage.getItem('mathx_user_level') || 'Non défini',
                creationTime: user.metadata?.creationTime || new Date().toISOString(),
                uid: user.uid,
                lastLogin: new Date().toISOString(),
                timestamp: Date.now()
            };
            
            // Sauvegarder pour accès instantané
            localStorage.setItem('mathx_profile_data', JSON.stringify(profileData));
            localStorage.setItem('mathx_profile_timestamp', Date.now().toString());
            
            console.log('✅ Données profil préchargées');
            
            // Mettre à jour indicateur
            const profileTab = document.getElementById('profileTab');
            if (profileTab) {
                addPreloadIndicator(profileTab);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur préchargement:', error);
            return false;
        }
    }
    
    isProfileReady() {
        const timestamp = localStorage.getItem('mathx_profile_timestamp');
        if (!timestamp) return false;
        
        const age = Date.now() - parseInt(timestamp);
        return age < this.cacheDuration;
    }
    
    clearCache() {
        localStorage.removeItem('mathx_profile_data');
        localStorage.removeItem('mathx_profile_timestamp');
        
        // Retirer indicateur
        const profileTab = document.getElementById('profileTab');
        if (profileTab) {
            removePreloadIndicator(profileTab);
        }
        
        console.log('🗑️ Cache profil effacé');
    }
    
    cleanupOldCache() {
        const timestamp = localStorage.getItem('mathx_profile_timestamp');
        if (timestamp) {
            const age = Date.now() - parseInt(timestamp);
            if (age > this.cacheDuration) {
                this.clearCache();
                console.log('🧹 Cache nettoyé (trop vieux)');
            }
        }
    }
}

function initProfilePreloader() {
    profilePreloader = new ProfilePreloader();
    window.ProfilePreloader = profilePreloader;
    
    // Nettoyer périodiquement
    setInterval(() => {
        if (profilePreloader) {
            profilePreloader.cleanupOldCache();
        }
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('✅ ProfilePreloader initialisé');
}

// ================= UTILITAIRES =================

function addPreloadIndicator(element) {
    if (!element.querySelector('.preload-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'preload-indicator';
        indicator.innerHTML = '⚡';
        indicator.title = 'Profil préchargé';
        indicator.style.cssText = `
            display: inline-block;
            margin-left: 5px;
            color: #10b981;
            font-size: 0.8em;
            animation: pulse 1.5s infinite;
        `;
        element.appendChild(indicator);
        
        // Ajouter animation CSS
        if (!document.querySelector('#pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'pulse-animation';
            style.textContent = `
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

function removePreloadIndicator(element) {
    const indicator = element.querySelector('.preload-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function showAuthMessage(message, type = 'info') {
    // Supprimer anciens messages
    document.querySelectorAll('.auth-message').forEach(msg => msg.remove());
    
    // Créer message
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message auth-${type}`;
    
    let icon = 'info-circle';
    if (type === 'connected') icon = 'check-circle';
    if (type === 'disconnected') icon = 'sign-out-alt';
    
    messageDiv.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Styles
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 10px;
        font-weight: 500;
        font-size: 0.9rem;
        z-index: 9999;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 3.7s;
        max-width: 350px;
        pointer-events: none;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    if (type === 'connected') {
        messageDiv.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        messageDiv.style.color = 'white';
    } else if (type === 'disconnected') {
        messageDiv.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        messageDiv.style.color = 'white';
    }
    
    // Ajouter animations
    if (!document.querySelector('#auth-message-anim')) {
        const style = document.createElement('style');
        style.id = 'auth-message-anim';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageDiv);
    
    // Auto-suppression
    setTimeout(() => {
        if (messageDiv.parentNode) messageDiv.remove();
    }, 4000);
}

// ================= EXPORT =================

window.showAuthMessage = showAuthMessage;
window.ProfilePreloader = ProfilePreloader;

// Dans script.js (pour index.html)
function applyGlobalTheme() {
    // Vérifier le thème sauvegardé
    const savedTheme = localStorage.getItem('mathx_theme');
    const isDarkMode = localStorage.getItem('mathx_dark_mode') === 'true';
    
    if (savedTheme === 'dark' || isDarkMode) {
        // Appliquer le thème dark
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-theme');
        console.log('🌙 Thème dark appliqué globalement');
    } else {
        // Appliquer le thème light
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark-theme');
        console.log('☀️ Thème light appliqué globalement');
    }
    
    // Écouter les changements de thème depuis d'autres pages
    window.addEventListener('storage', (e) => {
        if (e.key === 'mathx_theme' || e.key === 'mathx_dark_mode') {
            console.log('🔄 Changement de thème détecté, mise à jour...');
            applyGlobalTheme();
        }
    });
    
    // Écouter l'événement personnalisé
    window.addEventListener('themeChanged', (e) => {
        if (e.detail && e.detail.theme) {
            document.documentElement.setAttribute('data-theme', e.detail.theme);
            if (e.detail.theme === 'dark') {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        }
    });
}

// Appeler au chargement
document.addEventListener('DOMContentLoaded', applyGlobalTheme);