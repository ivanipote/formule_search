/**
 * rech.js - Moteur de recherche CORRIGÉ pour mathX_searcher
 * Version simplifiée avec conversion KaTeX basique mais fiable
 */

// ================= CONFIGURATION =================
const CONFIG = {
    DOSSIER_DONNEES: 'resultats/',
    FICHIERS: {
        math: 'math.txt',
        physique: 'physique.txt',
        professionnel: 'professionnel.txt'
    },
    DELAI_RECHERCHE: 300,
    CACHE_DUREE: 5 * 60 * 1000,
    KATEX_ENABLED: true
};

// ================= ÉTATS =================
let cacheDonnees = {
    math: null,
    physique: null,
    professionnel: null,
    timestamp: null
};

let indexInverse = {};
let dernierRecherche = '';
let dernierResultats = [];
let katexInitialise = false;

// ================= CONVERSION KATEX SIMPLE MAIS FIABLE =================

/**
 * Conversion ULTRA-BASIQUE mais fiable pour KaTeX
 * On convertit seulement ce qui est ESSENTIEL
 */
function convertirPourKaTeX(formule) {
    if (!formule || typeof formule !== 'string') return formule;
    
    let resultat = formule;
    
    // 1. PROTÉGER d'abord les formules déjà en LaTeX
    if (resultat.includes('\\frac') || resultat.includes('\\sqrt') || resultat.includes('\\sum')) {
        // La formule est déjà en LaTeX, on laisse intacte
        return resultat;
    }
    
    // 2. Conversions SAFE seulement
    // Fractions spéciales
    resultat = resultat.replace(/½/g, '\\frac{1}{2}');
    resultat = resultat.replace(/¼/g, '\\frac{1}{4}');
    resultat = resultat.replace(/¾/g, '\\frac{3}{4}');
    
    // Carré et cube
    resultat = resultat.replace(/²/g, '^{2}');
    resultat = resultat.replace(/³/g, '^{3}');
    
    // Multiplications
    resultat = resultat.replace(/·/g, '\\cdot ');
    resultat = resultat.replace(/\*/g, '\\cdot ');
    resultat = resultat.replace(/×/g, '\\times ');
    
    // Symboles grecs (uniquement ceux qu'on utilise)
    resultat = resultat.replace(/π/g, '\\pi ');
    resultat = resultat.replace(/α/g, '\\alpha ');
    resultat = resultat.replace(/β/g, '\\beta ');
    resultat = resultat.replace(/γ/g, '\\gamma ');
    resultat = resultat.replace(/Δ/g, '\\Delta ');
    
    // Racines
    resultat = resultat.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}');
    resultat = resultat.replace(/√([a-zA-Z0-9]+)/g, '\\sqrt{$1}');
    
    // Somme et intégrale (basique)
    resultat = resultat.replace(/∑/g, '\\sum ');
    resultat = resultat.replace(/∫/g, '\\int ');
    
    // 3. Nettoyer les espaces en trop
    resultat = resultat.replace(/\s+/g, ' ').trim();
    
    // 4. Éviter les commandes collées
    resultat = resultat.replace(/\\cdot([a-zA-Z])/g, '\\cdot $1');
    resultat = resultat.replace(/\\Delta([a-zA-Z])/g, '\\Delta $1');
    
    return resultat;
}

/**
 * Vérifie si KaTeX peut parser la formule
 */
function testerKaTeX(formule, element) {
    if (!CONFIG.KATEX_ENABLED || !katexInitialise || typeof katex === 'undefined') {
        return false;
    }
    
    try {
        const options = {
            throwOnError: false,
            displayMode: true,
            fleqn: false,
            output: 'html'
        };
        
        katex.render(formule, element, options);
        return true;
    } catch (error) {
        console.warn('❌ KaTeX ne peut pas parser:', formule.substring(0, 50), '...');
        return false;
    }
}

function initialiserKaTeX() {
    if (typeof katex !== 'undefined' && !katexInitialise) {
        katexInitialise = true;
        console.log('✅ KaTeX initialisé (mode simple)');
        return true;
    }
    return false;
}

// ================= FONCTIONS CORE (GARDER SIMPLE) =================

async function chargerFichierFormules(fichier) {
    try {
        const reponse = await fetch(`${CONFIG.DOSSIER_DONNEES}${fichier}`);
        if (!reponse.ok) {
            console.warn(`⚠️ Fichier ${fichier} non trouvé, création vide`);
            return [];
        }
        
        const texte = await reponse.text();
        return parserContenu(texte);
    } catch (erreur) {
        console.error(`❌ Erreur chargement ${fichier}:`, erreur);
        return [];
    }
}

