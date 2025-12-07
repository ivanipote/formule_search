/**
 * filtre.js - Gestion des filtres pour mathX_searcher
 * Avec réinitialisation propre pour éviter les inversions
 */

const FILTRES_CONFIG = {
    DEBOUNCE_DELAY: 150,
    ETAT_INITIAL: ['math', 'physique', 'professionnel']
};

let filtresActifs = new Set(FILTRES_CONFIG.ETAT_INITIAL);
let rechercheEnCours = false;
let timeoutRecherche = null;
let derniersFiltres = null; // Pour détecter les changements

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
    
    // Reset de l'historique quand on efface la recherche
    elements.searchInput.addEventListener('input', function() {
        if (this.value.trim() === '') {
            window.RechercheEngine && window.RechercheEngine.reinitialiserHistorique();
        }
    });
}

/**
 * Réinitialise l'affichage des résultats
 */
function reinitialiserAffichage() {
    if (!elements.resultsContainer) return;
    
    // Animation de fade out
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
    
    // Sauvegarder l'état précédent pour comparaison
    const anciensFiltres = new Set(filtresActifs);
    
    if (estActive) {
        filtresActifs.add(filtre);
    } else {
        filtresActifs.delete(filtre);
    }
    
    // Vérifier qu'au moins un filtre est actif
    if (filtresActifs.size === 0) {
        this.checked = true;
        filtresActifs.add(filtre);
        afficherMessageFiltres();
        return;
    }
    
    console.log(`🔧 Filtre ${filtre}: ${estActive ? 'activé' : 'désactivé'}`);
    console.log(`📊 Nouveaux filtres: ${Array.from(filtresActifs).join(', ')}`);
    
    // Réinitialiser l'affichage si les filtres ont changé
    if (!setsEgaux(anciensFiltres, filtresActifs)) {
        reinitialiserAffichage();
        
        // Forcer une nouvelle recherche (pas de cache)
        if (window.RechercheEngine) {
            window.RechercheEngine.reinitialiserHistorique();
        }
    }
    
    if (elements.searchInput.value.trim().length > 0) {
        debouncerRecherche();
    }
}

/**
 * Compare deux sets pour égalité
 */
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
        
        // Trier les filtres dans l'ordre fixe
        filtresArray.sort((a, b) => {
            const ordre = ['math', 'physique', 'professionnel'];
            return ordre.indexOf(a) - ordre.indexOf(b);
        });
        
        console.log(`🔍 Recherche: "${terme}" | Filtres: [${filtresArray.join(', ')}]`);
        
        const resultats = window.RechercheEngine.rechercherIntelligente(terme, filtresArray);
        
        // Petit délai pour l'animation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        afficherResultats(resultats, terme);
        
        // Appliquer KaTeX après affichage
        setTimeout(() => {
            if (window.RechercheEngine && window.RechercheEngine.appliquerKaTeXAuxResultats) {
                window.RechercheEngine.appliquerKaTeXAuxResultats();
            }
        }, 50);
        
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
        const htmlResultats = window.RechercheEngine.formaterResultatsPourHTML(resultats);
        elements.resultsContainer.innerHTML = htmlResultats;
        
        // Log pour déboguer l'ordre
        console.log(`📊 ${resultats.length} résultats affichés dans l'ordre:`);
        resultats.forEach((r, i) => {
            console.log(`  ${i+1}. [${r.categorieAffichage}] ${r.titre}`);
        });
        
        initialiserActionsResultats();
        
        // Animation d'apparition ordonnée
        const cards = elements.resultsContainer.querySelectorAll('.result-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 30); // Délai plus court pour fluidité
        });
    }
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
    document.querySelectorAll('.action-fav').forEach(bouton => {
        bouton.addEventListener('click', function() {
            const id = this.dataset.id;
            toggleFavori(id, this);
        });
    });
    
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
    } else {
        icone.classList.remove('fas');
        icone.classList.add('far');
        bouton.style.color = '';
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

function initialiserFiltres() {
    console.log('🔧 Initialisation filtres...');
    
    if (!initialiserElements()) {
        console.error('❌ Impossible d\'initialiser les filtres');
        return;
    }
    
    initialiserEcouteurs();
    
    // Appliquer l'état initial
    elements.filterInputs.forEach(input => {
        const filtre = input.closest('.filter-checkbox').dataset.filter;
        if (!filtresActifs.has(filtre)) {
            input.checked = false;
        }
    });
    
    console.log('✅ Filtres initialisés - Ordre fixe activé');
}

window.FiltreManager = {
    initialiserFiltres,
    getFiltresActifs,
    forcerRecherche,
    lancerRecherche: lancerRechercheImmediate,
    reinitialiserAffichage
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiserFiltres);
} else {
    initialiserFiltres();
}
// Ajouter cette fonction à filtre.js
function initialiserScrollFormules() {
    const formules = document.querySelectorAll('.result-formula');
    
    formules.forEach(formule => {
        // Vérifier si le contenu dépasse
        const contentWidth = formule.scrollWidth;
        const containerWidth = formule.clientWidth;
        
        if (contentWidth > containerWidth) {
            formule.classList.add('scrollable');
            
            // Ajouter un indicateur visuel
            const hint = document.createElement('span');
            hint.className = 'scroll-hint';
            hint.innerHTML = '⇄';
            formule.appendChild(hint);
            
            // Détecter quand l'utilisateur scroll
            formule.addEventListener('scroll', function() {
                this.classList.add('scrolled');
                const hint = this.querySelector('.scroll-hint');
                if (hint) hint.style.display = 'none';
            });
            
            // Swipe sur mobile
            let startX = 0;
            let scrollLeft = 0;
            
            formule.addEventListener('touchstart', function(e) {
                startX = e.touches[0].pageX;
                scrollLeft = this.scrollLeft;
            });
            
            formule.addEventListener('touchmove', function(e) {
                const x = e.touches[0].pageX;
                const walk = (x - startX) * 2;
                this.scrollLeft = scrollLeft - walk;
                e.preventDefault();
            });
        }
        
        // Sur mobile très petit, activer le wrap
        if (window.innerWidth < 480 && contentWidth > containerWidth * 1.5) {
            formule.classList.add('mobile-wrap');
        }
    });
}

// Appeler cette fonction après affichage des résultats
function afficherResultats(resultats, termeRecherche) {
    // ... code existant ...
    
    if (elements.resultsContainer && window.RechercheEngine) {
        const htmlResultats = window.RechercheEngine.formaterResultatsPourHTML(resultats);
        elements.resultsContainer.innerHTML = htmlResultats;
        
        initialiserActionsResultats();
        
        // Animation d'apparition
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
        
        // Initialiser le scroll après un petit délai
        setTimeout(() => {
            initialiserScrollFormules();
        }, 100);
    }
}