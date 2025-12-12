// exercices.js - VERSION COMPLÈTE FINALE
// Projet scolaire mathX_searcher - Centre d'Exercices

// ================= CONFIGURATION =================
const CONFIG = {
    DOSSIER_EXERCICES: 'exercices/',
    DEBOUNCE_DELAY: 500,
    MIN_CHARS: 2,
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    SUPPORTED_TYPES: {
        pdf: ['pdf'],
        txt: ['txt', 'rtf', 'md'],
        image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']
    }
};

// ================= ÉTATS GLOBAUX =================
let fileIndex = [];
let searchTimeout = null;
let activeFilters = { pdf: true, txt: true, image: true };
let isScanning = false;
let isAuthenticated = false;

// ================= VÉRIFICATION AUTHENTIFICATION =================
async function checkAuthentication() {
    console.log('🔐 Vérification authentification...');
    
    try {
        // Méthode 1: Vérifier Firebase si disponible
        if (typeof firebase !== 'undefined' && firebase.auth) {
            return new Promise((resolve) => {
                firebase.auth().onAuthStateChanged((user) => {
                    if (user) {
                        console.log('✅ Utilisateur authentifié:', user.email);
                        isAuthenticated = true;
                        resolve(true);
                    } else {
                        console.log('❌ Utilisateur non authentifié');
                        redirectToIndex();
                        resolve(false);
                    }
                });
            });
        }
        
        // Méthode 2: Vérifier localStorage
        const authStatus = localStorage.getItem('mathx_auth_status');
        const userEmail = localStorage.getItem('mathx_user_email');
        
        if (authStatus === 'connected' && userEmail) {
            console.log('✅ Authentifié via cache:', userEmail);
            isAuthenticated = true;
            return true;
        }
        
        // Non authentifié
        console.log('❌ Accès non autorisé');
        redirectToIndex();
        return false;
        
    } catch (error) {
        console.error('❌ Erreur vérification auth:', error);
        redirectToIndex();
        return false;
    }
}

function redirectToIndex() {
    localStorage.setItem('mathx_redirect_message', 
        '🔒 Connectez-vous à votre compte pour accéder aux exercices');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// ================= INITIALISATION =================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initialisation exercices.js - Projet scolaire');
    
    try {
        // 1. VÉRIFIER L'AUTHENTIFICATION
        const authOk = await checkAuthentication();
        if (!authOk) return;
        
        // 2. Initialiser les filtres
        initFilters();
        
        // 3. Scanner les fichiers
        await scanDirectoryIntelligently();
        
        // 4. Initialiser l'interface
        initInterface();
        
        // 5. Afficher l'état initial
        showHomeContent();
        
        console.log('✅ Système prêt | Projet scolaire actif');
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
    }
});

// ================= SCANNER INTELLIGENT =================
async function scanDirectoryIntelligently() {
    console.log('🔍 Scanner intelligent activé...');
    
    if (isScanning) {
        console.log('⚠️ Scan déjà en cours');
        return;
    }
    
    isScanning = true;
    
    try {
        // Essayer de scanner via différentes techniques
        let fichiers = await tryAllScanMethods();
        
        if (fichiers.length === 0) {
            console.log('⚠️ Aucun fichier détecté');
            fichiers = await checkForCommonFiles();
        }
        
        // Indexer les fichiers trouvés
        fileIndex = await indexAndEnrichFiles(fichiers);
        
        // Sauvegarder dans le cache
        saveToCache();
        
        console.log(`📊 ${fileIndex.length} fichiers indexés`);
        
    } catch (error) {
        console.error('❌ Erreur scan:', error);
        fileIndex = getCommonEducationalFiles();
    } finally {
        isScanning = false;
    }
}

async function tryAllScanMethods() {
    const fichiers = [];
    
    // Méthode 1: Listing serveur
    try {
        const serverFiles = await scanViaServerListing();
        if (serverFiles.length > 0) {
            console.log(`📁 ${serverFiles.length} fichiers via serveur`);
            fichiers.push(...serverFiles);
            return fichiers;
        }
    } catch (e) {}
    
    // Méthode 2: Fichiers spécifiques
    try {
        const specificFiles = await scanForSpecificFiles();
        if (specificFiles.length > 0) {
            console.log(`🎯 ${specificFiles.length} fichiers spécifiques`);
            fichiers.push(...specificFiles);
        }
    } catch (e) {}
    
    return fichiers;
}

