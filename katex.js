/**
 * katex.js - Gestionnaire KaTeX pour mathX_searcher
 * S'occupe exclusivement du formatage et rendu des formules
 */

const KATEX_CONFIG = {
    ENABLED: true,
    VERSION: '0.16.9',
    CDN_URL: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
    CSS_URL: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
    OPTIONS: {
        throwOnError: false,
        displayMode: true,
        fleqn: false,
        output: 'html'
    }
};

let katexInitialise = false;
let katexDisponible = false;

// ================= INITIALISATION KATEX =================

function initialiserKaTeX() {
    return new Promise((resolve) => {
        if (typeof katex !== 'undefined') {
            katexInitialise = true;
            katexDisponible = true;
            console.log('✅ KaTeX déjà chargé');
            resolve(true);
            return;
        }
        
        if (!KATEX_CONFIG.ENABLED) {
            console.log('⚠️ KaTeX désactivé dans la configuration');
            resolve(false);
            return;
        }
        
        console.log('🔄 Chargement de KaTeX...');
        
        // Charger le CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = KATEX_CONFIG.CSS_URL;
        document.head.appendChild(link);
        
        // Charger le script
        const script = document.createElement('script');
        script.src = KATEX_CONFIG.CDN_URL;
        
        script.onload = () => {
            katexInitialise = true;
            katexDisponible = true;
            console.log('✅ KaTeX chargé avec succès');
            resolve(true);
        };
        
        script.onerror = () => {
            console.error('❌ Échec du chargement de KaTeX');
            katexDisponible = false;
            resolve(false);
        };
        
        document.head.appendChild(script);
    });
}

// ================= CONVERSION FORMULES =================

/**
 * Conversion complète pour KaTeX avec fallback Unicode
 */
function convertirPourKaTeX(formuleBrute) {
    if (!formuleBrute || typeof formuleBrute !== 'string') {
        return formuleBrute;
    }
    
    let formule = formuleBrute.trim();
    
    // ================= CORRECTIONS COURANTES =================
    
    // 1. PROBLÈME "vint" → ∫ (correction du screenshot)
    formule = formule.replace(/vint\s+/g, '\\int ');
    
    // 2. INTÉGRALES et DIFFÉRENTIELLES
    formule = formule.replace(/∫/g, '\\int ');
    formule = formule.replace(/dx\b/g, '\\,dx');
    formule = formule.replace(/dy\b/g, '\\,dy');
    formule = formule.replace(/dz\b/g, '\\,dz');
    formule = formule.replace(/dt\b/g, '\\,dt');
    
    // 3. PUISSANCES - cas spécifique du screenshot
    formule = formule.replace(/([a-zA-Zα-ω])n\b/g, '$1^{n}');        // x^n
    formule = formule.replace(/xn\+1/g, 'x^{n+1}');                  // x^{n+1}
    formule = formule.replace(/([a-zA-Zα-ω])2\b/g, '$1^{2}');        // x^2
    formule = formule.replace(/([a-zA-Zα-ω])3\b/g, '$1^{3}');        // x^3
    
    // 4. PUISSANCES GÉNÉRALES
    formule = formule.replace(/([a-zA-Zα-ω])\^(\d+)/g, '$1^{$2}');   // x^2 → x^{2}
    formule = formule.replace(/([a-zA-Zα-ω])\^([a-zA-Z])/g, '$1^{$2}'); // x^n → x^{n}
    
    // 5. SYMBOLES MATHÉMATIQUES
    formule = formule.replace(/≠/g, '\\neq ');
    formule = formule.replace(/≈/g, '\\approx ');
    formule = formule.replace(/≤/g, '\\leq ');
    formule = formule.replace(/≥/g, '\\geq ');
    formule = formule.replace(/±/g, '\\pm ');
    formule = formule.replace(/∞/g, '\\infty ');
    
    // 6. LETTRES GRECQUES
    formule = formule.replace(/α/g, '\\alpha ');
    formule = formule.replace(/β/g, '\\beta ');
    formule = formule.replace(/γ/g, '\\gamma ');
    formule = formule.replace(/Γ/g, '\\Gamma ');
    formule = formule.replace(/δ/g, '\\delta ');
    formule = formule.replace(/Δ/g, '\\Delta ');
    formule = formule.replace(/ε/g, '\\epsilon ');
    formule = formule.replace(/π/g, '\\pi ');
    formule = formule.replace(/θ/g, '\\theta ');
    formule = formule.replace(/Θ/g, '\\Theta ');
    formule = formule.replace(/λ/g, '\\lambda ');
    formule = formule.replace(/μ/g, '\\mu ');
    formule = formule.replace(/σ/g, '\\sigma ');
    formule = formule.replace(/Σ/g, '\\Sigma ');
    formule = formule.replace(/ω/g, '\\omega ');
    formule = formule.replace(/Ω/g, '\\Omega ');
    
    // 7. OPÉRATEURS
    formule = formule.replace(/∑/g, '\\sum ');
    formule = formule.replace(/∏/g, '\\prod ');
    formule = formule.replace(/√/g, '\\sqrt{}');
    formule = formule.replace(/·/g, '\\cdot ');
    formule = formule.replace(/×/g, '\\times ');
    formule = formule.replace(/÷/g, '\\div ');
    
    // 8. FRACTIONS SPÉCIALES
    formule = formule.replace(/½/g, '\\frac{1}{2}');
    formule = formule.replace(/¼/g, '\\frac{1}{4}');
    formule = formule.replace(/¾/g, '\\frac{3}{4}');
    formule = formule.replace(/⅓/g, '\\frac{1}{3}');
    formule = formule.replace(/⅔/g, '\\frac{2}{3}');
    
    // 9. CONDITIONS TEXTE
    formule = formule.replace(/\(pour\s*n\s*≠\s*-1\)/g, '(\\text{pour } n \\neq -1)');
    formule = formule.replace(/\(pour\s*n\s*!=\s*-1\)/g, '(\\text{pour } n \\neq -1)');
    formule = formule.replace(/\(pour\s*([^)]+)\)/g, '(\\text{pour } $1)');
    
    // 10. ESPACES POUR LISIBILITÉ
    formule = formule.replace(/\s*=\s*/g, ' = ');
    formule = formule.replace(/\s*\+\s*/g, ' + ');
    formule = formule.replace(/\s*-\s*/g, ' - ');
    formule = formule.replace(/\s*\/\s*/g, ' / ');
    
    // 11. Nettoyage final
    formule = formule.replace(/\s+/g, ' ').trim();
    
    // Vérifier si la formule contient déjà du LaTeX
    if (formule.includes('\\frac') || 
        formule.includes('\\sqrt') || 
        formule.includes('\\sum') ||
        formule.includes('\\int')) {
        return formule; // Laisser intact
    }
    
    return formule;
}

