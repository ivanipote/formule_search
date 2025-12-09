/**
 * profil.js - Gestion complète du profil
 */

// ================= VARIABLES GLOBALES =================

let currentTheme = 'light';

// ================= INITIALISATION =================

document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 Chargement page profil...');
    initProfil();
});

async function initProfil() {
    try {
        // 1. Vérifier l'authentification
        const user = await getCurrentUser();
        
        if (!user) {
            redirectToAuth();
            return;
        }
        
        console.log('✅ Utilisateur connecté:', user.email);
        
        // 2. Afficher les données
        await displayProfile(user);
        
        // 3. Initialiser TOUTES les fonctionnalités
        initThemeToggle();           // Thème light/dark
        initDefaultFilters();        // Filtres par défaut
        initShareButtons();          // Partage WhatsApp/Facebook
        initVersionInfo();           // Version du site
        initUserLevel();             // Niveau utilisateur
        setupLogoutButton();         // Déconnexion
        
        // 4. Mettre à jour la date
        updateLoginTime();
        
        // 5. Appliquer le thème sauvegardé
        applySavedTheme();
        
    } catch (error) {
        console.error('❌ Erreur initialisation profil:', error);
        showMessage('Erreur de chargement', 'error');
    }
}

// ================= FONCTIONS D'AUTHENTIFICATION =================

async function getCurrentUser() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) return user;
        
        return new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }
    
    // Fallback: localStorage
    const cachedUser = localStorage.getItem('mathx_user');
    if (cachedUser) {
        try {
            return JSON.parse(cachedUser);
        } catch (e) {
            console.warn('⚠️ Erreur parsing utilisateur cache');
        }
    }
    
    return null;
}

async function displayProfile(user) {
    try {
        // Utiliser d'abord les données préchargées (plus rapide)
        const cachedData = localStorage.getItem('mathx_profile_data');
        if (cachedData) {
            try {
                const data = JSON.parse(cachedData);
                displayProfileFromCache(data);
            } catch (e) {
                console.warn('⚠️ Erreur données cache:', e);
            }
        }
        
        // Mettre à jour avec données Firebase
        const name = user.displayName || user.email.split('@')[0];
        document.getElementById('userName').textContent = name;
        document.getElementById('userFullName').textContent = name;
        document.getElementById('userEmail').textContent = user.email;
        
        // Récupérer niveau depuis Firestore
        await initUserLevel();
        
        // Date inscription
        if (user.metadata?.creationTime) {
            const date = new Date(user.metadata.creationTime);
            document.getElementById('memberSince').textContent = formatDate(date);
        }
        
        // Avatar
        updateAvatar(name);
        
        // Mettre à jour le cache
        updateProfileCache(user, name);
        
    } catch (error) {
        console.error('❌ Erreur affichage profil:', error);
    }
}

function displayProfileFromCache(data) {
    // Avatar
    const avatarElement = document.getElementById('userAvatar');
    if (avatarElement && data.avatarLetter) {
        avatarElement.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%233b82f6"/><text x="50%" y="50%" font-family="Arial" font-size="60" fill="white" text-anchor="middle" dy=".3em" font-weight="bold">${data.avatarLetter}</text></svg>`;
    }
    
    // Nom
    if (data.name) {
        document.getElementById('userName').textContent = data.name;
        document.getElementById('userFullName').textContent = data.name;
    }
    
    // Email
    if (data.email) {
        document.getElementById('userEmail').textContent = data.email;
    }
    
    // Niveau
    if (data.level) {
        document.getElementById('userLevel').textContent = data.level;
    }
    
    console.log('⚡ Données affichées depuis cache');
}

