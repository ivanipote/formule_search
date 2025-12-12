// exercices.js - VERSION CORRIGÉE (vrai fichiers GitHub seulement)
console.log('🔧 exercices.js - CHARGEMENT');

// ================= CONFIGURATION =================
const GITHUB_CONFIG = {
    USER: 'ivanipote',
    REPO: 'MathX_searcher',
    BRANCH: 'main',
    FOLDER: 'exercices'
};

// URLs
const API_URL = `https://api.github.com/repos/${GITHUB_CONFIG.USER}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.FOLDER}`;
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_CONFIG.USER}/${GITHUB_CONFIG.REPO}/${GITHUB_CONFIG.BRANCH}/${GITHUB_CONFIG.FOLDER}/`;

// ================= ÉTATS =================
let files = [];
let activeFilters = { pdf: true, image: true };

// ================= FONCTIONS UTILITAIRES =================
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    return null;
}

function formatTitle(filename) {
    return filename
        .replace(/\.[^/.]+$/, '') // Enlever extension
        .replace(/[_-]/g, ' ')    // Remplacer _ et - par espace
        .replace(/\b\w/g, l => l.toUpperCase()); // Première lettre majuscule
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatSize(bytes) {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

// ================= CHARGEMENT FICHIERS RÉELS =================
async function loadRealFiles() {
    console.log('📥 Chargement VRAI fichiers depuis GitHub...');
    console.log('🔗 URL:', API_URL);
    
    try {
        const response = await fetch(API_URL);
        console.log('📊 Statut:', response.status, response.statusText);
        
        if (!response.ok) {
            // Si dossier vide ou erreur, retourner tableau vide
            if (response.status === 404) {
                console.log('📁 Dossier exercices vide ou inexistant');
                showMessage('Le dossier exercices est vide', 'info');
                return [];
            }
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`📁 ${data.length} éléments dans le dossier`);
        
        const validFiles = [];
        
        data.forEach(item => {
            if (item.type === 'file') {
                const type = getFileType(item.name);
                if (type && (type === 'pdf' || type === 'image')) {
                    validFiles.push({
                        id: item.sha,
                        name: item.name,
                        title: formatTitle(item.name),
                        type: type,
                        size: item.size,
                        url: RAW_URL + item.name,
                        download_url: item.download_url || RAW_URL + item.name,
                        github_url: item.html_url
                    });
                    console.log(`✅ ${item.name} (${type}, ${formatSize(item.size)})`);
                } else {
                    console.log(`⏭️ ${item.name} (type non supporté)`);
                }
            }
        });
        
        console.log(`🎉 ${validFiles.length} fichiers réels chargés`);
        return validFiles;
        
    } catch (error) {
        console.error('❌ Erreur GitHub:', error);
        showMessage('Impossible de charger les fichiers depuis GitHub', 'error');
        return []; // Retourner tableau vide au lieu de fichiers démo
    }
}

// ================= GESTION FILTRES =================
function initFilters() {
    console.log('⚙️ Initialisation filtres');
    
    const checkboxes = document.querySelectorAll('.filter-input');
    checkboxes.forEach(checkbox => {
        const type = checkbox.closest('.filter-checkbox').dataset.filter;
        checkbox.checked = activeFilters[type];
        
        // Mettre à jour l'apparence
        updateFilterAppearance(checkbox);
        
        checkbox.addEventListener('change', function() {
            activeFilters[type] = this.checked;
            localStorage.setItem('mathx_exercices_filtres', JSON.stringify(activeFilters));
            updateFilterAppearance(this);
            
            // Refaire la recherche si un terme est saisi
            const searchInput = document.getElementById('exercicesSearchInput');
            if (searchInput && searchInput.value.trim()) {
                searchFiles(searchInput.value.trim());
            }
        });
    });
}

function updateFilterAppearance(checkbox) {
    const label = checkbox.closest('.filter-checkbox');
    if (checkbox.checked) {
        label.classList.add('active');
    } else {
        label.classList.remove('active');
    }
}

// ================= RECHERCHE =================
function setupSearch() {
    console.log('🔍 Configuration recherche');
    
    const searchInput = document.getElementById('exercicesSearchInput');
    if (!searchInput) {
        console.error('❌ Input de recherche introuvable!');
        return;
    }
    
    console.log('✅ Input trouvé:', searchInput);
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        console.log('⌨️ Input:', query);
        
        if (query.length >= 2) {
            searchFiles(query);
        } else if (query.length === 0) {
            showHomeState();
        }
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query.length >= 2) {
                searchFiles(query);
            }
        }
    });
    
    // Focus sur la recherche
    searchInput.focus();
}

function searchFiles(query) {
    console.log('🔎 Recherche:', query);
    
    // Montrer l'état de chargement
    showLoadingState();
    
    // Délai pour éviter trop de requêtes
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300);
}

function performSearch(query) {
    console.log('🔍 Exécution recherche sur', files.length, 'fichiers:', query);
    
    // Vérifier filtres actifs
    const hasActiveFilters = activeFilters.pdf || activeFilters.image;
    if (!hasActiveFilters) {
        showNoResults(query, 'Aucun filtre activé');
        return;
    }
    
    // Filtrer par type
    let filteredFiles = files.filter(file => activeFilters[file.type]);
    
    if (filteredFiles.length === 0) {
        showNoResults(query, 'Aucun fichier correspond aux filtres');
        return;
    }
    
    // Recherche dans le titre et nom
    const searchTerms = query.toLowerCase().split(' ');
    const results = filteredFiles.filter(file => {
        const searchText = (file.title.toLowerCase() + ' ' + file.name.toLowerCase());
        return searchTerms.some(term => searchText.includes(term));
    });
    
    console.log(`📊 ${results.length} résultats trouvés`);
    
    if (results.length > 0) {
        displayResults(results, query);
    } else {
        showNoResults(query, 'Aucun résultat trouvé');
    }
}

// ================= PRÉVISUALISATIONS =================

// Prévisualisation PDF via Google Docs (se déclenche avec "Ouvrir")
function previewPDF(pdfUrl, fileName) {
    console.log('📄 Prévisualisation PDF:', fileName);
    
    // URL Google Docs Viewer
    const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
    
    // Créer la modal
    const modal = document.createElement('div');
    modal.className = 'pdf-preview-modal';
    modal.innerHTML = `
        <div class="pdf-preview-content">
            <div class="pdf-preview-header">
                <h3><i class="fas fa-file-pdf"></i> ${escapeHTML(fileName)}</h3>
                <button class="modal-close" onclick="closePreview()" aria-label="Fermer">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <iframe src="${googleViewerUrl}" 
                    class="pdf-preview-iframe" 
                    title="Prévisualisation PDF: ${escapeHTML(fileName)}"
                    frameborder="0"
                    allowfullscreen>
            </iframe>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Focus pour navigation clavier
    setTimeout(() => {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.focus();
    }, 100);
    
    // Fermer avec Escape
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closePreview();
    });
}

