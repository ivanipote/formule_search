/**
 * katex-converter.js - Conversion exhaustive pour notation mathématique
 * Supporte presque tous les caractères et symboles mathématiques
 */

class KatexConverter {
    constructor() {
        this.symboles = this.initialiserSymboles();
    }
    
    /**
     * Dictionnaire complet des symboles mathématiques
     */
    initialiserSymboles() {
        return {
            // ================= OPÉRATEURS =================
            'opérateurs': {
                '+': '+',
                '-': '-',
                '*': '\\cdot',
                '×': '\\times',
                '·': '\\cdot',
                '÷': '\\div',
                '/': '/',
                '±': '\\pm',
                '∓': '\\mp',
                
                // Comparaisons
                '=': '=',
                '≠': '\\neq',
                '≈': '\\approx',
                '≡': '\\equiv',
                '≅': '\\cong',
                '∼': '\\sim',
                '∝': '\\propto',
                '<': '<',
                '>': '>',
                '≤': '\\leq',
                '≥': '\\geq',
                '≪': '\\ll',
                '≫': '\\gg',
                
                // Ensemble
                '∈': '\\in',
                '∉': '\\notin',
                '⊂': '\\subset',
                '⊆': '\\subseteq',
                '⊃': '\\supset',
                '⊇': '\\supseteq',
                '∪': '\\cup',
                '∩': '\\cap',
                '∅': '\\emptyset',
                '∞': '\\infty',
                
                // Logique
                '∧': '\\wedge',
                '∨': '\\vee',
                '¬': '\\neg',
                '⇒': '\\Rightarrow',
                '⇔': '\\Leftrightarrow',
                '∀': '\\forall',
                '∃': '\\exists',
                '∴': '\\therefore',
                '∵': '\\because'
            },
            
            // ================= LETTRES GRECQUES =================
            'grec': {
                // Minuscules
                'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta',
                'ε': '\\varepsilon', 'ζ': '\\zeta', 'η': '\\eta', 'θ': '\\theta',
                'ϑ': '\\vartheta', 'ι': '\\iota', 'κ': '\\kappa', 'λ': '\\lambda',
                'μ': '\\mu', 'ν': '\\nu', 'ξ': '\\xi', 'ο': 'o',
                'π': '\\pi', 'ϖ': '\\varpi', 'ρ': '\\rho', 'ϱ': '\\varrho',
                'σ': '\\sigma', 'ς': '\\varsigma', 'τ': '\\tau', 'υ': '\\upsilon',
                'φ': '\\phi', 'ϕ': '\\varphi', 'χ': '\\chi', 'ψ': '\\psi',
                'ω': '\\omega',
                
                // Majuscules
                'Α': 'A', 'Β': 'B', 'Γ': '\\Gamma', 'Δ': '\\Delta',
                'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Θ': '\\Theta',
                'Ι': 'I', 'Κ': 'K', 'Λ': '\\Lambda', 'Μ': 'M',
                'Ν': 'N', 'Ξ': '\\Xi', 'Ο': 'O', 'Π': '\\Pi',
                'Ρ': 'P', 'Σ': '\\Sigma', 'Τ': 'T', 'Υ': '\\Upsilon',
                'Φ': '\\Phi', 'Χ': 'X', 'Ψ': '\\Psi', 'Ω': '\\Omega'
            },
            
            // ================= CALCUL =================
            'calcul': {
                '∫': '\\int',
                '∬': '\\iint',
                '∭': '\\iiint',
                '∮': '\\oint',
                '∂': '\\partial',
                '∇': '\\nabla',
                '∆': '\\Delta',
                '∑': '\\sum',
                '∏': '\\prod',
                '∐': '\\coprod',
                'lim': '\\lim',
                'max': '\\max',
                'min': '\\min',
                'sup': '\\sup',
                'inf': '\\inf',
                'det': '\\det',
                'dim': '\\dim',
                'ker': '\\ker',
                'hom': '\\hom'
            },
            
            // ================= GÉOMÉTRIE =================
            'géométrie': {
                '∠': '\\angle',
                '⊥': '\\perp',
                '∥': '\\parallel',
                '°': '^{\\circ}',
                '△': '\\triangle',
                '□': '\\square',
                '▱': '\\parallelogram',
                '⊙': '\\odot',
                '∘': '\\circ'
            },
            
            // ================= ENSEMBLES =================
            'ensembles': {
                'ℕ': '\\mathbb{N}',
                'ℤ': '\\mathbb{Z}',
                'ℚ': '\\mathbb{Q}',
                'ℝ': '\\mathbb{R}',
                'ℂ': '\\mathbb{C}',
                'ℍ': '\\mathbb{H}',
                'ℙ': '\\mathbb{P}',
                '∁': '\\complement'
            },
            
            // ================= ARROWS =================
            'flèches': {
                '→': '\\rightarrow',
                '←': '\\leftarrow',
                '↔': '\\leftrightarrow',
                '⇒': '\\Rightarrow',
                '⇐': '\\Leftarrow',
                '⇔': '\\Leftrightarrow',
                '↦': '\\mapsto',
                '↪': '\\hookrightarrow',
                '↩': '\\hookleftarrow',
                '↑': '\\uparrow',
                '↓': '\\downarrow',
                '↗': '\\nearrow',
                '↘': '\\searrow',
                '↙': '\\swarrow',
                '↖': '\\nwarrow'
            },
            
            // ================= DIVERS =================
            'divers': {
                'ℏ': '\\hbar',
                'ℓ': '\\ell',
                'ℑ': '\\Im',
                'ℜ': '\\Re',
                '℘': '\\wp',
                '†': '\\dagger',
                '‡': '\\ddagger',
                '§': '\\S',
                '¶': '\\P',
                '©': '\\copyright',
                '®': '\\textregistered',
                '‰': '\\permil',
                '‱': '\\pertenk'
            }
        };
    }
    
