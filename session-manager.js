/**
 * session-manager.js - Gestionnaire de session pour mathX_searcher
 * Persistance, navigation SPA, état utilisateur
 */

class SessionManager {
    constructor() {
        this.currentPage = 'index';
        this.userState = null;
        this.history = [];
        this.maxHistoryLength = 50;
        this.init();
    }
    
    init() {
        console.log('💾 Initialisation SessionManager...');
        
        this.loadSession();
        this.setupNavigation();
        this.setupStorageListener();
        this.setupBeforeUnload();
        
        // Écouter les changements d'authentification
        if (window.AuthManager) {
            window.AuthManager.onAuthStateChanged((user) => {
                this.handleAuthChange(user);
            });
        }
    }
    
    // ================= GESTION SESSION =================
    
    loadSession() {
        try {
            // Charger l'état utilisateur
            const userStr = localStorage.getItem('mathx_session_user');
            if (userStr) {
                this.userState = JSON.parse(userStr);
                console.log('👤 Session utilisateur chargée:', this.userState?.email);
            }
            
            // Charger l'historique navigation
            const historyStr = localStorage.getItem('mathx_nav_history');
            if (historyStr) {
                this.history = JSON.parse(historyStr);
            }
            
            // Charger l'état page courante
            const currentPage = sessionStorage.getItem('mathx_current_page');
            if (currentPage) {
                this.currentPage = currentPage;
            }
            
        } catch (error) {
            console.error('❌ Erreur chargement session:', error);
            this.clearSession();
        }
    }
    
    saveSession() {
        try {
            // Sauvegarder état utilisateur
            if (this.userState) {
                localStorage.setItem('mathx_session_user', JSON.stringify(this.userState));
            }
            
            // Sauvegarder historique (limit size)
            if (this.history.length > this.maxHistoryLength) {
                this.history = this.history.slice(-this.maxHistoryLength);
            }
            localStorage.setItem('mathx_nav_history', JSON.stringify(this.history));
            
            // Sauvegarder page courante
            sessionStorage.setItem('mathx_current_page', this.currentPage);
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde session:', error);
        }
    }
    
    clearSession() {
        try {
            // Garder certaines préférences
            const theme = localStorage.getItem('mathx_theme');
            const language = localStorage.getItem('mathx_language');
            
            // Effacer le reste
            localStorage.removeItem('mathx_session_user');
            localStorage.removeItem('mathx_nav_history');
            localStorage.removeItem('mathx_favorites');
            localStorage.removeItem('mathx_search_history');
            
            // Restaurer préférences
            if (theme) localStorage.setItem('mathx_theme', theme);
            if (language) localStorage.setItem('mathx_language', language);
            
            this.userState = null;
            this.history = [];
            
            console.log('🧹 Session effacée');
            
        } catch (error) {
            console.error('❌ Erreur effacement session:', error);
        }
    }
    
    // ================= GESTION UTILISATEUR =================
    
    handleAuthChange(user) {
        if (user) {
            // Utilisateur connecté
            this.userState = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastAuth: Date.now(),
                isAuthenticated: true
            };
            
            // Synchroniser les données locales avec Firebase
            this.syncUserData(user.uid);
            
        } else {
            // Utilisateur déconnecté
            this.userState = {
                isAuthenticated: false,
                lastAuth: Date.now()
            };
            
            // Effacer données sensibles
            this.clearSession();
        }
        
