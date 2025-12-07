/**
 * filtre.js - Gestion filtres avec surbrillance
 */

const FILTRES_CONFIG = {
    DEBOUNCE_DELAY: 150,
    ETAT_INITIAL: ['math', 'physique', 'professionnel']
};

let filtresActifs = new Set(FILTRES_CONFIG.ETAT_INITIAL);
let rechercheEnCours = false;
let timeoutRecherche = null;

let elements = {
    filterInputs: null,
    searchInput: null,
    resultsContainer: null,
    welcomeState: null,
    noResultsState: null,
    searchingState: null
};

function initialiserElements() {
    elements.filterInputs = document.querySelectorAll('.filter-input');
    elements.searchInput = document.getElementById('mainSearchInput');
    elements.resultsContainer = document.getElementById('resultsContainer');
    elements.welcomeState = document.getElementById('welcomeState');
    elements.noResultsState = document.getElementById('noResultsState');
    elements.searchingState = document.getElementById('searchingState');
    
    return !!(elements.searchInput && elements.resultsContainer);
}

function initialiserEcouteurs() {
    elements.filterInputs.forEach(input => {
        input.addEventListener('change', gererChangementFiltre);
        input.addEventListener('click', function() {
            const checkbox = this.nextElementSibling;
            if (checkbox) {
                checkbox.style.transform = 'scale(1.15)';
                setTimeout(() => checkbox.style.transform = 'scale(1)', 150);
            }
        });
    });
    
    elements.searchInput.addEventListener('input', gererRecherche);
    elements.searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') lancerRechercheImmediate();
    });
    
    elements.searchInput.addEventListener('input', function() {
        if (this.value.trim() === '') {
            window.RechercheEngine && window.RechercheEngine.reinitialiserHistorique();
        }
    });
}

function reinitialiserAffichage() {
    if (!elements.resultsContainer) return;
    elements.resultsContainer.style.opacity = '0.5';
    elements.resultsContainer.style.transition = 'opacity 0.2s ease';
    setTimeout(() => {
        if (elements.resultsContainer) {
            elements.resultsContainer.style.opacity = '1';
        }
    }, 100);
}

function gererChangementFiltre() {
    const filtre = this.closest('.filter-checkbox').dataset.filter;
    const estActive = this.checked;
    const anciensFiltres = new Set(filtresActifs);
    
    if (estActive) {
        filtresActifs.add(filtre);
    } else {
        filtresActifs.delete(filtre);
    }
    
    if (filtresActifs.size === 0) {
        this.checked = true;
        filtresActifs.add(filtre);
        afficherMessageFiltres();
        return;
    }
    
    console.log(`🔧 Filtre ${filtre}: ${estActive ? 'activé' : 'désactivé'}`);
    
    if (!setsEgaux(anciensFiltres, filtresActifs)) {
        reinitialiserAffichage();
        if (window.RechercheEngine) {
            window.RechercheEngine.reinitialiserHistorique();
        }
    }
    
    if (elements.searchInput.value.trim().length > 0) {
        debouncerRecherche();
    }
}

function setsEgaux(setA, setB) {
    if (setA.size !== setB.size) return false;
    for (const item of setA) {
        if (!setB.has(item)) return false;
    }
    return true;
}