function updateProfileCache(user, name) {
    try {
        const profileData = {
            name: name,
            email: user.email,
            avatarLetter: name.charAt(0).toUpperCase(),
            level: document.getElementById('userLevel').textContent,
            creationTime: user.metadata?.creationTime,
            uid: user.uid,
            lastLogin: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        localStorage.setItem('mathx_profile_data', JSON.stringify(profileData));
        localStorage.setItem('mathx_profile_timestamp', Date.now().toString());
    } catch (error) {
        console.warn('⚠️ Erreur mise à jour cache:', error);
    }
}

// ================= THÈME LIGHT/DARK =================

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    // Vérifier le thème sauvegardé
    const savedTheme = localStorage.getItem('mathx_theme');
    if (savedTheme === 'dark') {
        themeToggle.checked = true;
        currentTheme = 'dark';
    } else {
        themeToggle.checked = false;
        currentTheme = 'light';
    }
    
    // Écouter les changements
    themeToggle.addEventListener('change', function() {
        currentTheme = this.checked ? 'dark' : 'light';
        
        // Sauvegarder le choix
        localStorage.setItem('mathx_theme', currentTheme);
        localStorage.setItem('mathx_theme_changed', Date.now().toString());
        
        // Appliquer le thème
        applyTheme(currentTheme);
        
        console.log(`🎨 Thème changé: ${currentTheme}`);
    });
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('mathx_theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        applyTheme(savedTheme);
    }
}