    /**
     * Convertit une formule texte en syntaxe KaTeX
     */
    convertir(texte) {
        if (!texte || typeof texte !== 'string') return '';
        
        let resultat = texte.trim();
        
        // 1. Conversion des symboles spéciaux
        resultat = this.convertirSymboles(resultat);
        
        // 2. Conversion des fonctions mathématiques
        resultat = this.convertirFonctions(resultat);
        
        // 3. Conversion des exposants/indices
        resultat = this.convertirExposantsIndices(resultat);
        
        // 4. Conversion des fractions
        resultat = this.convertirFractions(resultat);
        
        // 5. Conversion des racines
        resultat = this.convertirRacines(resultat);
        
        // 6. Conversion des intégrales/sommes
        resultat = this.convertirOperateursEtendus(resultat);
        
        // 7. Nettoyage final
        resultat = this.nettoyer(resultat);
        
        return resultat;
    }
    
    /**
     * Convertit les symboles caractère par caractère
     */
    convertirSymboles(texte) {
        let resultat = texte;
        
        // Parcourir tous les dictionnaires de symboles
        Object.values(this.symboles).forEach(dictionnaire => {
            Object.entries(dictionnaire).forEach(([symbole, latex]) => {
                const regex = new RegExp(this.escapeRegExp(symbole), 'g');
                resultat = resultat.replace(regex, latex);
            });
        });
        
        return resultat;
    }
    
    /**
     * Convertit les fonctions mathématiques
     */
    convertirFonctions(texte) {
        let resultat = texte;
        
        // Fonctions avec parenthèses
        const fonctions = [
            'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
            'arcsin', 'arccos', 'arctan',
            'sinh', 'cosh', 'tanh',
            'ln', 'log', 'exp', 'lg',
            'arg', 'deg', 'dim', 'gcd', 'lcm', 'mod'
        ];
        
        fonctions.forEach(fn => {
            const regex = new RegExp(`\\b${fn}\\s*\\(`, 'g');
            resultat = resultat.replace(regex, `\\${fn}\\(`);
        });
        
        return resultat;
    }
    
    /**
     * Convertit les exposants et indices
     */
    convertirExposantsIndices(texte) {
        let resultat = texte;
        
        // Exposants simples: a^2 → a^{2}
        resultat = resultat.replace(/([a-zA-Zα-ωΑ-Ω0-9])\^([0-9])/g, '$1^{$2}');
        
        // Exposants composés: a^(n+1) → a^{n+1}
        resultat = resultat.replace(/([a-zA-Zα-ωΑ-Ω0-9])\^\(([^)]+)\)/g, '$1^{$2}');
        