/**
 * Fallback Unicode pour quand KaTeX échoue
 */
function convertirEnUnicode(formuleBrute) {
    let formule = formuleBrute;
    
    const correspondances = {
        '\\int ': '∫ ',
        'vint ': '∫ ',
        '\\sqrt{}': '√',
        '\\sum ': '∑',
        '\\prod ': '∏',
        '\\alpha': 'α',
        '\\beta': 'β',
        '\\gamma': 'γ',
        '\\pi': 'π',
        '\\theta': 'θ',
        '\\lambda': 'λ',
        '\\infty': '∞',
        '\\neq': '≠',
        '\\approx': '≈',
        '\\leq': '≤',
        '\\geq': '≥',
        '\\pm': '±',
        '\\cdot': '·',
        '\\times': '×',
        '\\div': '÷',
        '^{2}': '²',
        '^{3}': '³',
        '^{n}': 'ⁿ',
        '^{': '⁽',  // Ouverture d'exposant
        '}': '⁾',   // Fermeture d'exposant
        '_{': '₍',  // Ouverture d'indice
        '\\,dx': ' dx',
        '\\,dy': ' dy',
        '\\,dz': ' dz',
        '\\,dt': ' dt'
    };
    
    Object.keys(correspondances).forEach(key => {
        formule = formule.replace(new RegExp(key, 'g'), correspondances[key]);
    });
    
    // Gérer les exposants complexes
    formule = formule.replace(/\{([^}]+)\}/g, (match, contenu) => {
        if (match.includes('^{')) {
            return exposantUnicode(contenu);
        }
        return contenu;
    });
    
    return formule;
}

function exposantUnicode(texte) {
    const exposants = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
        'n': 'ⁿ', 'i': 'ⁱ', 'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ',
        'm': 'ᵐ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ',
        't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ',
        'y': 'ʸ', 'z': 'ᶻ', 'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ',
        'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ'
    };
    
    return texte.split('').map(char => exposants[char] || char).join('');
}

// ================= RENDU DES FORMULES =================

/**
 * Appliquer KaTeX à toutes les formules de la page
 */