async function scanViaServerListing() {
    try {
        const response = await fetch(CONFIG.DOSSIER_EXERCICES);
        if (!response.ok) throw new Error('Réponse non OK');
        
        const html = await response.text();
        return parseServerListing(html);
    } catch (error) {
        throw error;
    }
}

function parseServerListing(html) {
    const fichiers = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    doc.querySelectorAll('a').forEach(lien => {
        const href = lien.getAttribute('href');
        
        if (href && href !== '../' && href !== '/' && !href.startsWith('?')) {
            let nomFichier = href.split('/').pop().split('?')[0];
            const extension = nomFichier.split('.').pop().toLowerCase();
            const isSupported = Object.values(CONFIG.SUPPORTED_TYPES)
                .flat()
                .includes(extension);
            
            if (isSupported && nomFichier.includes('.')) {
                fichiers.push({
                    nom: nomFichier,
                    chemin: CONFIG.DOSSIER_EXERCICES + nomFichier,
                    extension: extension
                });
            }
        }
    });
    
    return fichiers;
}

async function scanForSpecificFiles() {
    const fichiers = [];
    const nomsTest = ['exercice', 'cours', 'math', 'physique', 'algebre'];
    const extensions = Object.values(CONFIG.SUPPORTED_TYPES).flat();
    
    for (const nom of nomsTest) {
        for (const ext of extensions) {
            const nomFichier = `${nom}.${ext}`;
            const chemin = `${CONFIG.DOSSIER_EXERCICES}${nomFichier}`;
            
            try {
                const response = await fetch(chemin, { method: 'HEAD' });
                if (response.ok) {
                    fichiers.push({
                        nom: nomFichier,
                        chemin: chemin,
                        extension: ext
                    });
                }
            } catch (e) {}
        }
    }
    
    return fichiers;
}

async function checkForCommonFiles() {
    const fichiers = [];
    const fichiersCommuns = [
        'exercice.txt', 'cours.pdf', 'formule.txt',
        'theoreme.pdf', 'geometrie.png', 'schema.jpg'
    ];
    
    for (const nomFichier of fichiersCommuns) {
        const chemin = `${CONFIG.DOSSIER_EXERCICES}${nomFichier}`;
        
        try {
            const response = await fetch(chemin, { method: 'HEAD' });
            if (response.ok) {
                const extension = nomFichier.split('.').pop().toLowerCase();
                fichiers.push({
                    nom: nomFichier,
                    chemin: chemin,
                    extension: extension
                });
            }
        } catch (e) {}
    }
    
    return fichiers;
}

async function indexAndEnrichFiles(fichiers) {
    const fichiersIndexes = [];
    
    for (const fichier of fichiers) {
        try {
            const fichierIndexe = await enrichirFichier(fichier);
            fichiersIndexes.push(fichierIndexe);
        } catch (error) {
            fichiersIndexes.push(creerFichierBasique(fichier));
        }
    }
    
    return fichiersIndexes;
}

async function enrichirFichier(fichier) {
    const type = getFileType(fichier.extension);
    
    let taille = 0;
    try {
        const response = await fetch(fichier.chemin, { method: 'HEAD' });
        if (response.ok) {
            const contentLength = response.headers.get('content-length');
            if (contentLength) taille = parseInt(contentLength);
        }
    } catch (e) {}
    
    let extrait = '';
    if (type === 'txt' && taille < 100000) {
        try {
            const response = await fetch(fichier.chemin);
            const texte = await response.text();
            extrait = texte.substring(0, 200).replace(/\n/g, ' ');
        } catch (e) {}
    }
    
    return {
        id: Date.now() + '-' + Math.random().toString(36).substr(2),
        nom: fichier.nom,
        chemin: fichier.chemin,
        type: type,
        titre: extractTitle(fichier.nom),
        description: getFileDescription(type),
        icon: getFileIcon(type),
        color: getFileColor(type),
        humanSize: formatFileSize(taille),
        taille: taille,
        extrait: extrait,
        motsCles: extractKeywords(fichier.nom),
        date: new Date().toISOString(),
        trouvePar: 'scan_automatique'
    };
}