function afficherMessageFiltres() {
    const message = document.createElement('div');
    message.className = 'filter-message';
    message.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>Au moins un filtre doit être sélectionné</span>`;
    
    const ancienMessage = document.querySelector('.filter-message');
    if (ancienMessage) ancienMessage.remove();
    
    const filtersBar = document.querySelector('.filters-bar');
    filtersBar.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) message.remove();
    }, 3000);
}

function gererRecherche() {
    const terme = this.value.trim();
    if (terme.length === 0) {
        montrerEtatAccueil();
        return;
    }
    debouncerRecherche();
}

function debouncerRecherche() {
    clearTimeout(timeoutRecherche);
    timeoutRecherche = setTimeout(() => {
        lancerRecherche();
    }, FILTRES_CONFIG.DEBOUNCE_DELAY);
}

function lancerRechercheImmediate() {
    clearTimeout(timeoutRecherche);
    lancerRecherche();
}

async function lancerRecherche() {
    const terme = elements.searchInput.value.trim();
    if (terme.length === 0) {
        montrerEtatAccueil();
        return;
    }
    
    if (!window.RechercheEngine) {
        console.error('❌ Moteur de recherche non disponible');
        return;
    }
    
    montrerRechercheEnCours();
    rechercheEnCours = true;
    
    try {
        const filtresArray = Array.from(filtresActifs);
        filtresArray.sort((a, b) => {
            const ordre = ['math', 'physique', 'professionnel'];
            return ordre.indexOf(a) - ordre.indexOf(b);
        });
        
        console.log(`🔍 Recherche: "${terme}" | Filtres: [${filtresArray.join(', ')}]`);
        
        const resultats = window.RechercheEngine.rechercherIntelligente(terme, filtresArray);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        afficherResultats(resultats, terme);
        
    } catch (erreur) {
        console.error('❌ Erreur recherche:', erreur);
        afficherErreurRecherche();
    } finally {
        rechercheEnCours = false;
    }
}

function montrerEtatAccueil() {
    if (elements.welcomeState) elements.welcomeState.style.display = 'block';
    if (elements.resultsContainer) elements.resultsContainer.innerHTML = '';
    if (elements.noResultsState) elements.noResultsState.style.display = 'none';
    if (elements.searchingState) elements.searchingState.style.display = 'none';
}

function montrerRechercheEnCours() {
    if (elements.welcomeState) elements.welcomeState.style.display = 'none';
    if (elements.noResultsState) elements.noResultsState.style.display = 'none';
    if (elements.searchingState) elements.searchingState.style.display = 'flex';
}

function afficherResultats(resultats, termeRecherche) {
    if (elements.searchingState) elements.searchingState.style.display = 'none';
    if (elements.welcomeState) elements.welcomeState.style.display = 'none';
    
    if (resultats.length === 0) {
        if (elements.noResultsState) {
            elements.noResultsState.style.display = 'block';
            const message = elements.noResultsState.querySelector('p');
            if (message) {
                message.textContent = `Aucun résultat pour "${termeRecherche}". Essayez avec d'autres termes.`;
            }
        }
        if (elements.resultsContainer) {
            elements.resultsContainer.innerHTML = '';
        }
        return;
    }
    
    if (elements.noResultsState) elements.noResultsState.style.display = 'none';
    
    if (elements.resultsContainer && window.RechercheEngine) {
        // 1. Obtenir le HTML des résultats avec surbrillance
        const htmlResultats = window.RechercheEngine.formaterResultatsPourHTML(resultats, termeRecherche);
        elements.resultsContainer.innerHTML = htmlResultats;
        
        console.log(`🔦 Surbrillance activée pour: "${termeRecherche}"`);
        console.log(`📊 ${resultats.length} résultat(s) trouvé(s)`);
        
        // 2. Initialiser les actions (favoris, copie)
        initialiserActionsResultats();
        
        // 3. Animation d'apparition des cartes
        const cards = elements.resultsContainer.querySelectorAll('.result-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 30);
        });
        
        // 4. APPLIQUER KaTeX après un court délai (permettre le rendu DOM)
        setTimeout(() => {
            traiterRenduFormules();
        }, 50);
    }
}

function traiterRenduFormules() {
    // Vérifier si KatexManager est disponible
    if (window.KatexManager) {
        const katexDisponible = window.KatexManager.estDisponible();
        
        if (katexDisponible && window.KatexManager.estInitialise()) {
            console.log('🎨 Application de KaTeX aux formules...');
            window.KatexManager.appliquerKaTeXAuxResultats();
        } else {
            console.log('🎨 KaTeX non disponible, utilisation du fallback Unicode');
            if (window.KatexManager.appliquerFallbackUnicode) {
                window.KatexManager.appliquerFallbackUnicode();
            }
        }
        
        // Initialiser le scroll horizontal pour les formules longues
        if (window.KatexManager.initialiserScrollFormules) {
            window.KatexManager.initialiserScrollFormules();
        }
    } else {
        console.warn('⚠️ KatexManager non trouvé, formules affichées en brut');
        // Fallback: initialiser manuellement le scroll si besoin
        initialiserScrollFormulesFallback();
    }
}

function initialiserScrollFormulesFallback() {
    const formules = document.querySelectorAll('.result-formula');
    
    formules.forEach(formule => {
        const contentWidth = formule.scrollWidth;
        const containerWidth = formule.clientWidth;
        
        if (contentWidth > containerWidth) {
            formule.classList.add('scrollable');
            
            const hint = document.createElement('span');
            hint.className = 'scroll-hint';
            hint.innerHTML = '⇄';
            formule.appendChild(hint);
            
            formule.addEventListener('scroll', function() {
                this.classList.add('scrolled');
                const hint = this.querySelector('.scroll-hint');
                if (hint) hint.style.display = 'none';
            });
        }
        
        if (window.innerWidth < 480 && contentWidth > containerWidth * 1.5) {
            formule.classList.add('mobile-wrap');
        }
    });
}

