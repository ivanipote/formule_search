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
}

// =============================================
// PRÉVISUALISATION DES FICHIERS
// =============================================
FileManager.prototype.previewFile = function(url, type, filename) {
    switch(type) {
        case 'PDF':
            this.openPDF(url);
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

// PDF - Ouverture externe dans le lecteur du navigateur
FileManager.prototype.openPDF = function(url) {
    window.open(url, '_blank');
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
    }

    displayResults(files, query) {
        if (!query) {
            this.resultsContainer.innerHTML = '<p class="no-results">Tapez quelque chose pour rechercher...</p>';
            return;
        }

        if (files.length === 0) {
            this.resultsContainer.innerHTML = `<p class="no-results">Aucun résultat pour "${query}"</p>`;
            return;
        }

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