function creerFichierBasique(fichier) {
    const type = getFileType(fichier.extension);
    
    return {
        id: 'basic-' + Math.random().toString(36).substr(2),
        nom: fichier.nom,
        chemin: fichier.chemin,
        type: type,
        titre: extractTitle(fichier.nom),
        description: getFileDescription(type),
        icon: getFileIcon(type),
        color: getFileColor(type),
        humanSize: 'N/A',
        taille: 0,
        extrait: '',
        motsCles: extractKeywords(fichier.nom),
        date: new Date().toISOString(),
        trouvePar: 'scan_basique'
    };
}

function getCommonEducationalFiles() {
    return [
        {
            id: 'defaut-1',
            nom: 'exemple_exercice.txt',
            chemin: 'exercices/exemple_exercice.txt',
            type: 'txt',
            titre: 'Exemple d\'Exercice',
            description: 'Fichier texte d\'exemple',
            icon: '📃',
            color: 'file-text',
            humanSize: '1.2 KB',
            motsCles: ['exemple', 'exercice', 'math'],
            trouvePar: 'fallback'
        }
    ];
}

// ================= GESTION DES FILTRES =================
function initFilters() {
    const savedFilters = localStorage.getItem('mathx_exercices_filtres');
    if (savedFilters) {
        try {
            activeFilters = JSON.parse(savedFilters);
        } catch (e) {
            activeFilters = { pdf: true, txt: true, image: true };
        }
    }
    
    document.querySelectorAll('.filter-input').forEach(input => {
        const type = input.dataset.type;
        const checkbox = input.closest('.filter-checkbox');
        
        input.checked = activeFilters[type] !== false;
        
        if (input.checked) {
            checkbox.classList.add('active');
        }
        
        input.addEventListener('change', function() {
            activeFilters[type] = this.checked;
            
            if (this.checked) {
                checkbox.classList.add('active');
            } else {
                checkbox.classList.remove('active');
            }
            
            localStorage.setItem('mathx_exercices_filtres', JSON.stringify(activeFilters));
            
            const searchInput = document.getElementById('exercicesSearchInput');
            if (searchInput && searchInput.value.trim()) {
                performSearch(searchInput.value.trim());
            }
        });
    });
}

// ================= SYSTÈME DE RECHERCHE =================
function performSearch(query) {
    clearTimeout(searchTimeout);
    
    if (!query.trim()) {
        showHomeContent();
        return;
    }
    
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="loading">Recherche en cours...</div>';
    }
    
    showResultsContent();
    
    searchTimeout = setTimeout(() => {
        const searchTerms = query.toLowerCase().split(' ');
        
        // Vérifier filtres actifs
        const hasActiveFilter = activeFilters.pdf || activeFilters.txt || activeFilters.image;
        if (!hasActiveFilter) {
            displayNoActiveFilters(query);
            return;
        }
        
        // Filtrer par types actifs
        let filteredByType = fileIndex.filter(file => activeFilters[file.type]);
        
        if (filteredByType.length === 0) {
            displayNoResultsForFilters(query);
            return;
        }
        
        // Recherche dans fichiers filtrés
        const results = filteredByType.filter(file => {
            const searchableText = (
                file.nom.toLowerCase() + ' ' +
                file.titre.toLowerCase() + ' ' +
                file.motsCles.join(' ').toLowerCase() + ' ' +
                (file.extrait || '').toLowerCase()
            );
            
            return searchTerms.some(term => 
                searchableText.includes(term) && term.length > 1
            );
        });
        
        if (results.length === 0) {
            displayNoResultsForSearch(query);
            return;
        }
        
        displaySearchResults(results, query);
    }, CONFIG.DEBOUNCE_DELAY);
}