function applyTheme(theme) {
    if (theme === 'dark') {
        // Activer le mode sombre sur TOUTES les pages
        document.body.classList.add('dark-theme');
        
        // Sauvegarder pour les autres pages
        localStorage.setItem('mathx_dark_mode', 'true');
        
    } else {
        // Activer le mode clair
        document.body.classList.remove('dark-theme');
        localStorage.setItem('mathx_dark_mode', 'false');
    }
    
    // Ajouter des styles CSS pour le dark mode
    if (!document.querySelector('#dark-mode-styles')) {
        const style = document.createElement('style');
        style.id = 'dark-mode-styles';
        style.textContent = `
            .dark-theme {
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
                color: #f1f5f9 !important;
            }
            
            .dark-theme .profile-card,
            .dark-theme .settings-section {
                background: #334155 !important;
                color: #f1f5f9 !important;
                border-color: #475569 !important;
            }
            
            .dark-theme .info-item,
            .dark-theme .version-info {
                background: #475569 !important;
                border-color: #64748b !important;
            }
            
            .dark-theme .email-section {
                background: rgba(59, 130, 246, 0.2) !important;
                border-color: rgba(59, 130, 246, 0.3) !important;
            }
            
            .dark-theme .theme-label {
                color: #cbd5e1 !important;
            }
            
            .dark-theme .settings-title {
                color: #f1f5f9 !important;
            }
            
            .dark-theme .filter-text {
                color: #e2e8f0 !important;
            }
            
            .dark-theme .version-text,
            .dark-theme .version-date {
                color: #cbd5e1 !important;
            }
            
            .dark-theme .version-text span,
            .dark-theme .version-date span {
                color: #f1f5f9 !important;
            }
            
            /* Styles pour index.html en dark mode */
            .dark-theme .header {
                background: rgba(30, 41, 59, 0.9) !important;
                border-bottom: 1px solid #475569 !important;
            }
            
            .dark-theme .search-input {
                background: #475569 !important;
                color: #f1f5f9 !important;
                border-color: #64748b !important;
            }
            
            .dark-theme .filters-bar {
                background: rgba(30, 41, 59, 0.9) !important;
                border-color: #475569 !important;
            }
            
            .dark-theme .filter-text {
                color: #cbd5e1 !important;
            }
            
            .dark-theme .welcome-state,
            .dark-theme .results-container {
                background: #334155 !important;
                color: #f1f5f9 !important;
                border-color: #475569 !important;
            }
            
            .dark-theme .bottom-nav {
                background: rgba(30, 41, 59, 0.95) !important;
                border-color: #475569 !important;
            }
            
            .dark-theme .sidebar {
                background: #1e293b !important;
                color: #f1f5f9 !important;
            }
            
            .dark-theme .sidebar-link {
                color: #cbd5e1 !important;
            }
            
            .dark-theme .sidebar-link:hover {
                background: rgba(59, 130, 246, 0.2) !important;
            }
            
            .dark-theme .nav-tab {
                color: #cbd5e1 !important;
            }
            
            .dark-theme .nav-tab.active {
                background: rgba(59, 130, 246, 0.2) !important;
                color: #3b82f6 !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// ================= FILTRES PAR DÉFAUT =================

// Dans profil.js
function initDefaultFilters() {
    console.log('🔧 Initialisation des filtres par défaut...');
    
    // Charger les filtres sauvegardés
    const savedFilters = getSavedFilters();
    
    // Appliquer aux checkboxes
    document.getElementById('filterMath').checked = savedFilters.math;
    document.getElementById('filterPhysique').checked = savedFilters.physique;
    document.getElementById('filterProfessionnel').checked = savedFilters.professionnel;
    
    // Ajouter des écouteurs d'événements
    setupFilterListeners();
}

function getSavedFilters() {
    try {
        const filtersStr = localStorage.getItem('mathx_default_filters');
        if (filtersStr) {
            return JSON.parse(filtersStr);
        }
    } catch (e) {
        console.warn('⚠️ Erreur parsing filtres:', e);
    }
    
    // Filtres par défaut
    return {
        math: true,
        physique: true,
        professionnel: true
    };
}

function setupFilterListeners() {
    const filterInputs = document.querySelectorAll('.filter-option input');
    
    filterInputs.forEach(input => {
        input.addEventListener('change', function() {
            // Récupérer l'état actuel de tous les filtres
            const filters = {
                math: document.getElementById('filterMath').checked,
                physique: document.getElementById('filterPhysique').checked,
                professionnel: document.getElementById('filterProfessionnel').checked
            };
            
            console.log('🎛️ Filtres modifiés:', filters);
            
            // Sauvegarder
            saveFilters(filters);
            
            // Synchroniser avec index.html
            syncFiltersToIndex(filters);
        });
    });
}

function saveFilters(filters) {
    try {
        localStorage.setItem('mathx_default_filters', JSON.stringify(filters));
        localStorage.setItem('mathx_filters_last_update', Date.now().toString());
        console.log('💾 Filtres sauvegardés:', filters);
    } catch (e) {
        console.error('❌ Erreur sauvegarde filtres:', e);
    }
}

function syncFiltersToIndex(filters) {
    // Créer un événement de synchronisation
    const syncEvent = new CustomEvent('filtersUpdated', {
        detail: { filters: filters }
    });
    
    // Émettre l'événement (pour index.html si ouvert)
    window.dispatchEvent(syncEvent);
    
    // Émettre aussi un événement storage pour synchroniser entre onglets
    try {
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'mathx_default_filters',
            newValue: JSON.stringify(filters),
            oldValue: localStorage.getItem('mathx_default_filters'),
            url: window.location.href
        }));
    } catch (e) {
        // Fallback pour certains navigateurs
        localStorage.setItem('mathx_filters_sync', JSON.stringify({
            filters: filters,
            timestamp: Date.now()
        }));
    }
}
    
    // Sauvegarder les changements
    document.querySelectorAll('.filter-option input').forEach(input => {
        input.addEventListener('change', function() {
            const filters = {
                math: document.getElementById('filterMath').checked,
                physique: document.getElementById('filterPhysique').checked,
                professionnel: document.getElementById('filterProfessionnel').checked
            };
            
            // Sauvegarder dans localStorage
            localStorage.setItem('mathx_default_filters', JSON.stringify(filters));
            localStorage.setItem('mathx_filters_updated', Date.now().toString());
            
            console.log('🔧 Filtres mis à jour:', filters);
        });
    });

// ================= PARTAGE DU SITE =================

function initShareButtons() {
    // WhatsApp
    const whatsappBtn = document.getElementById('shareWhatsApp');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', shareViaWhatsApp);
    }
    
    // Facebook
    const facebookBtn = document.getElementById('shareFacebook');
    if (facebookBtn) {
        facebookBtn.addEventListener('click', shareViaFacebook);
    }
}

function shareViaWhatsApp() {
    const siteUrl = window.location.origin;
    const siteName = 'mathX_searcher';
    const shareText = `Découvre ${siteName}, l'outil ultime pour trouver des formules mathématiques ! ${siteUrl}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
    
    console.log('📤 Partage WhatsApp');
}

function shareViaFacebook() {
    const siteUrl = window.location.origin;
    const siteName = 'mathX_searcher';
    const shareText = `Découvre ${siteName}, l'outil ultime pour trouver des formules mathématiques !`;
    
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    
    console.log('📤 Partage Facebook');
}

// ================= VERSION DU SITE =================

function initVersionInfo() {
    // Version actuelle
    const versionElement = document.getElementById('siteVersion');
    if (versionElement) {
        // Récupérer la version depuis localStorage ou utiliser la version par défaut
        const savedVersion = localStorage.getItem('mathx_site_version') || 'v1.0.0';
        versionElement.textContent = savedVersion;
        
        // Vérifier les mises à jour périodiquement
        setInterval(checkForUpdates, 5 * 60 * 1000); // Toutes les 5 minutes
    }
    
    // Date de dernière modification
    const dateElement = document.getElementById('lastUpdateDate');
    if (dateElement) {
        const lastModified = new Date(document.lastModified);
        dateElement.textContent = formatDate(lastModified);
        
        // Vérifier si le fichier a été modifié
        checkFileModifications();
    }
}

function checkForUpdates() {
    // En production, tu pourrais faire une requête à un serveur
    // Pour l'instant, on simule une vérification
    
    const currentVersion = document.getElementById('siteVersion').textContent;
    const lastCheck = localStorage.getItem('mathx_last_update_check');
    
    if (!lastCheck || (Date.now() - parseInt(lastCheck)) > 24 * 60 * 60 * 1000) {
        console.log('🔍 Vérification des mises à jour...');
        localStorage.setItem('mathx_last_update_check', Date.now().toString());
        
        // Simuler une mise à jour occasionnelle
        if (Math.random() < 0.1) { // 10% de chance
            incrementVersion();
        }
    }
}

function incrementVersion() {
    const versionElement = document.getElementById('siteVersion');
    const version = versionElement.textContent;
    const parts = version.split('.');
    
    // Incrémenter le patch version (v1.0.0 → v1.0.1)
    parts[2] = parseInt(parts[2]) + 1;
    const newVersion = parts.join('.');
    
    versionElement.textContent = newVersion;
    localStorage.setItem('mathx_site_version', newVersion);
    localStorage.setItem('mathx_last_update', Date.now().toString());
    
    console.log(`🔄 Version mise à jour: ${newVersion}`);
    
    // Afficher notification
    showMessage(`Nouvelle version ${newVersion} disponible !`, 'info');
}

function checkFileModifications() {
    // Vérifier si les fichiers ont été modifiés
    const lastKnownMod = localStorage.getItem('mathx_last_file_mod');
    const currentMod = document.lastModified;
    
    if (!lastKnownMod || lastKnownMod !== currentMod.toString()) {
        // Fichier modifié
        localStorage.setItem('mathx_last_file_mod', currentMod.toString());
        
        // Mettre à jour la date affichée
        const dateElement = document.getElementById('lastUpdateDate');
        if (dateElement) {
            dateElement.textContent = formatDate(new Date(currentMod));
        }
        
        // Incrémenter la version
        incrementVersion();
    }
}

// ================= NIVEAU UTILISATEUR =================

async function initUserLevel() {
    const levelElement = document.getElementById('userLevel');
    if (!levelElement) return;
    
    try {
        // 1. Vérifier localStorage d'abord (plus rapide)
        const cachedLevel = localStorage.getItem('mathx_user_level');
        if (cachedLevel) {
            levelElement.textContent = cachedLevel;
        }
        
        // 2. Récupérer depuis Firestore (en arrière-plan)
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user && window.AuthManager) {
                const userProfile = await window.AuthManager.getUserProfile();
                if (userProfile?.level) {
                    levelElement.textContent = userProfile.level;
                    localStorage.setItem('mathx_user_level', userProfile.level);
                }
            }
        }
        
        // 3. Si toujours pas de niveau, mettre par défaut
        if (levelElement.textContent === 'Non défini' || !levelElement.textContent) {
            levelElement.textContent = 'Étudiant';
            localStorage.setItem('mathx_user_level', 'Étudiant');
        }
        
    } catch (error) {
        console.warn('⚠️ Erreur récupération niveau:', error);
        levelElement.textContent = 'Étudiant';
    }
}