function parserContenu(contenu) {
    const formules = [];
    
    // Découper par //
    const parties = contenu.split('//').filter(p => p.trim().length > 0);
    
    for (let i = 0; i < parties.length - 1; i += 2) {
        const motCle = parties[i].trim();
        const donnees = parties[i + 1].trim();
        
        if (!motCle || !donnees) continue;
        
        const lignes = donnees.split('\n').map(l => l.trim()).filter(l => l);
        
        let titre = '';
        let formule = '';
        let description = '';
        
        for (const ligne of lignes) {
            if (ligne.startsWith('TITRE :')) {
                titre = ligne.substring(7).trim();
            } else if (ligne.startsWith('FORMULE:')) {
                formule = ligne.substring(8).trim();
            } else if (ligne.startsWith('DESCRIPTION :')) {
                description = ligne.substring(13).trim();
            }
        }
        
        if (titre && formule) {
            formules.push({
                id: `${motCle}_${Date.now()}_${i}`,
                motCle: motCle.toLowerCase(),
                titre,
                formule,
                description,
                source: 'math' // Sera remplacé
            });
        }
    }
    
    console.log(`📊 ${formules.length} formules parsées`);
    return formules;
}

async function chargerToutesDonnees() {
    // Vérifier cache
    if (cacheDonnees.timestamp && 
        Date.now() - cacheDonnees.timestamp < CONFIG.CACHE_DUREE &&
        cacheDonnees.math !== null) {
        return cacheDonnees;
    }
    
    console.log('🔄 Chargement des données...');
    
    // Initialiser KaTeX
    if (CONFIG.KATEX_ENABLED) {
        initialiserKaTeX();
    }
    
    try {
        const [math, physique, professionnel] = await Promise.all([
            chargerFichierFormules(CONFIG.FICHIERS.math),
            chargerFichierFormules(CONFIG.FICHIERS.physique),
            chargerFichierFormules(CONFIG.FICHIERS.professionnel)
        ]);
        
        // Ajouter source
        math.forEach(f => f.source = 'math');
        physique.forEach(f => f.source = 'physique');
        professionnel.forEach(f => f.source = 'professionnel');
        
        cacheDonnees = {
            math,
            physique,
            professionnel,
            timestamp: Date.now()
        };
        
        console.log(`✅ Données: ${math.length}M, ${physique.length}P, ${professionnel.length}Pro`);
        
    } catch (error) {
        console.error('❌ Erreur chargement données:', error);
        // Données par défaut pour éviter crash
        cacheDonnees = {
            math: [],
            physique: [],
            professionnel: [],
            timestamp: Date.now()
        };
    }
    
    return cacheDonnees;
}

function rechercherFormules(terme, filtresActifs) {
    if (!terme.trim()) return [];
    
    terme = terme.toLowerCase().trim();
    const resultats = [];
    
    // ORDRE FIXE : Math → Physique → Professionnel
    const ordreCategories = ['math', 'physique', 'professionnel'];
    
    ordreCategories.forEach(categorie => {
        if (!filtresActifs.includes(categorie) || !cacheDonnees[categorie]) return;
        
        cacheDonnees[categorie].forEach(formule => {
            const texteRecherche = `${formule.titre} ${formule.formule} ${formule.description} ${formule.motCle}`.toLowerCase();
            
            if (texteRecherche.includes(terme)) {
                let score = 0;
                
                // Calcul de pertinence simple
                if (formule.titre.toLowerCase().includes(terme)) score += 3;
                if (formule.motCle.includes(terme)) score += 2;
                if (formule.formule.toLowerCase().includes(terme)) score += 1.5;
                if (formule.description.toLowerCase().includes(terme)) score += 1;
                
                // Bonus pour l'ordre des catégories
                score += (10 - ordreCategories.indexOf(categorie)) * 0.01;
                
                resultats.push({
                    ...formule,
                    score,
                    categorieAffichage: getCategorieAffichage(categorie),
                    ordreCategorie: ordreCategories.indexOf(categorie)
                });
            }
        });
    });
    
    // Trier par score
    resultats.sort((a, b) => b.score - a.score);
    
    return resultats;
}

function rechercherIntelligente(terme, filtresActifs) {
    if (terme === dernierRecherche && dernierResultats.length > 0) {
        return dernierResultats;
    }
    
    const resultats = rechercherFormules(terme, filtresActifs);
    dernierRecherche = terme;
    dernierResultats = resultats;
    
    return resultats;
}

function getCategorieAffichage(categorie) {
    const map = {
        math: 'Mathématique',
        physique: 'Physique',
        professionnel: 'Professionnel'
    };
    return map[categorie] || categorie;
}