function appliquerKaTeXAuxResultats() {
    if (!katexDisponible || !katexInitialise) {
        console.warn('⚠️ KaTeX non disponible, utilisation du fallback Unicode');
        appliquerFallbackUnicode();
        return;
    }
    
    const elements = document.querySelectorAll('.result-formula');
    let succes = 0;
    let echecs = 0;
    
    elements.forEach((element, index) => {
        const formuleBrute = element.getAttribute('data-formule-raw') || element.textContent;
        const formuleConvertie = convertirPourKaTeX(formuleBrute);
        
        // Attendre un peu pour éviter le blocage
        setTimeout(() => {
            try {
                const resultat = katex.renderToString(formuleConvertie, KATEX_CONFIG.OPTIONS);
                element.innerHTML = resultat;
                element.classList.add('katex-success');
                element.classList.remove('katex-failed');
                succes++;
                
            } catch (error) {
                console.warn(`❌ KaTeX échoué pour: ${formuleBrute.substring(0, 50)}...`);
                appliquerFallbackUnicodeElement(element, formuleBrute);
                element.classList.add('katex-failed');
                element.classList.remove('katex-success');
                echecs++;
            }
            
            // Initialiser le scroll après rendu
            if (element.scrollWidth > element.clientWidth) {
                element.classList.add('scrollable');
            }
            
            // Log final
            if (index === elements.length - 1) {
                console.log(`📊 KaTeX: ${succes} succès, ${echecs} échecs`);
            }
        }, index * 20);
    });
}

/**
 * Appliquer le fallback Unicode à un élément spécifique
 */
function appliquerFallbackUnicodeElement(element, formuleBrute) {
    const formuleUnicode = convertirEnUnicode(formuleBrute);
    element.innerHTML = `<span class="formule-unicode">${formuleUnicode}</span>`;
}

/**
 * Appliquer le fallback Unicode à toutes les formules
 */
function appliquerFallbackUnicode() {
    const elements = document.querySelectorAll('.result-formula');
    
    elements.forEach(element => {
        const formuleBrute = element.getAttribute('data-formule-raw') || element.textContent;
        appliquerFallbackUnicodeElement(element, formuleBrute);
    });
}

/**
 * Tester si une formule peut être rendue par KaTeX
 */
function testerFormuleKaTeX(formuleBrute) {
    if (!katexDisponible) return false;
    
    try {
        const formuleConvertie = convertirPourKaTeX(formuleBrute);
        katex.renderToString(formuleConvertie, { throwOnError: true });
        return true;
    } catch {
        return false;
    }
}

// ================= GESTION DU SCROLL =================

function initialiserScrollFormules() {
    const formules = document.querySelectorAll('.result-formula');
    
    formules.forEach(formule => {
        // Vérifier si le contenu dépasse
        if (formule.scrollWidth > formule.clientWidth) {
            formule.classList.add('scrollable');
            
            // Ajouter l'indicateur de scroll
            if (!formule.querySelector('.scroll-hint')) {
                const hint = document.createElement('span');
                hint.className = 'scroll-hint';
                hint.innerHTML = '⇄';
                formule.appendChild(hint);
            }
            
            // Gérer les événements de scroll
            formule.addEventListener('scroll', function() {
                this.classList.add('scrolled');
                const hint = this.querySelector('.scroll-hint');
                if (hint) hint.style.display = 'none';
            });
            
            // Support tactile
            formule.addEventListener('touchstart', function(e) {
                this.startX = e.touches[0].pageX;
                this.scrollLeftStart = this.scrollLeft;
            });
            
            formule.addEventListener('touchmove', function(e) {
                const x = e.touches[0].pageX;
                const walk = (x - this.startX) * 1.5;
                this.scrollLeft = this.scrollLeftStart - walk;
                e.preventDefault();
            });
        }
        
        // Sur mobile, activer le wrap si nécessaire
        if (window.innerWidth < 480 && formule.scrollWidth > formule.clientWidth * 1.5) {
            formule.classList.add('mobile-wrap');
        }
    });
}

// ================= API PUBLIQUE =================

window.KatexManager = {
    // Initialisation
    initialiser: initialiserKaTeX,
    estInitialise: () => katexInitialise,
    estDisponible: () => katexDisponible,
    
    // Conversion
    convertirPourKaTeX,
    convertirEnUnicode,
    
    // Rendu
    appliquerKaTeXAuxResultats,
    appliquerFallbackUnicode,
    testerFormuleKaTeX,
    
    // Utilitaires
    initialiserScrollFormules,
    
    // Configuration
    config: KATEX_CONFIG,
    
    // Stats
    getStats: () => ({
        initialise: katexInitialise,
        disponible: katexDisponible,
        version: KATEX_CONFIG.VERSION
    })
};

// ================= INITIALISATION AUTOMATIQUE =================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 katex.js - Gestionnaire KaTeX chargé');
        
        // Initialiser KaTeX automatiquement
        setTimeout(() => {
            KatexManager.initialiser().then(succes => {
                if (succes) {
                    console.log('✅ KatexManager prêt');
                    
                    // Appliquer KaTeX aux résultats existants
                    if (document.querySelector('.result-formula')) {
                        KatexManager.appliquerKaTeXAuxResultats();
                        KatexManager.initialiserScrollFormules();
                    }
                }
            });
        }, 500);
    });
} else {
    console.log('🚀 katex.js - Gestionnaire KaTeX chargé');
    setTimeout(() => KatexManager.initialiser(), 500);
}