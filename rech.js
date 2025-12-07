/**
 * rech.js - Moteur de recherche LOGIQUE pour mathX_searcher
 * Version simplifiée sans dépendance KaTeX
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
    CACHE_DUREE: 5 * 60 * 1000
};

// ================= ÉTATS =================
let cacheDonnees = {
    math: null,
    physique: null,
    professionnel: null,
    timestamp: null
};

let dernierRecherche = '';
let dernierResultats = [];

// ================= FONCTIONS D'AIDE =================

/**
 * Échapper le HTML pour éviter les injections
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Appliquer la surbrillance sur les termes recherchés
 */
function appliquerSurbrillance(texte, termes) {
    if (!termes || !texte || termes.trim() === '') {
        return escapeHtml(texte);
    }
    
    const texteEchappe = escapeHtml(texte);
    const termesArray = termes.toLowerCase().split(' ').filter(t => t.length > 1);
    
    if (termesArray.length === 0) {
        return texteEchappe;
    }
    
    let resultat = texteEchappe;
    
    // Surligner chaque terme
    termesArray.forEach(terme => {
        if (terme.length < 2) return;
        
        try {
            const termeEchappe = terme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${termeEchappe})`, 'gi');
            
            resultat = resultat.replace(regex, (match) => {
                return `<span class="highlight-term">${match}</span>`;
            });
        } catch (e) {
            console.warn('Erreur surbrillance pour terme:', terme, e);
        }
    });
    
    return resultat;
}

/**
 * Formater les formules longues pour un meilleur affichage
 */
function formaterFormuleLongue(formule) {
    if (!formule || formule.length < 50) return formule;
    
    let resultat = formule;
    
    // Ajouter des espaces autour des opérateurs
    resultat = resultat.replace(/=/g, ' = ');
    resultat = resultat.replace(/\+/g, ' + ');
    resultat = resultat.replace(/-/g, ' - ');
    resultat = resultat.replace(/\//g, ' / ');
    resultat = resultat.replace(/\*/g, ' × ');
    resultat = resultat.replace(/</g, ' < ');
    resultat = resultat.replace(/>/g, ' > ');
    resultat = resultat.replace(/≤/g, ' ≤ ');
    resultat = resultat.replace(/≥/g, ' ≥ ');
    
    resultat = resultat.replace(/\s+/g, ' ');
    
    return resultat.trim();
}

// ================= FONCTIONS CORE =================

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
                source: 'math'
            });
        }
    }
    
    console.log(`📊 ${formules.length} formules parsées`);
    return formules;
}

async function chargerToutesDonnees() {
    if (cacheDonnees.timestamp && 
        Date.now() - cacheDonnees.timestamp < CONFIG.CACHE_DUREE &&
        cacheDonnees.math !== null) {
        return cacheDonnees;
    }
    
    console.log('🔄 Chargement des données...');
    
    try {
        const [math, physique, professionnel] = await Promise.all([
            chargerFichierFormules(CONFIG.FICHIERS.math),
            chargerFichierFormules(CONFIG.FICHIERS.physique),
            chargerFichierFormules(CONFIG.FICHIERS.professionnel)
        ]);
        
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
    
    const ordreCategories = ['math', 'physique', 'professionnel'];
    
    ordreCategories.forEach(categorie => {
        if (!filtresActifs.includes(categorie) || !cacheDonnees[categorie]) return;
        
        cacheDonnees[categorie].forEach(formule => {
            const texteRecherche = `${formule.titre} ${formule.formule} ${formule.description} ${formule.motCle}`.toLowerCase();
            
            if (texteRecherche.includes(terme)) {
                let score = 0;
                
                if (formule.titre.toLowerCase().includes(terme)) score += 3;
                if (formule.motCle.includes(terme)) score += 2;
                if (formule.formule.toLowerCase().includes(terme)) score += 1.5;
                if (formule.description.toLowerCase().includes(terme)) score += 1;
                
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

/**
 * Formater les résultats pour HTML avec surbrillance
 * DÉLÈGUE le formatage des formules à KatexManager
 */
function formaterResultatsPourHTML(resultats, termeRecherche = '') {
    if (resultats.length === 0) {
        return '<div class="no-results">Aucun résultat trouvé</div>';
    }
    
    return resultats.map(formule => {
        // Appliquer la surbrillance
        const titreAvecSurbrillance = termeRecherche ? 
            appliquerSurbrillance(formule.titre, termeRecherche) : 
            escapeHtml(formule.titre);
        
        const descriptionAvecSurbrillance = termeRecherche ? 
            appliquerSurbrillance(formule.description, termeRecherche) : 
            escapeHtml(formule.description);
        
        // La formule sera traitée par KatexManager après
        const formuleBrute = escapeHtml(formule.formule);
        
        return `
        <div class="result-card" data-id="${formule.id}" data-category="${formule.source}">
            <div class="result-header">
                <h3 class="result-title">${titreAvecSurbrillance}</h3>
                <span class="result-category">${formule.categorieAffichage}</span>
            </div>
            
            <div class="result-formula" data-formule-raw="${escapeHtml(formule.formule)}">
                ${formuleBrute}
            </div>
            
            <div class="result-description">
                ${descriptionAvecSurbrillance}
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
    
    // Fonctions d'aide
    appliquerSurbrillance,
    formaterFormuleLongue,
    escapeHtml,
    
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
        }
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
        console.log('🚀 rech.js - Moteur de recherche logique chargé');
        prechargerDonnees();
    });
} else {
    console.log('🚀 rech.js - Moteur de recherche logique chargé');
    prechargerDonnees();
}