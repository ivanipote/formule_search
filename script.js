// =============================================
// CONFIGURATION GLOBALE
// =============================================
const CONFIG = {
    GITHUB_REPO: 'ivanipote/premium_search',
    FILES_FOLDER: 'files',
    RAW_BASE_URL: 'https://raw.githubusercontent.com/ivanipote/premium_search/main/files/'
};

// =============================================
// NAVIGATION GLOBALE
// =============================================
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const mainHeader = document.querySelector('.main-header');
const searchBar = document.getElementById('searchBar');
const pageTitle = document.querySelector('.page-title');
const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
const navItems = document.querySelectorAll('.nav-item');

// Initialisation de la navigation
function initNavigation() {
    // Ouvrir/fermer le sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            toggleHeaderElements();
        });
    }

    // Fermer le sidebar en cliquant sur l'overlay
    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            showHeaderElements();
        });
    }

    // Navigation du sidebar
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('href');
            if (targetPage && !targetPage.startsWith('#')) {
                window.location.href = targetPage;
            }
        });
    });

    // Navigation du bas
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('href');
            if (targetPage && !targetPage.startsWith('#')) {
                window.location.href = targetPage;
            }
        });
    });
}

function toggleHeaderElements() {
    const elementsToHide = [mainHeader, searchBar, pageTitle];
    elementsToHide.forEach(element => {
        if (element) {
            if (sidebar.classList.contains('active')) {
                element.style.opacity = '0';
                element.style.visibility = 'hidden';
            } else {
                element.style.opacity = '1';
                element.style.visibility = 'visible';
            }
        }
    });
}

function showHeaderElements() {
    const elementsToShow = [mainHeader, searchBar, pageTitle];
    elementsToShow.forEach(element => {
        if (element) {
            element.style.opacity = '1';
            element.style.visibility = 'visible';
        }
    });
}

// =============================================
// GESTIONNAIRE DE FICHIERS AVEC SÉLECTION
// =============================================
class FileManager {
    constructor() {
        this.files = [];
        this.selectedFile = null;
        this.init();
    }

    async init() {
        await this.scanGitHubFiles();
        this.detectPageAndInit();
        this.initFileSelection();
        this.updateStats();
    }

    // Scan automatique du dossier GitHub
    async scanGitHubFiles() {
        try {
            const apiUrl = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/${CONFIG.FILES_FOLDER}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) throw new Error('Erreur GitHub API');
            
            const data = await response.json();
            this.files = data
                .filter(item => item.type === 'file')
                .map(file => ({
                    name: file.name,
                    type: this.getFileType(file.name),
                    size: file.size,
                    downloadUrl: file.download_url,
                    rawUrl: `${CONFIG.RAW_BASE_URL}${file.name}`,
                    lastModified: new Date().toLocaleDateString('fr-FR')
                }));
            
            console.log(`${this.files.length} fichiers chargés`);
        } catch (error) {
            console.error('Erreur scan GitHub:', error);
            // Fallback: fichiers de test
            this.files = this.getTestFiles();
        }
    }

    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'pdf': 'PDF',
            'jpg': 'Image', 'jpeg': 'Image', 'png': 'Image', 'gif': 'Image', 'webp': 'Image',
            'mp3': 'Audio', 'wav': 'Audio', 'ogg': 'Audio',
            'mp4': 'Vidéo', 'avi': 'Vidéo', 'mov': 'Vidéo',
            'apk': 'Application',
            'txt': 'Texte', 'doc': 'Document', 'docx': 'Document'
        };
        return types[ext] || 'Fichier';
    }

    getFileIcon(type) {
        const icons = {
            'PDF': '📄',
            'Image': '🖼️',
            'Audio': '🎵',
            'Vidéo': '🎬',
            'Application': '📱',
            'Document': '📝',
            'Fichier': '📎'
        };
        return icons[type] || '📎';
    }

    searchFiles(query) {
        if (!query) return [];
        return this.files.filter(file => 
            file.name.toLowerCase().includes(query.toLowerCase())
        );
    }

    getTestFiles() {
        return [
            {
                name: "document.pdf",
                type: "PDF",
                size: 1024000,
                rawUrl: "#",
                lastModified: "30/11/2024"
            },
            {
                name: "image.jpg",
                type: "Image", 
                size: 512000,
                rawUrl: "#",
                lastModified: "29/11/2024"
            },
            {
                name: "musique.mp3",
                type: "Audio",
                size: 2048000,
                rawUrl: "#", 
                lastModified: "28/11/2024"
            },
            {
                name: "fichier.txt",
                type: "Texte",
                size: 1024,
                rawUrl: "#",
                lastModified: "27/11/2024"
            },
            {
                name: "app.apk",
                type: "Application",
                size: 5120000,
                rawUrl: "#",
                lastModified: "26/11/2024"
            }
        ];
    }

    // Sélection de fichier
    initFileSelection() {
        document.addEventListener('click', (e) => {
            const fileCard = e.target.closest('.file-card');
            if (fileCard && !e.target.closest('.file-actions')) {
                this.selectFile(fileCard);
            }
        });
    }

    selectFile(fileCard) {
        // Désélectionner précédent
        if (this.selectedFile) {
            this.selectedFile.classList.remove('selected');
        }
        
        // Sélectionner nouveau
        fileCard.classList.add('selected');
        this.selectedFile = fileCard;
        
        console.log('Fichier sélectionné:', fileCard.querySelector('.file-name').textContent);
    }

    // Méthodes professionnelles
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    updateStats(resultsCount = 0) {
        const totalFiles = document.getElementById('totalFiles');
        const searchResults = document.getElementById('searchResults');
        const lastUpdate = document.getElementById('lastUpdate');
        
        if (totalFiles) totalFiles.textContent = this.files.length;
        if (searchResults) searchResults.textContent = resultsCount;
        if (lastUpdate) lastUpdate.textContent = new Date().toLocaleDateString('fr-FR');
    }
}