// ================= DÉCONNEXION =================

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', async function() {
        if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            return;
        }
        
        try {
            showMessage('Déconnexion en cours...', 'info');
            
            // Marquer comme déconnexion manuelle
            localStorage.setItem('mathx_manual_logout', 'true');
            
            // Déconnexion Firebase
            if (typeof firebase !== 'undefined' && firebase.auth) {
                await firebase.auth().signOut();
            }
            
            // Nettoyer le cache utilisateur (mais garder préférences)
            const theme = localStorage.getItem('mathx_theme');
            const filters = localStorage.getItem('mathx_default_filters');
            
            // Liste des clés à conserver
            const keysToKeep = ['mathx_theme', 'mathx_default_filters', 'mathx_site_version'];
            
            // Nettoyer le reste
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            }
            
            // Restaurer thème et filtres
            if (theme) localStorage.setItem('mathx_theme', theme);
            if (filters) localStorage.setItem('mathx_default_filters', filters);
            
            // Redirection
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
            showMessage('Erreur lors de la déconnexion', 'error');
        }
    });
}

// ================= UTILITAIRES =================

function updateAvatar(userName) {
    const avatarElement = document.getElementById('userAvatar');
    const firstLetter = userName ? userName.charAt(0).toUpperCase() : 'U';
    
    avatarElement.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%233b82f6"/><text x="50%" y="50%" font-family="Arial" font-size="60" fill="white" text-anchor="middle" dy=".3em" font-weight="bold">${firstLetter}</text></svg>`;
}

