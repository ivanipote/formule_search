/**
 * spa-manager.js - Gestionnaire SPA OPTIONNEL
 * Si on est sur index.html, active le SPA. Sinon, rien.
 */

class SPAManager {
    constructor() {
        // Vérifier si on est sur la page index.html
        const currentPage = window.location.pathname.split('/').pop();
        this.isIndexPage = currentPage === 'index.html';
        
        if (!this.isIndexPage) {
            console.log('📄 Page non-index, SPA désactivé');
            return;
        }
        
        console.log('🚀 Activation SPA sur index.html');
        this.currentPage = 'index.html';
        this.pageStates = new Map();
        this.init();
    }
    
    init() {
        if (!this.isIndexPage) return;
        
        // Remplacer les liens par des boutons pour SPA
        this.convertLinksToSPA();
        
        // Configurer la navigation
        this.setupSPANavigation();
        
        // Sauvegarder l'état périodiquement
        setInterval(() => this.saveCurrentState(), 30000);
        
        // Sauvegarder l'état au départ
        setTimeout(() => this.saveCurrentState(), 1000);
    }
    
    convertLinksToSPA() {
        // Navigation bas : remplacer les liens par des boutons
        const navTabs = document.querySelectorAll('.bottom-nav .nav-tab');
        navTabs.forEach(tab => {
            if (tab.tagName === 'A') {
                const button = document.createElement('button');
                button.className = tab.className;
                button.innerHTML = tab.innerHTML;
                button.dataset.page = tab.getAttribute('href');
                
                // Copier les data-attributes
                Array.from(tab.attributes).forEach(attr => {
                    if (attr.name.startsWith('data-')) {
                        button.setAttribute(attr.name, attr.value);
                    }
                });
                
                tab.parentNode.replaceChild(button, tab);
            }
        });
        
        // Sidebar : remplacer les liens par des boutons
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        sidebarLinks.forEach(link => {
            if (link.tagName === 'A') {
                const button = document.createElement('button');
                button.className = link.className;
                button.innerHTML = link.innerHTML;
                button.dataset.page = link.getAttribute('href');
                
                Array.from(link.attributes).forEach(attr => {
                    if (attr.name.startsWith('data-')) {
                        button.setAttribute(attr.name, attr.value);
                    }
                });
                
                link.parentNode.replaceChild(button, link);
            }
        });
    }
    