function displayNoActiveFilters(query) {
    const noResultsState = document.getElementById('noResultsState');
    if (noResultsState) {
        noResultsState.style.display = 'block';
        noResultsState.innerHTML = `
            <i class="fas fa-filter fa-2x" style="margin-bottom: 15px; color: #f59e0b;"></i>
            <h3>Aucun filtre activé</h3>
            <p>Recherche : <strong>"${escapeHTML(query)}"</strong></p>
            <p>Activez au moins un filtre pour voir les résultats.</p>
        `;
    }
    document.getElementById('welcomeState').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'none';
}

function displayNoResultsForFilters(query) {
    const noResultsState = document.getElementById('noResultsState');
    const activeFilterNames = getActiveFilterNames();
    
    if (noResultsState) {
        noResultsState.style.display = 'block';
        noResultsState.innerHTML = `
            <i class="fas fa-search fa-2x" style="margin-bottom: 15px; color: #94a3b8;"></i>
            <h3>Aucun fichier trouvé</h3>
            <p>Recherche : <strong>"${escapeHTML(query)}"</strong></p>
            <p>Filtre(s) : <strong>${activeFilterNames.join(', ')}</strong></p>
            <p>Aucun fichier correspondant dans le dossier.</p>
        `;
    }
    document.getElementById('welcomeState').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'none';
}

function displayNoResultsForSearch(query) {
    const noResultsState = document.getElementById('noResultsState');
    const activeFilterNames = getActiveFilterNames();
    
    if (noResultsState) {
        noResultsState.style.display = 'block';
        noResultsState.innerHTML = `
            <i class="fas fa-search fa-2x" style="margin-bottom: 15px; color: #94a3b8;"></i>
            <h3>Aucun résultat</h3>
            <p>Recherche : <strong>"${escapeHTML(query)}"</strong></p>
            <p>Filtre(s) : <strong>${activeFilterNames.join(', ')}</strong></p>
            <p>Essayez d'autres termes ou modifiez les filtres.</p>
            <button class="scan-new-files" onclick="rescanDirectory()" style="margin-top: 20px;">
                <i class="fas fa-sync-alt"></i> Re-scanner
            </button>
        `;
    }
    document.getElementById('welcomeState').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'none';
}

function displaySearchResults(results, query) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    const resultsCount = document.createElement('div');
    resultsCount.className = 'results-count';
    resultsCount.innerHTML = `
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); 
                    color: white; border-radius: 15px; margin-bottom: 30px;">
            <h3 style="margin-bottom: 10px;">${results.length} résultat(s)</h3>
            <p style="opacity: 0.9;">Recherche : "${escapeHTML(query)}"</p>
            <small>Filtres : ${getActiveFilterNames().join(', ')}</small>
        </div>
    `;
    resultsContainer.appendChild(resultsCount);
    
    results.forEach(file => {
        const card = createFileCard(file);
        resultsContainer.appendChild(card);
    });
    
    resultsContainer.style.display = 'grid';
    document.getElementById('noResultsState').style.display = 'none';
    document.getElementById('welcomeState').style.display = 'none';
}

function getActiveFilterNames() {
    const filters = [];
    if (activeFilters.pdf) filters.push('PDF');
    if (activeFilters.txt) filters.push('Exercices');
    if (activeFilters.image) filters.push('Images');
    return filters.length === 0 ? ['Aucun'] : filters;
}

// ================= UTILITAIRES =================
function getFileType(extension) {
    for (const [type, extensions] of Object.entries(CONFIG.SUPPORTED_TYPES)) {
        if (extensions.includes(extension)) return type;
    }
    return 'other';
}

function extractTitle(filename) {
    const sansExtension = filename.replace(/\.[^/.]+$/, '');
    const avecEspaces = sansExtension.replace(/[_-]/g, ' ');
    
    return avecEspaces
        .split(' ')
        .map(word => {
            if (word.length > 0) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }
            return word;
        })
        .join(' ');
}

function extractKeywords(filename) {
    const title = extractTitle(filename);
    const words = title.toLowerCase().split(/\s+/);
    const ignoreWords = ['de', 'des', 'du', 'et', 'ou', 'les', 'la', 'le'];
    return words.filter(word => word.length > 2 && !ignoreWords.includes(word));
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType) {
    const icons = {'pdf': '📄', 'txt': '📃', 'image': '🖼️', 'other': '📁'};
    return icons[fileType] || '📁';
}