// Prévisualisation Image plein écran (se déclenche avec "Ouvrir")
function previewImage(imageUrl, fileName) {
    console.log('🖼️ Prévisualisation Image:', fileName);
    
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.innerHTML = `
        <div class="image-preview-content">
            <button class="modal-close" onclick="closePreview()" aria-label="Fermer">
                <i class="fas fa-times"></i>
            </button>
            <img src="${escapeHTML(imageUrl)}" 
                 alt="${escapeHTML(fileName)}" 
                 class="modal-image"
                 onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"800\" height=\"600\"><rect width=\"800\" height=\"600\" fill=\"%23f1f5f9\"/><text x=\"50%\" y=\"50%\" font-family=\"Arial\" font-size=\"16\" fill=\"%2364748b\" text-anchor=\"middle\" dy=\".3em\"></text></svg>
            <div class="image-info">
                <h3>${escapeHTML(fileName)}</h3>
                <p>Cliquez en dehors de l'image ou sur la croix pour fermer</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Focus pour navigation clavier
    setTimeout(() => {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.focus();
    }, 100);
    
    // Fermer avec Escape
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closePreview();
    });
    
    // Fermer en cliquant en dehors de l'image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePreview();
        }
    });
}

// Fermer toute prévisualisation
function closePreview() {
    console.log('❌ Fermeture prévisualisation');
    
    const pdfModal = document.querySelector('.pdf-preview-modal');
    const imageModal = document.querySelector('.image-preview-modal');
    
    if (pdfModal) {
        pdfModal.style.opacity = '0';
        setTimeout(() => {
            if (pdfModal.parentNode) {
                pdfModal.remove();
                document.body.style.overflow = '';
            }
        }, 300);
    }
    
    if (imageModal) {
        imageModal.style.opacity = '0';
        setTimeout(() => {
            if (imageModal.parentNode) {
                imageModal.remove();
                document.body.style.overflow = '';
            }
        }, 300);
    }
}

// ================= CRÉATION CARTES =================
function createFileCard(file, index) {
    const div = document.createElement('div');
    div.className = 'exercise-card-ultra';
    div.style.animationDelay = `${index * 0.03}s`;
    
    // Type de fichier
    let typeClass = file.type === 'pdf' ? 'pdf' : 'image';
    
    // Déterminer l'action pour le bouton "Ouvrir"
    let openAction = '';
    if (file.type === 'pdf') {
        openAction = `previewPDF('${escapeHTML(file.url)}', '${escapeHTML(file.name)}')`;
    } else if (file.type === 'image') {
        openAction = `previewImage('${escapeHTML(file.url)}', '${escapeHTML(file.name)}')`;
    }
    
    div.innerHTML = `
        <div class="card-header-ultra">
            <h3 class="card-title-ultra" title="${escapeHTML(file.title)}">
                ${escapeHTML(file.title)}
            </h3>
            <span class="card-type-ultra ${typeClass}">
                ${file.type === 'pdf' ? 'PDF' : 'IMG'}
            </span>
        </div>
        
        <div class="file-info-ultra">
            <div class="info-item-ultra" title="${escapeHTML(file.name)}">
                <i class="fas fa-file-alt"></i>
                <span>${escapeHTML(file.name.substring(0, 18))}${file.name.length > 18 ? '...' : ''}</span>
            </div>
            <div class="info-item-ultra">
                <i class="fas fa-weight-hanging"></i>
                <span>${formatSize(file.size)}</span>
            </div>
        </div>
        
        <div class="card-actions-ultra">
            <button class="action-btn-ultra secondary" 
                    onclick="${openAction}"
                    title="Prévisualiser le fichier">
                <i class="fas fa-eye"></i>
                <span>Ouvrir</span>
            </button>
            <a href="${escapeHTML(file.download_url)}" 
               class="action-btn-ultra primary" 
               download="${escapeHTML(file.name)}"
               title="Télécharger le fichier">
                <i class="fas fa-download"></i>
                <span>Télécharger</span>
            </a>
        </div>
    `;
    
    return div;
}

// ================= AFFICHAGE RÉSULTATS =================
function displayResults(results, query) {
    console.log('📋 Affichage résultats:', results.length);
    
    const container = document.getElementById('resultsContainer');
    const welcome = document.getElementById('welcomeState');
    const noResults = document.getElementById('noResultsState');
    const loading = document.getElementById('searchingState');
    
    // Cacher autres états
    if (welcome) welcome.style.display = 'none';
    if (noResults) noResults.style.display = 'none';
    if (loading) loading.style.display = 'none';
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Si aucun résultat
    if (results.length === 0) {
        showNoResults(query, 'Aucun résultat trouvé');
        return;
    }
    
    // Ajouter en-tête
    const header = document.createElement('div');
    header.className = 'results-header';
    header.innerHTML = `
        <div style="
            text-align: center;
            padding: 12px;
            background: rgba(6, 182, 212, 0.08);
            border-radius: 8px;
            margin-bottom: 15px;
            color: var(--text-dark);
            border: 1px solid rgba(6, 182, 212, 0.15);
        ">
            <h3 style="margin-bottom: 5px; font-size: 1rem;">${results.length} résultat${results.length > 1 ? 's' : ''}</h3>
            <p style="color: var(--text-light); font-size: 0.9rem;">Recherche : <strong>"${escapeHTML(query)}"</strong></p>
        </div>
    `;
    container.appendChild(header);
    
    // Ajouter chaque résultat
    results.forEach((file, index) => {
        const card = createFileCard(file, index);
        container.appendChild(card);
    });
    
    // Afficher le conteneur
    container.style.display = 'grid';
}

// ================= GESTION DES ÉTATS UI =================
function showHomeState() {
    console.log('🏠 Affichage état accueil');
    
    const welcome = document.getElementById('welcomeState');
    const noResults = document.getElementById('noResultsState');
    const loading = document.getElementById('searchingState');
    const container = document.getElementById('resultsContainer');
    
    if (welcome) welcome.style.display = 'block';
    if (noResults) noResults.style.display = 'none';
    if (loading) loading.style.display = 'none';
    if (container) container.style.display = 'none';
}

function showLoadingState() {
    console.log('⏳ Affichage état chargement');
    
    const welcome = document.getElementById('welcomeState');
    const noResults = document.getElementById('noResultsState');
    const loading = document.getElementById('searchingState');
    const container = document.getElementById('resultsContainer');
    
    if (welcome) welcome.style.display = 'none';
    if (noResults) noResults.style.display = 'none';
    if (loading) loading.style.display = 'flex';
    if (container) container.style.display = 'none';
}

function showNoResults(query, message) {
    console.log('❌ Affichage aucun résultat:', message);
    
    const welcome = document.getElementById('welcomeState');
    const noResults = document.getElementById('noResultsState');
    const loading = document.getElementById('searchingState');
    const container = document.getElementById('resultsContainer');
    
    if (welcome) welcome.style.display = 'none';
    if (loading) loading.style.display = 'none';
    if (container) container.style.display = 'none';
    
    if (noResults) {
        noResults.style.display = 'block';
        noResults.querySelector('h3').textContent = message;
        noResults.querySelector('p').innerHTML = 
            `Recherche : <strong>"${escapeHTML(query)}"</strong>`;
    }
}

// ================= ACCUEIL =================
function updateWelcomeStats(fileCount) {
    const welcomeState = document.getElementById('welcomeState');
    if (!welcomeState) return;
    
    if (fileCount === 0) {
        welcomeState.innerHTML = `
            <div class="welcome-icon">
                <i class="fas fa-folder-open"></i>
            </div>
            <h1>Centre d'Exercices <span class="site-name">mathX</span></h1>
            <p class="welcome-subtitle">Le dossier exercices est vide</p>
            
            <div class="welcome-tips">
                <div class="tip">
                    <i class="fas fa-github"></i>
                    <span>Ajoutez des fichiers PDF/images dans le dossier exercices</span>
                </div>
                <div class="tip">
                    <i class="fas fa-upload"></i>
                    <span>Poussez vos fichiers sur GitHub</span>
                </div>
                <div class="tip">
                    <i class="fas fa-sync-alt"></i>
                    <span>Actualisez la page après avoir ajouté des fichiers</span>
                </div>
            </div>
            
            <div class="welcome-actions">
                <a href="https://github.com/${GITHUB_CONFIG.USER}/${GITHUB_CONFIG.REPO}/tree/main/exercices" 
                   class="welcome-btn primary" 
                   target="_blank">
                    <i class="fab fa-github"></i> Voir sur GitHub
                </a>
                <button class="welcome-btn secondary" onclick="refreshExercices()">
                    <i class="fas fa-sync-alt"></i> Actualiser
                </button>
            </div>
        `;
    } else {
        welcomeState.innerHTML = `
            <div class="welcome-icon">
                <i class="fas fa-pen-to-square"></i>
            </div>
            <h1>Centre d'Exercices <span class="site-name">mathX</span></h1>
            <p class="welcome-subtitle">Accédez à ${fileCount} exercices et ressources</p>
            
            <div class="welcome-stats">
                <div class="stat-item">
                    <span class="stat-number">${fileCount}</span>
                    <span class="stat-label">Fichiers</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${files.filter(f => f.type === 'pdf').length}</span>
                    <span class="stat-label">PDF</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${files.filter(f => f.type === 'image').length}</span>
                    <span class="stat-label">Images</span>
                </div>
            </div>
            
            <div class="welcome-tips">
                <div class="tip">
                    <i class="fas fa-search"></i>
                    <span>Recherchez des exercices par mot-clé</span>
                </div>
                <div class="tip">
                    <i class="fas fa-eye"></i>
                    <span>Cliquez sur "Ouvrir" pour prévisualiser</span>
                </div>
                <div class="tip">
                    <i class="fas fa-download"></i>
                    <span>Téléchargez gratuitement</span>
                </div>
            </div>
            
            <div class="welcome-actions">
                <button class="welcome-btn primary" onclick="document.getElementById('exercicesSearchInput').focus()">
                    <i class="fas fa-search"></i> Rechercher
                </button>
                <button class="welcome-btn secondary" onclick="refreshExercices()">
                    <i class="fas fa-sync-alt"></i> Actualiser
                </button>
            </div>
        `;
    }
}

// ================= MESSAGES =================
function showMessage(text, type = 'info') {
    console.log(`💬 ${type}:`, text);
    
    // Créer un élément de message simple
    const message = document.createElement('div');
    message.textContent = text;
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        font-weight: 500;
        font-size: 0.9rem;
    `;
    
    document.body.appendChild(message);
    
    // Auto-suppression
    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => message.remove(), 300);
    }, 3000);
    
    // Ajouter animations si nécessaire
    if (!document.querySelector('#message-anim')) {
        const style = document.createElement('style');
        style.id = 'message-anim';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ================= DÉMARRAGE =================
async function main() {
    console.log('🚀 Démarrage application exercices');
    
    // Vérifier que les éléments HTML existent
    const requiredElements = [
        'exercicesSearchInput',
        'resultsContainer',
        'welcomeState',
        'noResultsState',
        'searchingState'
    ];
    
    const missing = requiredElements.filter(id => !document.getElementById(id));
    if (missing.length > 0) {
        console.error('❌ Éléments manquants:', missing);
        showMessage('Erreur: éléments HTML manquants', 'error');
        return;
    }
    
    console.log('✅ Tous les éléments HTML sont présents');
    
    try {
        // 1. Initialiser les filtres
        initFilters();
        
        // 2. Charger les VRAIS fichiers depuis GitHub
        files = await loadRealFiles();
        
        // 3. Mettre à jour l'accueil avec stats réelles
        updateWelcomeStats(files.length);
        
        // 4. Afficher l'état initial
        showHomeState();
        
        // 5. Configurer la recherche
        setupSearch();
        
        console.log('✅ Application prête avec', files.length, 'fichiers réels');
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        showMessage('Erreur de chargement: ' + error.message, 'error');
        
        // En cas d'erreur, montrer état vide
        files = [];
        updateWelcomeStats(0);
        showHomeState();
        setupSearch();
    }
}

// ================= EXPORT =================
window.previewPDF = previewPDF;
window.previewImage = previewImage;
window.closePreview = closePreview;

// Actualiser les exercices
window.refreshExercices = async function() {
    showMessage('Actualisation en cours...', 'info');
    files = await loadRealFiles();
    updateWelcomeStats(files.length);
    
    // Si recherche active, relancer
    const searchInput = document.getElementById('exercicesSearchInput');
    if (searchInput && searchInput.value.trim()) {
        searchFiles(searchInput.value.trim());
    } else {
        showHomeState();
    }
    
    if (files.length > 0) {
        showMessage(`${files.length} fichiers chargés`, 'success');
    }
};

// ================= DÉMARRAGE AUTOMATIQUE =================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Lancement main()');
    main();
});

console.log('✨ exercices.js - CHARGÉ ET PRÊT');