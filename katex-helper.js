/**
 * katex-helper.js - Rendu mathématique pour mathX_searcher
 */

class KatexRenderer {
    constructor() {
        this.initialized = false;
        this.options = {
            throwOnError: false,
            displayMode: true,
            fleqn: true,
            output: 'html'
        };
    }
    
    init() {
        if (typeof katex === 'undefined') {
            console.warn('KaTeX non chargé, chargement...');
            this.loadKatex();
            return;
        }
        
        this.initialized = true;
        console.log('✅ KaTeX prêt pour le rendu mathématique');
    }
    
    loadKatex() {
        // Charger KaTeX dynamiquement
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.onload = () => {
            this.initialized = true;
            this.renderAll();
        };
        document.head.appendChild(script);
    }
    
    renderElement(element) {
        if (!this.initialized || !katex) return;
        
        const formula = element.getAttribute('data-katex');
        if (!formula) return;
        
        try {
            katex.render(formula, element, this.options);
        } catch (error) {
            console.warn('Erreur KaTeX:', error);
            // Garder le texte brut
        }
    }
    
    renderAll() {
        if (!this.initialized) return;
        
        // Rendre toutes les formules
        document.querySelectorAll('[data-katex]').forEach(el => {
            this.renderElement(el);
        });
    }
    
    // Détecter et convertir les notations simples
    convertSimpleNotation(text) {
        // Carrés : a^2 → a²
        text = text.replace(/(\w)\^2/g, '$1²');
        text = text.replace(/(\w)\^3/g, '$1³');
        
        // Fractions simples : a/b → \frac{a}{b}
        text = text.replace(/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/g, '\\frac{$1}{$2}');
        
        // Racines : sqrt(a) → \sqrt{a}
        text = text.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
        
        // Pi : pi → π
        text = text.replace(/\bpi\b/g, 'π');
        
        return text;
    }
}

// Initialisation globale
window.KatexHelper = new KatexRenderer();