function formaterResultatsPourHTML(resultats) {
    if (resultats.length === 0) {
        return '<div class="no-results">Aucun résultat trouvé</div>';
    }
    
    return resultats.map(formule => {
        // Essayer KaTeX, sinon afficher texte brut
        const formuleAffichee = CONFIG.KATEX_ENABLED ? convertirPourKaTeX(formule.formule) : formule.formule;
        
        return `
        <div class="result-card" data-id="${formule.id}" data-category="${formule.source}">
            <div class="result-header">
                <h3 class="result-title">${escapeHtml(formule.titre)}</h3>
                <span class="result-category">${formule.categorieAffichage}</span>
            </div>
            
            <div class="result-formula" data-formule="${escapeHtml(formuleAffichee)}">
                ${escapeHtml(formule.formule)}
            </div>
            
            <div class="result-description">
                ${escapeHtml(formule.description)}
            </div>
            
            <div class="result-actions">
                <button class="action-fav" data-id="${formule.id}">
                    <i class="far fa-star"></i>
                </button>
                <button class="action-copy" data-formula="${escapeHtml(formule.formule)}">
                    <i class="far fa-copy"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function appliquerKaTeXAuxResultats() {
    if (!katexInitialise || !CONFIG.KATEX_ENABLED) return;
    
    const elements = document.querySelectorAll('.result-formula');
    elements.forEach(element => {
        const formuleBrute = element.textContent;
        const formuleConvertie = convertirPourKaTeX(formuleBrute);
        
        // Tester si KaTeX peut parser
        const succes = testerKaTeX(formuleConvertie, element);
        
        if (!succes) {
            // Fallback : texte brut avec style
            element.innerHTML = `<span class="formule-fallback">${escapeHtml(formuleBrute)}</span>`;
            element.classList.add('fallback-mode');
        }
    });
}

function prechargerDonnees() {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
            await chargerToutesDonnees();
            console.log('✅ Données préchargées');
        });
    } else {
        setTimeout(async () => {
            await chargerToutesDonnees();
        }, 1000);
    }
}

// ================= INITIALISATION =================

window.RechercheEngine = {
    // Core
    chargerToutesDonnees,
    rechercherIntelligente,
    formaterResultatsPourHTML,
    prechargerDonnees,
    appliquerKaTeXAuxResultats,
    
    // Utilitaires
    getFiltresActifs: () => {
        const actifs = [];
        try {
            const math = document.querySelector('[data-filter="math"] .filter-input');
            const phys = document.querySelector('[data-filter="physique"] .filter-input');
            const prof = document.querySelector('[data-filter="professionnel"] .filter-input');
            
            if (math && math.checked) actifs.push('math');
            if (phys && phys.checked) actifs.push('physique');
            if (prof && prof.checked) actifs.push('professionnel');
        } catch (e) {
            // Fallback
            return ['math', 'physique', 'professionnel'];
        }
        return actifs;
    },
    
    // Debug
    getStats: () => ({
        cache: cacheDonnees.timestamp ? 'actif' : 'inactif',
        categories: {
            math: cacheDonnees.math ? cacheDonnees.math.length : 0,
            physique: cacheDonnees.physique ? cacheDonnees.physique.length : 0,
            professionnel: cacheDonnees.professionnel ? cacheDonnees.professionnel.length : 0
        },
        katex: katexInitialise ? 'prêt' : 'non chargé'
    }),
    
    // Réinitialiser
    reinitialiserHistorique: () => {
        dernierRecherche = '';
        dernierResultats = [];
    }
};

// Auto-start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 rech.js - Version simplifiée chargée');
        prechargerDonnees();
        
        // Vérifier KaTeX
        setTimeout(() => {
            if (typeof katex === 'undefined') {
                console.warn('⚠️ KaTeX non détecté, chargement...');
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
                script.onload = () => {
                    initialiserKaTeX();
                    console.log('✅ KaTeX chargé dynamiquement');
                };
                document.head.appendChild(script);
            } else {
                initialiserKaTeX();
            }
        }, 500);
    });
} else {
    console.log('🚀 rech.js - Version simplifiée chargée');
    prechargerDonnees();
}
// Ajouter cette fonction utilitaire
function formaterFormuleLongue(formule) {
    if (!formule || formule.length < 50) return formule;
    
    // Pour les formules très longues, ajouter des espaces stratégiques
    let resultat = formule;
    
    // Remplacer certains opérateurs par des versions avec espace
    resultat = resultat.replace(/=/g, ' = ');
    resultat = resultat.replace(/\+/g, ' + ');
    resultat = resultat.replace(/-/g, ' - ');
    resultat = resultat.replace(/\//g, ' / ');
    
    // Enlever les doubles espaces
    resultat = resultat.replace(/\s+/g, ' ');
    
    return resultat;
}

// Modifier formaterResultatsPourHTML
function formaterResultatsPourHTML(resultats) {
    if (resultats.length === 0) {
        return '<div class="no-results">Aucun résultat trouvé</div>';
    }
    
    return resultats.map(formule => {
        const formuleAffichee = CONFIG.KATEX_ENABLED ? 
            convertirPourKaTeX(formule.formule) : 
            formaterFormuleLongue(formule.formule);
        
        return `
        <div class="result-card" data-id="${formule.id}" data-category="${formule.source}">
            <div class="result-header">
                <h3 class="result-title">${escapeHtml(formule.titre)}</h3>
                <span class="result-category">${formule.categorieAffichage}</span>
            </div>
            
            <div class="result-formula" data-formule="${escapeHtml(formuleAffichee)}">
                ${escapeHtml(formule.formule)}
            </div>
            
            <div class="result-description">
                ${escapeHtml(formule.description)}
            </div>
            
            <div class="result-actions">
                <button class="action-fav" data-id="${formule.id}">
                    <i class="far fa-star"></i>
                </button>
                <button class="action-copy" data-formula="${escapeHtml(formule.formule)}">
                    <i class="far fa-copy"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
}