function afficherErreurRecherche() {
    if (elements.resultsContainer) {
        elements.resultsContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Erreur de recherche</h3>
                <p>Une erreur s'est produite lors de la recherche.</p>
                <button onclick="location.reload()" class="retry-button">
                    <i class="fas fa-redo"></i> Réessayer
                </button>
            </div>
        `;
    }
    
    if (elements.searchingState) elements.searchingState.style.display = 'none';
    if (elements.noResultsState) elements.noResultsState.style.display = 'none';
}

function initialiserActionsResultats() {
    // Boutons favoris
    document.querySelectorAll('.action-fav').forEach(bouton => {
        bouton.addEventListener('click', function() {
            const id = this.dataset.id;
            toggleFavori(id, this);
        });
    });
    
    // Boutons copie
    document.querySelectorAll('.action-copy').forEach(bouton => {
        bouton.addEventListener('click', function() {
            const formule = this.dataset.formula;
            copierFormule(formule, this);
        });
    });
}

function toggleFavori(id, bouton) {
    const icone = bouton.querySelector('i');
    if (icone.classList.contains('far')) {
        icone.classList.remove('far');
        icone.classList.add('fas');
        bouton.style.color = '#f59e0b';
        console.log(`⭐ Ajouté aux favoris: ${id}`);
    } else {
        icone.classList.remove('fas');
        icone.classList.add('far');
        bouton.style.color = '';
        console.log(`☆ Retiré des favoris: ${id}`);
    }
    
    bouton.style.transform = 'scale(1.2)';
    setTimeout(() => bouton.style.transform = 'scale(1)', 200);
}

async function copierFormule(formule, bouton) {
    try {
        await navigator.clipboard.writeText(formule);
        
        const originalHTML = bouton.innerHTML;
        bouton.innerHTML = '<i class="fas fa-check"></i>';
        bouton.style.color = '#10b981';
        
        console.log('📋 Formule copiée:', formule.substring(0, 50) + '...');
        
        setTimeout(() => {
            bouton.innerHTML = originalHTML;
            bouton.style.color = '';
        }, 1500);
        
    } catch (err) {
        console.error('❌ Erreur copie:', err);
    }
}

function getFiltresActifs() {
    return Array.from(filtresActifs);
}

function forcerRecherche() {
    if (elements.searchInput.value.trim().length > 0) {
        lancerRechercheImmediate();
    }
}

function rafraichirAffichage() {
    if (elements.searchInput.value.trim().length > 0) {
        // Réappliquer KaTeX aux résultats existants
        if (window.KatexManager) {
            if (window.KatexManager.estDisponible()) {
                window.KatexManager.appliquerKaTeXAuxResultats();
            } else if (window.KatexManager.appliquerFallbackUnicode) {
                window.KatexManager.appliquerFallbackUnicode();
            }
            
            if (window.KatexManager.initialiserScrollFormules) {
                window.KatexManager.initialiserScrollFormules();
            }
        }
    }
}

function initialiserFiltres() {
    console.log('🔧 Initialisation du gestionnaire de filtres...');
    
    if (!initialiserElements()) {
        console.error('❌ Impossible d\'initialiser les éléments DOM');
        setTimeout(initialiserFiltres, 100);
        return;
    }
    
    initialiserEcouteurs();
    
    // S'assurer que tous les filtres par défaut sont cochés
    elements.filterInputs.forEach(input => {
        const filtre = input.closest('.filter-checkbox').dataset.filter;
        if (filtresActifs.has(filtre)) {
            input.checked = true;
        }
    });
    
    console.log('✅ Filtres initialisés');
    console.log('📚 Dépendances disponibles:');
    console.log('   - RechercheEngine:', window.RechercheEngine ? '✅' : '❌');
    console.log('   - KatexManager:', window.KatexManager ? '✅' : '❌');
    
    // Vérifier si KatexManager est disponible, sinon l'initialiser
    if (!window.KatexManager && typeof KatexManager === 'undefined') {
        console.log('🔄 Tentative d\'initialisation de KaTeX...');
        // On laisse katex.js s'initialiser automatiquement
    }
}

window.FiltreManager = {
    initialiserFiltres,
    getFiltresActifs,
    forcerRecherche,
    lancerRecherche: lancerRechercheImmediate,
    reinitialiserAffichage,
    rafraichirAffichage,
    
    // Utilitaires
    afficherMessageFiltres,
    afficherResultats,
    
    // Debug
    getEtat: () => ({
        filtresActifs: Array.from(filtresActifs),
        rechercheEnCours,
        elementsInitialises: !!elements.searchInput
    })
};

// Initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiserFiltres);
} else {
    initialiserFiltres();
}