function updateLoginTime() {
    const now = new Date();
    const loginTimeElement = document.getElementById('lastLogin');
    
    if (loginTimeElement) {
        const timeString = now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        loginTimeElement.textContent = `Aujourd'hui à ${timeString}`;
    }
    
    localStorage.setItem('mathx_last_login', now.toISOString());
}

function formatDate(date) {
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function redirectToAuth() {
    console.log('❌ Utilisateur non connecté, redirection...');
    showMessage('Redirection vers la connexion...', 'warning');
    
    setTimeout(() => {
        window.location.href = 'auth.html';
    }, 2000);
}

function showMessage(text, type) {
    // Supprimer les anciens messages
    const oldMessages = document.querySelectorAll('.profile-message');
    oldMessages.forEach(msg => msg.remove());
    
    // Créer le message
    const message = document.createElement('div');
    message.className = `profile-message profile-message-${type}`;
    message.textContent = text;
    
    // Style du message
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? '#ef4444' : 
                     type === 'warning' ? '#f59e0b' : 
                     type === 'info' ? '#3b82f6' : '#10b981'};
        color: white;
        border-radius: 8px;
        z-index: 2000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: messageSlideIn 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    // Auto-suppression
    setTimeout(() => {
        message.style.animation = 'messageSlideOut 0.3s ease';
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 300);
    }, 3000);
}

// Ajouter les animations CSS pour les messages
if (!document.querySelector('#message-styles')) {
    const style = document.createElement('style');
    style.id = 'message-styles';
    style.textContent = `
        @keyframes messageSlideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes messageSlideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ================= EXPORT GLOBAL =================

// Exposer les fonctions globalement
window.initProfile = initProfil;
window.applyTheme = applyTheme;
window.getUserLevel = initUserLevel;

console.log('✅ profil.js chargé avec succès');