function getFileColor(fileType) {
    const colors = {'pdf': 'file-pdf', 'txt': 'file-text', 'image': 'file-image', 'other': 'file-other'};
    return colors[fileType] || 'file-other';
}

function getFileDescription(fileType) {
    const descriptions = {'pdf': 'Document PDF', 'txt': 'Fichier texte', 'image': 'Image', 'other': 'Fichier'};
    return descriptions[fileType] || 'Fichier';
}

function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveToCache() {
    try {
        const cache = { files: fileIndex, timestamp: Date.now() };
        localStorage.setItem('mathx_exercices_cache', JSON.stringify(cache));
    } catch (e) {}
}

// ================= CRÉATION DES CARTES =================
function createFileCard(file) {
    const div = document.createElement('div');
    div.className = `result-card ${file.type}-card visible`;
    div.setAttribute('data-type', file.type);
    
    let previewHTML = '';
    if (file.type === 'txt' && file.extrait) {
        previewHTML = `<div class="exercise-preview">${escapeHTML(file.extrait)}...</div>`;
    } else if (file.type === 'image') {
        previewHTML = `
            <div class="image-container">
                <img src="${escapeHTML(file.chemin)}" alt="${escapeHTML(file.titre)}" 
                     class="image-preview" loading="lazy" onerror="this.style.display='none'">
            </div>
        `;
    } else {
        previewHTML = `<div class="file-description">${escapeHTML(file.description)}</div>`;
    }
    
    let buttonsHTML = '';
    if (file.type === 'pdf') {
        buttonsHTML = `
            <a href="${escapeHTML(file.chemin)}" class="action-download" download="${escapeHTML(file.nom)}">
                <i class="fas fa-download"></i> Télécharger
            </a>
            <a href="https://docs.google.com/gview?url=${encodeURIComponent(file.chemin)}&embedded=true" 
               target="_blank" class="action-open">
                <i class="fas fa-external-link-alt"></i> Ouvrir
            </a>
        `;
    } else if (file.type === 'txt') {
        buttonsHTML = `
            <a href="${escapeHTML(file.chemin)}" class="action-download" download="${escapeHTML(file.nom)}">
                <i class="fas fa-download"></i> Télécharger
            </a>
            <a href="${escapeHTML(file.chemin)}" target="_blank" class="action-open">
                <i class="fas fa-external-link-alt"></i> Ouvrir
            </a>
        `;
    } else if (file.type === 'image') {
        buttonsHTML = `
            <a href="${escapeHTML(file.chemin)}" class="action-download" download="${escapeHTML(file.nom)}">
                <i class="fas fa-download"></i> Télécharger
            </a>
            <button class="action-open" onclick="openImagePreview('${escapeHTML(file.chemin)}', '${escapeHTML(file.nom)}')">
                <i class="fas fa-eye"></i> Voir
            </button>
        `;
    } else {
        buttonsHTML = `
            <a href="${escapeHTML(file.chemin)}" class="action-download" download="${escapeHTML(file.nom)}">
                <i class="fas fa-download"></i> Télécharger
            </a>
        `;
    }
    
    const shortName = file.nom.length > 30 ? file.nom.substring(0, 27) + '...' : file.nom;
    
    div.innerHTML = `
        <div class="card-header">
            <h3 class="file-title" title="${escapeHTML(file.titre)}">
                ${escapeHTML(file.titre)}
            </h3>
            <span class="file-type">${file.type.toUpperCase()}</span>
        </div>
        ${previewHTML}
        <div class="file-info">
            <div class="info-item"><i class="fas fa-file-alt"></i><span>${file.type.toUpperCase()}</span></div>
            <div class="info-item"><i class="fas fa-weight-hanging"></i><span>${file.humanSize}</span></div>
            <div class="info-item"><i class="fas fa-search"></i><span title="${escapeHTML(file.nom)}">${escapeHTML(shortName)}</span></div>
        </div>
        <div class="card-actions">
            ${buttonsHTML}
        </div>
    `;
    
    return div;
}