// =============================================
// PRÉVISUALISATION DES FICHIERS - PDF CORRIGÉ
// =============================================
FileManager.prototype.previewFile = function(url, type, filename) {
    switch(type) {
        case 'PDF':
            this.openPDF(url, filename);
            break;
        case 'Audio':
            this.previewAudio(url, filename);
            break;
        case 'Image':
            this.previewImage(url, filename);
            break;
        default:
            this.downloadFile(url, filename);
    }
};

// PDF - Ouverture avec Google Viewer
FileManager.prototype.openPDF = function(url, filename) {
    const modal = this.createModal();
    
    // Message de chargement
    modal.innerHTML = `
        <div class="preview-content pdf-preview">
            <div class="pdf-header">
                <h3>📖 ${filename}</h3>
                <button class="btn btn-secondary" onclick="fileManager.downloadFile('${url}', '${filename}')">
                    📥 Télécharger
                </button>
            </div>
            <div class="pdf-loading">
                <div class="loading-spinner"></div>
                <p>Chargement du PDF...</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Essayer Google Viewer
    const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    
    // Créer l'iframe après un petit délai
    setTimeout(() => {
        const iframe = document.createElement('iframe');
        iframe.src = googleViewerUrl;
        iframe.width = '100%';
        iframe.height = '600px';
        iframe.frameBorder = '0';
        iframe.style.borderRadius = '10px';
        iframe.onload = () => {
            // Cacher le loading
            const loading = modal.querySelector('.pdf-loading');
            if (loading) loading.style.display = 'none';
        };
        iframe.onerror = () => {
            // Fallback: ouvrir dans nouvel onglet
            this.fallbackPDF(url, filename, modal);
        };

        const pdfContainer = document.createElement('div');
        pdfContainer.className = 'pdf-container';
        pdfContainer.appendChild(iframe);
        
        modal.querySelector('.preview-content').appendChild(pdfContainer);
        
        // Ajouter les actions
        const actions = document.createElement('div');
        actions.className = 'pdf-actions';
        actions.innerHTML = `
            <button class="btn btn-primary" onclick="fileManager.downloadFile('${url}', '${filename}')">
                📥 Télécharger le PDF
            </button>
            <button class="btn btn-secondary" onclick="this.closest('.preview-modal').remove()">
                Fermer
            </button>
        `;
        modal.querySelector('.preview-content').appendChild(actions);
    }, 500);
};

// Fallback si Google Viewer échoue
FileManager.prototype.fallbackPDF = function(url, filename, modal) {
    const content = modal.querySelector('.preview-content');
    content.innerHTML = `
        <div class="preview-content">
            <div class="pdf-header">
                <h3>📖 ${filename}</h3>
            </div>
            <div class="pdf-alternative">
                <div class="icon">📄</div>
                <h3>PDF non visualisable</h3>
                <p>Le PDF ne peut pas être affiché directement.</p>
                <p>Vous pouvez le télécharger pour le visualiser.</p>
            </div>
            <div class="pdf-actions">
                <button class="btn btn-primary" onclick="fileManager.downloadFile('${url}', '${filename}')">
                    📥 Télécharger le PDF
                </button>
                <button class="btn btn-secondary" onclick="window.open('${url}', '_blank')">
                    Ouvrir dans un nouvel onglet
                </button>
                <button class="btn btn-secondary" onclick="this.closest('.preview-modal').remove()">
                    Fermer
                </button>
            </div>
        </div>
    `;
};

// Audio - Prévisualisation avec lecteur
FileManager.prototype.previewAudio = function(url, filename) {
    const modal = this.createModal();
    modal.innerHTML = `
        <div class="preview-content">
            <h3 style="margin-bottom: 20px;">🎵 ${filename}</h3>
            <div class="audio-player">
                <audio controls style="width: 300px;">
                    <source src="${url}" type="audio/mpeg">
                    Votre navigateur ne supporte pas l'audio.
                </audio>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="fileManager.downloadFile('${url}', '${filename}')">
                    📥 Télécharger
                </button>
                <button class="btn btn-secondary" onclick="this.closest('.preview-modal').remove()">
                    Fermer
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// Image - Prévisualisation normale
FileManager.prototype.previewImage = function(url, filename) {
    const modal = this.createModal();
    modal.innerHTML = `
        <div class="preview-content">
            <img src="${url}" alt="Preview" style="max-width: 90vw; max-height: 70vh; border-radius: 10px;">
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="fileManager.downloadFile('${url}', '${filename}')">
                    📥 Télécharger
                </button>
                <button class="btn btn-secondary" onclick="this.closest('.preview-modal').remove()">
                    Fermer
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

FileManager.prototype.createModal = function() {
    const modal = document.createElement('div');
    modal.className = 'preview-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
    `;
    return modal;
};

FileManager.prototype.downloadFile = function(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
};

// =============================================
// SYSTÈME DE RECHERCHE (index.html)
// =============================================
class SearchSystem {
    constructor(fileManager) {
        this.fileManager = fileManager;
        this.searchInput = document.getElementById('searchInput');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.lastResults = 0;
        this.init();
    }

    init() {
        if (this.searchInput && this.resultsContainer) {
            this.searchInput.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });
        }
    }

    performSearch(query) {
        const results = this.fileManager.searchFiles(query);
        this.displayResults(results, query);
        this.fileManager.updateStats(results.length);
    }

    displayResults(files, query) {
        if (!query) {
            this.resultsContainer.innerHTML = '<p class="no-results">Tapez quelque chose pour rechercher...</p>';
            this.lastResults = 0;
            return;
        }

        if (files.length === 0) {
            this.resultsContainer.innerHTML = `<p class="no-results">Aucun résultat pour "${query}"</p>`;
            this.lastResults = 0;
            return;
        }

        this.lastResults = files.length;
        this.resultsContainer.innerHTML = files.map(file => {
            const isPDF = file.type === 'PDF';
            const isAudio = file.type === 'Audio';
            
            return `
                <div class="file-card" data-type="${file.type}">
                    <div class="file-header">
                        <div class="file-icon">${this.fileManager.getFileIcon(file.type)}</div>
                        <div class="file-info">
                            <div class="file-name">${file.name}</div>
                            <div class="file-type">${file.type} • ${this.formatSize(file.size)}</div>
                            <div class="file-date">Ajouté le ${file.lastModified}</div>
                        </div>
                    </div>
                    <div class="file-actions ${isAudio ? 'file-actions-compact' : ''}">
                        ${isAudio ? `
                            <button class="btn-play" onclick="fileManager.previewFile('${file.rawUrl}', '${file.type}', '${file.name}')">
                                ▶
                            </button>
                            <button class="btn btn-primary" onclick="fileManager.downloadFile('${file.rawUrl}', '${file.name}')">
                                📥 Télécharger
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="fileManager.previewFile('${file.rawUrl}', '${file.type}', '${file.name}')">
                                ${isPDF ? '📖 Ouvrir' : '👁️ Ouvrir'}
                            </button>
                            ${!isPDF ? `
                                <button class="btn btn-secondary" onclick="fileManager.downloadFile('${file.rawUrl}', '${file.name}')">
                                    📥 Télécharger
                                </button>
                            ` : ''}
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    formatSize(bytes) {
        if (!bytes) return 'Taille inconnue';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// =============================================
// SYSTÈME DOSSIER (dossier.html) - VERSION INTELLIGENTE
// =============================================
class DossierSystem {
    constructor(fileManager) {
        this.fileManager = fileManager;
        this.filesContainer = document.getElementById('filesContainer');
        this.init();
    }

    init() {
        if (this.filesContainer) {
            this.displayAllFiles();
            this.initFilters();
        }
    }

    displayAllFiles() {
        if (this.fileManager.files.length === 0) {
            this.filesContainer.innerHTML = '<p class="no-results">Aucun fichier trouvé</p>';
            return;
        }

               // UN SEUL RECTANGLE qui contient toutes les cartes avec passage automatique à la ligne
        this.filesContainer.innerHTML = `
            <div class="file-row">
                ${this.fileManager.files.map(file => {
                    const isPDF = file.type === 'PDF';
                    const isAudio = file.type === 'Audio';
                    
                    return `
                        <div class="file-card" data-type="${file.type}">
                            <div class="file-header">
                                <div class="file-icon">${this.fileManager.getFileIcon(file.type)}</div>
                                <div class="file-info">
                                    <div class="file-name">${file.name}</div>
                                    <div class="file-type">${file.type} • ${this.formatSize(file.size)}</div>
                                    <div class="file-date">Ajouté le ${file.lastModified}</div>
                                </div>
                            </div>
                            <div class="file-actions ${isAudio ? 'file-actions-compact' : ''}">
                                ${isAudio ? `
                                    <button class="btn-play" onclick="fileManager.previewFile('${file.rawUrl}', '${file.type}', '${file.name}')">
                                        ▶
                                    </button>
                                    <button class="btn btn-primary" onclick="fileManager.downloadFile('${file.rawUrl}', '${file.name}')">
                                        📥 Télécharger
                                    </button>
                                ` : `
                                    <button class="btn btn-primary" onclick="fileManager.previewFile('${file.rawUrl}', '${file.type}', '${file.name}')">
                                        ${isPDF ? '📖 Ouvrir' : '👁️ Ouvrir'}
                                    </button>
                                `}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    initFilters() {
        const filterButtons = document.querySelectorAll('.btn-filter');
        const sortSelect = document.getElementById('sortSelect');
        
        if (filterButtons.length > 0) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.filterFiles(btn.dataset.filter);
                });
            });
        }
        
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.sortFiles(sortSelect.value);
            });
        }
    }

    filterFiles(filter) {
        // Implémentation basique du filtrage
        console.log('Filtrer par:', filter);
        this.fileManager.showToast(`Filtre appliqué: ${filter}`);
    }

    sortFiles(criteria) {
        // Implémentation basique du tri
        console.log('Trier par:', criteria);
        this.fileManager.showToast(`Tri appliqué: ${criteria}`);
    }

    formatSize(bytes) {
        if (!bytes) return 'Taille inconnue';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// =============================================
// DÉTECTION DE PAGE ET INITIALISATION
// =============================================
FileManager.prototype.detectPageAndInit = function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'index.html' || currentPage === '') {
        this.searchSystem = new SearchSystem(this);
    } else if (currentPage === 'dossier.html') {
        this.dossierSystem = new DossierSystem(this);
    }
};

// =============================================
// INITIALISATION AU CHARGEMENT
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    // Animation d'entrée
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

    // Initialisation des systèmes
    initNavigation();
    window.fileManager = new FileManager();
});
{}         