    setupSPANavigation() {
        // Navigation bas SPA
        document.querySelectorAll('.nav-tab[data-page]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const page = tab.dataset.page;
                if (page && page !== this.currentPage) {
                    this.navigateTo(page, tab);
                }
            });
        });
        
        // Sidebar SPA
        document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page && page !== this.currentPage) {
                    this.navigateTo(page);
                    // Fermer sidebar
                    document.getElementById('sidebar')?.classList.remove('active');
                    document.getElementById('overlay')?.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
        
        // Intercepter les clics sur les liens internes
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href$=".html"]');
            if (link && link.href) {
                const url = new URL(link.href);
                const page = url.pathname.split('/').pop();
                
                // Vérifier si c'est un lien interne (même domaine)
                if (url.hostname === window.location.hostname && 
                    page && page !== this.currentPage) {
                    e.preventDefault();
                    this.navigateTo(page);
                }
            }
        });
    }
    
    async navigateTo(page, clickedElement = null) {
        console.log(`🧭 SPA navigation vers: ${page}`);
        
        // Sauvegarder l'état actuel
        this.saveCurrentState();
        
        // Mettre à jour l'UI
        this.updateActiveTab(page, clickedElement);
        
        // Afficher loader
        this.showLoader();
        
        try {
            // Charger la nouvelle page
            const response = await fetch(page);
            const html = await response.text();
            
            // Extraire juste le contenu principal
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newMain = doc.querySelector('main');
            const newTitle = doc.querySelector('title')?.textContent;
            
            if (!newMain) {
                throw new Error('Pas de contenu principal');
            }
            
            // Mettre à jour le titre
            if (newTitle) {
                document.title = newTitle;
            }
            
            // Mettre à jour le contenu
            const currentMain = document.querySelector('main');
            if (currentMain) {
                currentMain.innerHTML = newMain.innerHTML;
            }
            
            // Mettre à jour la page courante
            this.currentPage = page;
            
            // Restaurer l'état de la nouvelle page
            this.restorePageState(page);
            
            // Défilement vers le haut
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Mettre à jour l'URL sans rechargement
            window.history.pushState({ page: page }, '', page);
            
            console.log(`✅ SPA: ${page} chargée`);
            
        } catch (error) {
            console.error(`❌ Erreur SPA ${page}:`, error);
            // Fallback: navigation normale
            window.location.href = page;
            return;
        } finally {
            this.hideLoader();
        }
    }
    
    saveCurrentState() {
        const state = {
            scrollY: window.scrollY,
            timestamp: Date.now()
        };
        
        // État spécifique à index.html
        if (this.currentPage === 'index.html') {
            state.search = document.getElementById('mainSearchInput')?.value || '';
            state.filters = this.getFiltersState();
        }
        
        // Sauvegarder
        localStorage.setItem(`mathx_spa_state_${this.currentPage}`, JSON.stringify(state));
    }
    
    restorePageState(page) {
        const savedState = localStorage.getItem(`mathx_spa_state_${page}`);
        if (!savedState) return;
        
        try {
            const state = JSON.parse(savedState);
            
            // Restaurer le scroll
            if (state.scrollY > 0) {
                setTimeout(() => {
                    window.scrollTo({ top: state.scrollY, behavior: 'auto' });
                }, 100);
            }
            
            // Restaurer l'état spécifique
            if (page === 'index.html' && state.search) {
                const searchInput = document.getElementById('mainSearchInput');
                if (searchInput) {
                    searchInput.value = state.search;
                    // Déclencher la recherche si non vide
                    if (state.search.trim() && window.RechercheEngine?.rechercher) {
                        setTimeout(() => {
                            window.RechercheEngine.rechercher(state.search);
                        }, 300);
                    }
                }
                
                // Restaurer les filtres
                if (state.filters) {
                    Object.entries(state.filters).forEach(([filterName, isChecked]) => {
                        const input = document.querySelector(`[data-filter="${filterName}"] input`);
                        if (input) {
                            input.checked = isChecked;
                        }
                    });
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Erreur restauration état SPA:', error);
        }
    }
    
    getFiltersState() {
        const filters = {};
        document.querySelectorAll('.filter-input').forEach(input => {
            const filterName = input.closest('.filter-checkbox')?.dataset.filter;
            if (filterName) {
                filters[filterName] = input.checked;
            }
        });
        return filters;
    }
    
    updateActiveTab(page, clickedElement = null) {
        // Mettre à jour les onglets actifs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            const tabPage = tab.dataset.page;
            if (tabPage === page) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Mettre à jour les liens sidebar
        document.querySelectorAll('.sidebar-link').forEach(link => {
            const linkPage = link.dataset.page;
            if (linkPage === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Feedback visuel
        if (clickedElement) {
            clickedElement.style.transform = 'scale(0.95)';
            setTimeout(() => {
                clickedElement.style.transform = 'scale(1)';
            }, 150);
        }
    }
    
    showLoader() {
        let loader = document.getElementById('spa-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'spa-loader';
            loader.innerHTML = '<div class="spinner"></div>';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(5px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            
            const spinner = loader.querySelector('.spinner');
            spinner.style.cssText = `
                width: 40px;
                height: 40px;
                border: 3px solid #e2e8f0;
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            `;
            
            document.body.appendChild(loader);
        }
        
        loader.style.display = 'flex';
        setTimeout(() => loader.style.opacity = '1', 10);
    }
    
    hideLoader() {
        const loader = document.getElementById('spa-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    }
}

// Initialiser UNIQUEMENT sur index.html
let spaManager = null;

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html') {
        spaManager = new SPAManager();
        window.SPAManager = spaManager;
        console.log('✅ SPA Manager activé sur index.html');
    }
});