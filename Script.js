// Gestion du menu hamburger
const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeBtn");

function openSidebar() {
  sidebar.classList.add("active");
  overlay.classList.add("active");
  hamburger.classList.add("active");
}

function closeSidebar() {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
  hamburger.classList.remove("active");
}

hamburger.addEventListener("click", openSidebar);
closeBtn.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);

// Index des fichiers (avec cache localStorage)
let fileIndex = JSON.parse(localStorage.getItem('premiumFiles')) || [];

// Charger les fichiers depuis GitHub (avec fix CORS et cache)
async function loadFilesFromGitHub() {
  const loadingMessage = document.getElementById('loading-message');
  loadingMessage.textContent = 'Connexion sécurisée aux fichiers Premium...';

  try {
    // Fix CORS : Ajout header GitHub v3
    const response = await fetch('https://api.github.com/repos/ivanipote/premium_search/contents/premium_files', {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP \( {response.status}: \){response.statusText}. Vérifiez le dossier 'premium_files' sur GitHub.`);
    }

    const files = await response.json();

    // Construction de l'index avec preview améliorée
    fileIndex = files.map(file => ({
      name: file.name,
      path: file.download_url,  // Utilise directement download_url (raw GitHub)
      type: file.name.split('.').pop().toLowerCase(),
      size: file.size,
      githubUrl: `https://github.com/ivanipote/premium_search/blob/main/premium_files/${encodeURIComponent(file.name)}`
    }));

    // Cache en localStorage pour accélérer
    localStorage.setItem('premiumFiles', JSON.stringify(fileIndex));

    loadingMessage.innerHTML = `<i class="fas fa-check-circle"></i> ${fileIndex.length} fichiers Premium chargés ! Recherchez ci-dessus.`;
    loadingMessage.style.color = "#28a745";  // Vert succès
    console.log('Fichiers Premium chargés:', fileIndex);

  } catch (error) {
    console.error('Erreur chargement Premium:', error);
    loadingMessage.innerHTML = `<div style="color: #dc3545; font-weight: bold;">❌ Erreur Premium : ${error.message}<br><small>Console: F12 pour détails. Vérifiez GitHub.</small></div>`;
    
    // Fallback : Essaie de recharger depuis cache
    if (fileIndex.length === 0 && localStorage.getItem('premiumFiles')) {
      fileIndex = JSON.parse(localStorage.getItem('premiumFiles'));
      loadingMessage.innerHTML += `<br><small>Utilisation cache local (${fileIndex.length} fichiers).</small>`;
    }
  }
}

// Fonction de recherche améliorée
function performSearch(query) {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';

  if (!query.trim()) {
    resultsContainer.innerHTML = '<div class="loading">Commencez à taper pour chercher dans les fichiers Premium...</div>';
    return;
  }

  const terms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  const matches = fileIndex.filter(file => 
    terms.some(term => 
      file.name.toLowerCase().includes(term) || 
      file.type.toLowerCase().includes(term)
    )
  );

  if (matches.length === 0) {
    resultsContainer.innerHTML = `<div class="loading">Aucun résultat Premium pour "<strong>${query}</strong>". Essayez d'autres mots-clés.</div>`;
    return;
  }

  // Affichage du nombre de résultats
  const resultsCount = document.createElement('div');
  resultsCount.style.cssText = 'text-align: center; color: #0066FF; margin-bottom: 30px; font-size: 1.2rem; font-weight: bold;';
  resultsCount.innerHTML = `<i class="fas fa-star"></i> \( {matches.length} résultat(s) Premium trouvé(s) pour " \){query}"`;
  resultsContainer.appendChild(resultsCount);

  // Affichage des résultats avec icônes et badge Premium
  matches.forEach(file => {
    const item = document.createElement('div');
    item.className = 'result-item';
    
    // Icônes améliorées avec emoji
    let fileIcon = '📁';
    if (file.type === 'pdf') fileIcon = '📄';
    else if (['jpg', 'jpeg', 'png', 'gif'].includes(file.type)) fileIcon = '🖼️';
    else if (['mp3', 'wav'].includes(file.type)) fileIcon = '🎵';
    else if (['apk', 'zip'].includes(file.type)) fileIcon = '📦';
    
    const sizeKB = (file.size / 1024).toFixed(1);
    
    item.innerHTML = `
      <h3>\( {fileIcon} \){file.name}</h3>
      <div class="file-info">
        <strong>Type:</strong> ${file.type.toUpperCase()} • 
        <strong>Taille:</strong> ${sizeKB} KB • 
        <span style="color: gold; font-weight: bold;">Premium</span>
      </div>
      <div class="file-preview" style="color: #666; font-style: italic; margin: 10px 0;">
        Fichier premium exclusif – Téléchargement direct et sécurisé.
      </div>
      <div style="margin-top: 15px;">
        <a href="${file.path}" 
           download="${file.name}" 
           class="btn-download" 
           style="background: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin-right: 10px; font-weight: bold;">
          <i class="fas fa-download"></i> Télécharger Premium
        </a>
        <a href="${file.githubUrl}" 
           target="_blank" 
           class="btn-github" 
           style="background: #333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold;">
          <i class="fab fa-github"></i> Voir sur GitHub
        </a>
      </div>
    `;
    resultsContainer.appendChild(item);
  });
}

// Événements de recherche
document.addEventListener('DOMContentLoaded', function() {
  loadFilesFromGitHub();  // Charge au démarrage

  const searchButton = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');

  searchButton.addEventListener('click', () => {
    performSearch(searchInput.value);
  });

  searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      performSearch(searchInput.value);
    }
  });

  // Recherche live (optimisée)
  let searchTimeout;
  searchInput.addEventListener('input', e => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    if (query.length >= 2) {
      searchTimeout = setTimeout(() => performSearch(query), 300);  // Plus rapide
    } else if (query.length === 0) {
      document.getElementById('search-results').innerHTML = '<div class="loading">Recherche Premium prête – Tapez au moins 2 caractères.</div>';
    }
  });
});

// Option : Recharger manuellement si besoin (ex: bouton debug)
window.reloadPremiumFiles = loadFilesFromGitHub;  // Appelle ça en console si bug