        this.saveSession();
        this.updateUI();
    }
    
    async syncUserData(userId) {
        try {
            // Synchroniser favoris
            await this.syncFavorites(userId);
            
            // Synchroniser historique
            await this.syncHistory(userId);
            
            // Synchroniser préférences
            await this.syncPreferences(userId);
            
            console.log('🔄 Données utilisateur synchronisées');
            
        } catch (error) {
            console.warn('⚠️ Erreur synchronisation:', error);
        }
    }
    
    async syncFavorites(userId) {
        try {
            const localFavorites = this.getLocalFavorites();
            
            if (localFavorites.length > 0 && window.FirestoreManager) {
                await window.FirestoreManager.syncFavorites(userId, localFavorites);
                localStorage.removeItem('mathx_favorites');
            }
            
        } catch (error) {
            console.warn('⚠️ Erreur sync favoris:', error);
        }
    }
    
    async syncHistory(userId) {
        try {
            const localHistory = this.getLocalHistory();
            
            if (localHistory.length > 0 && window.FirestoreManager) {
                await window.FirestoreManager.syncHistory(userId, localHistory);
                localStorage.removeItem('mathx_search_history');
            }
            
        } catch (error) {
            console.warn('⚠️ Erreur sync historique:', error);
        }
    }
    
    async syncPreferences(userId) {
        // À implémenter avec FirestoreManager
    }
    
    // ================= NAVIGATION SPA =================
    
    setupNavigation() {
        // Intercepter les clics sur les liens
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && this.shouldHandleLink(link)) {
                e.preventDefault();
                this.navigateTo(link.href, link.dataset.page || this.getPageFromUrl(link.href));
            }
        });
        
        // Gérer le bouton retour
        window.addEventListener('popstate', (e) => {
            this.handlePopState(e);
        });
        
        // Initialiser l'état actuel
        this.updateCurrentPage();
    }
    
    shouldHandleLink(link) {
        // Ne pas intercepter les liens externes, ancres, ou avec target="_blank"
        const href = link.getAttribute('href');
        return href && 
               !href.startsWith('http') && 
               !href.startsWith('//') &&
               !href.startsWith('mailto:') &&
               !href.startsWith('tel:') &&
               !href.startsWith('#') &&
               link.target !== '_blank' &&
               !link.hasAttribute('download');
    }
    
    async navigateTo(url, pageName, options = {}) {
        const {
            addToHistory = true,
            replaceState = false,
            scrollToTop = true
        } = options;
        
        console.log('🧭 Navigation vers:', pageName);
        
        // Enregistrer dans l'historique
        if (addToHistory) {
            this.addToHistory({
                url: url,
                page: pageName,
                timestamp: Date.now(),
                referrer: this.currentPage
            });
        }
        
        // Mettre à jour l'état
        this.currentPage = pageName;
        
        // Navigation SPA (si page existe)
        if (this.isSPAPage(pageName)) {
            await this.loadSPAPage(pageName);
            
            // Mettre à jour l'URL sans rechargement
            if (replaceState) {
                window.history.replaceState({ page: pageName }, '', url);
            } else {
                window.history.pushState({ page: pageName }, '', url);
            }
            
        } else {
            // Navigation traditionnelle
            window.location.href = url;
            return;
        }
        
        // Défilement vers le haut
        if (scrollToTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Sauvegarder session
        this.saveSession();
        
        // Émettre événement
        this.emitNavigationEvent(pageName);
    }
    
    isSPAPage(pageName) {
        // Pages qui peuvent être chargées en SPA
        const spaPages = ['index', 'profil', 'exercices', 'favorites', 'history'];
        return spaPages.includes(pageName);
    }
    
    async loadSPAPage(pageName) {
        console.log('🔄 Chargement SPA:', pageName);
        
        // Afficher indicateur de chargement
        this.showLoading();
        
        try {
            // Simuler chargement (à remplacer par fetch réel)
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Mettre à jour le contenu
            this.updatePageContent(pageName);
            
        } catch (error) {
            console.error('❌ Erreur chargement page:', error);
            this.showError('Erreur de chargement');
        } finally {
            this.hideLoading();
        }
    }
    
    updatePageContent(pageName) {
        // À implémenter: charger le contenu dynamique
        // Pour l'instant, on met juste à jour le titre
        document.title = this.getPageTitle(pageName);
        
        // Mettre à jour les classes du body
        document.body.className = '';
        document.body.classList.add(`${pageName}-page`);
    }
    
    getPageTitle(pageName) {
        const titles = {
            'index': 'mathX_searcher - Recherche de formules',
            'profil': 'Mon Profil - mathX_searcher',
            'exercices': 'Exercices - mathX_searcher',
            'favorites': 'Mes Favoris - mathX_searcher',
            'history': 'Historique - mathX_searcher'
        };
        
        return titles[pageName] || 'mathX_searcher';
    }
    
    handlePopState(e) {
        if (e.state && e.state.page) {
            this.currentPage = e.state.page;
            this.updatePageContent(e.state.page);
            this.saveSession();
        }
    }
    
    updateCurrentPage() {
        const path = window.location.pathname;
        const page = this.getPageFromPath(path);
        this.currentPage = page;
        
        // Mettre à jour l'état initial
        if (window.history.state === null) {
            window.history.replaceState({ page: page }, '', window.location.href);
        }
    }
    
    getPageFromPath(path) {
        if (path.includes('profil')) return 'profil';
        if (path.includes('exercices')) return 'exercices';
        if (path.includes('auth')) return 'auth';
        return 'index';
    }
    
    getPageFromUrl(url) {
        try {
            const urlObj = new URL(url, window.location.origin);
            return this.getPageFromPath(urlObj.pathname);
        } catch {
            return 'index';
        }
    }
    
    // ================= HISTORIQUE NAVIGATION =================
    
    addToHistory(entry) {
        this.history.push(entry);
        
        // Limiter la taille
        if (this.history.length > this.maxHistoryLength) {
            this.history = this.history.slice(-this.maxHistoryLength);
        }
        
        this.saveSession();
    }
    
    getNavigationHistory() {
        return [...this.history];
    }
    
    clearNavigationHistory() {
        this.history = [];
        this.saveSession();
    }
    
    // ================= ÉTAT LOCAL (favoris, historique) =================
    
    getLocalFavorites() {
        try {
            const favorites = localStorage.getItem('mathx_favorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch {
            return [];
        }
    }
    
    saveLocalFavorites(favorites) {
        try {
            localStorage.setItem('mathx_favorites', JSON.stringify(favorites));
        } catch (error) {
            console.warn('⚠️ Erreur sauvegarde favoris:', error);
        }
    }
    
    getLocalHistory() {
        try {
            const history = localStorage.getItem('mathx_search_history');
            return history ? JSON.parse(history) : [];
        } catch {
            return [];
        }
    }
    
    saveLocalHistory(history) {
        try {
            localStorage.setItem('mathx_search_history', JSON.stringify(history));
        } catch (error) {
            console.warn('⚠️ Erreur sauvegarde historique:', error);
        }
    }
    
    addSearchToHistory(searchTerm) {
        try {
            const history = this.getLocalHistory();
            const entry = {
                term: searchTerm,
                timestamp: Date.now(),
                page: this.currentPage
            };
            
            // Éviter les doublons récents
            const recentDuplicate = history.find(h => 
                h.term === searchTerm && 
                (Date.now() - h.timestamp) < 60000 // 1 minute
            );
            
            if (!recentDuplicate) {
                history.unshift(entry);
                
                // Limiter à 100 entrées
                if (history.length > 100) {
                    history.pop();
                }
                
                this.saveLocalHistory(history);
            }
            
        } catch (error) {
            console.warn('⚠️ Erreur ajout historique recherche:', error);
        }
    }
    
    // ================= UI & ÉVÉNEMENTS =================
    
    updateUI() {
        // Mettre à jour l'interface selon l'état
        const isAuthenticated = this.userState?.isAuthenticated;
        
        // Exemple: afficher/masquer éléments
        document.querySelectorAll('[data-auth="true"]').forEach(el => {
            el.style.display = isAuthenticated ? '' : 'none';
        });
        
        document.querySelectorAll('[data-auth="false"]').forEach(el => {
            el.style.display = isAuthenticated ? 'none' : '';
        });
        
        // Mettre à jour le nom utilisateur
        if (isAuthenticated && this.userState.displayName) {
            document.querySelectorAll('.user-display-name').forEach(el => {
                el.textContent = this.userState.displayName;
            });
        }
    }
    
    showLoading() {
        // Créer ou afficher l'indicateur de chargement
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'global-loader';
            loader.innerHTML = `
                <div class="loader-spinner"></div>
                <div class="loader-text">Chargement...</div>
            `;
            document.body.appendChild(loader);
            
            // Styles inline
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(5px);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                transition: opacity 0.3s ease;
            `;
            
            const spinner = loader.querySelector('.loader-spinner');
            spinner.style.cssText = `
                width: 50px;
                height: 50px;
                border: 4px solid #e2e8f0;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            `;
            
            const text = loader.querySelector('.loader-text');
            text.style.cssText = `
                color: #475569;
                font-size: 1rem;
                font-weight: 500;
            `;
        }
        
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }
    
    hideLoading() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    }
    
    showError(message) {
        // Afficher un message d'erreur temporaire
        const errorDiv = document.createElement('div');
        errorDiv.className = 'global-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc2626;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-suppression
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 300);
        }, 5000);
    }
    
    emitNavigationEvent(pageName) {
        const event = new CustomEvent('pageNavigation', {
            detail: {
                page: pageName,
                timestamp: Date.now(),
                userState: this.userState
            }
        });
        document.dispatchEvent(event);
    }
    
    // ================= ÉCOUTEURS STORAGE =================
    
    setupStorageListener() {
        // Synchronisation entre onglets
        window.addEventListener('storage', (e) => {
            if (e.key === 'mathx_session_user' || e.key === 'mathx_favorites') {
                console.log('🔄 Changement storage détecté:', e.key);
                this.loadSession();
                this.updateUI();
            }
        });
    }
    
    setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            this.saveSession();
        });
    }
    
    // ================= API PUBLIQUE =================
    
    getUserState() {
        return { ...this.userState };
    }
    
    isUserAuthenticated() {
        return this.userState?.isAuthenticated === true;
    }
    
    getUserId() {
        return this.userState?.uid || null;
    }
    
    getUserEmail() {
        return this.userState?.email || null;
    }
    
    getCurrentPage() {
        return this.currentPage;
    }
    
    goBack() {
        window.history.back();
    }
    
    goForward() {
        window.history.forward();
    }
}

// Initialiser SessionManager
let sessionManager = null;

function initSessionManager() {
    if (!sessionManager) {
        sessionManager = new SessionManager();
        window.SessionManager = sessionManager;
        console.log('✅ SessionManager initialisé');
    }
    return sessionManager;
}

// Auto-initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initSessionManager, 1000);
    });
} else {
    setTimeout(initSessionManager, 1000);
}

// Exporter
window.initSessionManager = initSessionManager;