// ================= VISIONNEUSE D'IMAGES =================
function openImagePreview(imageUrl, fileName) {
    const overlay = document.createElement('div');
    overlay.className = 'image-overlay';
    overlay.innerHTML = `
        <div class="image-modal">
            <div class="image-header">
                <h3>${escapeHTML(fileName)}</h3>
                <button class="close-btn" onclick="closeImagePreview()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="image-container">
                <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(fileName)}" 
                     onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"300\"><rect width=\"400\" height=\"300\" fill=\"%23f1f5f9\"/><text x=\"50%\" y=\"50%\" font-family=\"Arial\" font-size=\"16\" fill=\"%2364748b\" text-anchor=\"middle\" dy=\".3em\">Image non chargée</text></svg>'">
            </div>
            <div class="image-footer">
                <a href="${escapeHTML(imageUrl)}" class="btn-download" download="${escapeHTML(fileName)}">
                    <i class="fas fa-download"></i> Télécharger
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
}

function closeImagePreview() {
    const overlay = document.querySelector('.image-overlay');
    if (overlay) {
        overlay.remove();
        document.body.style.overflow = '';
    }
}

// ================= GESTION INTERFACE =================
function showHomeContent() {
    const welcomeState = document.getElementById('welcomeState');
    const noResultsState = document.getElementById('noResultsState');
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (welcomeState) welcomeState.style.display = 'block';
    if (noResultsState) noResultsState.style.display = 'none';
    if (resultsContainer) resultsContainer.style.display = 'none';
}

function showResultsContent() {
    const welcomeState = document.getElementById('welcomeState');
    if (welcomeState) welcomeState.style.display = 'none';
}

function initInterface() {
    const searchInput = document.getElementById('exercicesSearchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = this.value;
            
            if (query.length >= CONFIG.MIN_CHARS) {
                performSearch(query);
            } else if (query.length === 0) {
                showHomeContent();
            }
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                performSearch(this.value);
            }
        });
        
        setTimeout(() => {
            searchInput.focus();
        }, 500);
    }
    
    const scanBtn = document.getElementById('scanNewFilesBtn');
    if (scanBtn) {
        scanBtn.addEventListener('click', async function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scan...';
            this.disabled = true;
            
            await scanDirectoryIntelligently();
            
            const searchInput = document.getElementById('exercicesSearchInput');
            if (searchInput && searchInput.value.trim()) {
                performSearch(searchInput.value.trim());
            }
            
            this.innerHTML = '<i class="fas fa-sync-alt"></i> Scanner';
            this.disabled = false;
        });
    }
    
    // Gestion du thème
    initThemeSync();
}

async function rescanDirectory() {
    await scanDirectoryIntelligently();
    
    const searchInput = document.getElementById('exercicesSearchInput');
    if (searchInput && searchInput.value.trim()) {
        performSearch(searchInput.value.trim());
    }
}

// ================= GESTION THÈME GLOBAL =================
function initThemeSync() {
    applyGlobalTheme();
    
    window.addEventListener('storage', (e) => {
        if (e.key === 'mathx_theme' || e.key === 'mathx_dark_mode') {
            applyGlobalTheme();
        }
    });
    
    window.addEventListener('themeChanged', (e) => {
        if (e.detail && e.detail.theme) {
            document.documentElement.setAttribute('data-theme', e.detail.theme);
        }
    });
}

function applyGlobalTheme() {
    const savedTheme = localStorage.getItem('mathx_theme');
    const isDarkMode = localStorage.getItem('mathx_dark_mode') === 'true';
    
    if (savedTheme === 'dark' || isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

// ================= EXPORT =================
window.ExercicesManager = {
    scan: scanDirectoryIntelligently,
    search: performSearch,
    getFiles: () => fileIndex,
    getFilters: () => activeFilters,
    rescan: rescanDirectory
};

// Pluto dans la console
console.log('%c✨ mathX_searcher - Projet scolaire ✨', 'color: #06b6d4; font-size: 16px; font-weight: bold;');
console.log('%c📚 Centre d\'Exercices activé', 'color: #10b981; font-size: 14px;');
console.log('%c🔒 Accès authentifié ✓', 'color: #059669; font-size: 12px;');
console.log('%c🚀 Système prêt à l\'emploi', 'color: #3b82f6; font-size: 12px;');
console.log('='.repeat(50));