        // Indices: a_n → a_{n}
        resultat = resultat.replace(/([a-zA-Zα-ωΑ-Ω])_([a-zA-Z0-9])/g, '$1_{$2}');
        
        // Indices composés: a_(n+1) → a_{n+1}
        resultat = resultat.replace(/([a-zA-Zα-ωΑ-Ω])_\(([^)]+)\)/g, '$1_{$2}');
        
        return resultat;
    }
    
    /**
     * Convertit les fractions
     */
    convertirFractions(texte) {
        let resultat = texte;
        
        // Fractions inline simples: a/b → \frac{a}{b}
        // Évite de convertir les fractions déjà en \frac
        if (!resultat.includes('\\frac')) {
            // Conversion sécurisée pour les fractions simples
            resultat = resultat.replace(/([a-zA-Z0-9]+|[0-9]+\.[0-9]+)\/([a-zA-Z0-9]+|[0-9]+\.[0-9]+)/g, '\\frac{$1}{$2}');
        }
        
        return resultat;
    }
    
    /**
     * Convertit les racines
     */
    convertirRacines(texte) {
        let resultat = texte;
        
        // Racine carrée: sqrt(x) → \sqrt{x}
        resultat = resultat.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
        
        // Racine n-ième: root(n)(x) → \sqrt[n]{x}
        resultat = resultat.replace(/root\(([^)]+)\)\(([^)]+)\)/g, '\\sqrt[$1]{$2}');
        
        return resultat;
    }
    
    /**
     * Convertit les opérateurs étendus
     */
    convertirOperateursEtendus(texte) {
        let resultat = texte;
        
        // Intégrale avec bornes: ∫_a^b → \int_a^b
        resultat = resultat.replace(/∫_([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '\\int_{$1}^{$2}');
        
        // Somme avec bornes: ∑_i=1^n → \sum_{i=1}^{n}
        resultat = resultat.replace(/∑_([a-zA-Z0-9]+)=([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '\\sum_{$1=$2}^{$3}');
        
        return resultat;
    }
    
    /**
     * Nettoyage final
     */
    nettoyer(texte) {
        let resultat = texte;
        
        // Espaces autour des opérateurs
        const operateurs = ['+', '-', '=', '\\neq', '\\approx', '\\equiv'];
        operateurs.forEach(op => {
            resultat = resultat.replace(new RegExp(`\\s*${this.escapeRegExp(op)}\\s*`, 'g'), ` ${op} `);
        });
        
        // Supprimer les doubles espaces
        resultat = resultat.replace(/\s+/g, ' ');
        
        // Espaces avant/suite à certaines commandes
        resultat = resultat.replace(/\\left\s*\(/g, '\\left(');
        resultat = resultat.replace(/\\right\s*\)/g, '\\right)');
        
        return resultat.trim();
    }
    
    /**
     * Échappe les caractères spéciaux pour RegExp
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * Vérifie si le texte contient des symboles mathématiques
     */
    contientSymbolesMath(texte) {
        if (!texte) return false;
        
        // Liste des patterns mathématiques
        const patterns = [
            /\^/, // Exposants
            /_/,  // Indices
            /\\[a-zA-Z]+/, // Commandes LaTeX
            /[α-ωΑ-Ω]/, // Lettres grecques
            /[∫∑∏∂∇∆∮]/, // Symboles calcul
            /[∈∉⊂⊆⊃⊇∪∩∅∞]/, // Symboles ensemble
            /[≤≥≠≈≡≅∼∝]/, // Comparaisons
            /[→←↔⇒⇐⇔]/, // Flèches
        ];
        
        return patterns.some(pattern => pattern.test(texte));
    }
    
    /**
     * Formate une formule pour l'affichage (ajoute \displaystyle si nécessaire)
     */
    formaterPourAffichage(formule) {
        if (!formule) return '';
        
        // Si la formule contient des fractions/intégrales/sommes, ajouter \displaystyle
        const besoinsDisplaystyle = /\\frac|\\int|\\sum|\\prod|\\big|\\left|\\right/.test(formule);
        
        if (besoinsDisplaystyle && !formule.startsWith('\\displaystyle')) {
            return `\\displaystyle ${formule}`;
        }
        
        return formule;
    }
}

// Export global
window.KatexConverter = new KatexConverter();