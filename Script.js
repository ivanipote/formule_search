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

// Index des fichiers
let fileIndex = [];

// Charger les fichiers depuis le dossier premium (à créer sur GitHub)
async function loadFilesFromGitHub() {
  const loadingMessage = document.getElementById('loading-message');
  
  try {
    const response = await fetch('https://api.github.com/repos/ivanipote/premium_search/contents/premium_files');
    if (!response.ok) throw new Error("Dossier premium non trouvé");

    const files = await response.json();

    fileIndex = files.map(file => ({
      name: file.name,
      path: `https://raw.githubusercontent.com/ivanipote/premium_search/main/premium_files/${file.name}`,
      type: file.name.split('.').pop().toLowerCase(),
      size: file.size,
      githubUrl: file.html_url
    }));

    loadingMessage.textContent = "Prêt ! Tapez votre recherche ci-dessus.";
    loadingMessage.style.color = "#0066FF";

  } catch (error) {
    loadingMessage.innerHTML = `<div style="color:red;">Erreur Premium : ${error.message}</div>`;
  }
}

// Recherche
function performSearch(query) {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';

  if (!query.trim()) {
    resultsContainer.innerHTML = '<div class="loading">Commencez à taper pour chercher...</div>';
    return;
  }

  const terms = query.toLowerCase().split(' ');
  const matches = fileIndex.filter(file => 
    terms.some(term => file.name.toLowerCase().includes(term))
  );

  if (matches.length === 0) {
    resultsContainer.innerHTML = `<div class="loading">Aucun résultat pour "<strong>${query}</strong>"</div>`;
    return;
  }

  matches.forEach(file => {
    const item = document.createElement('div');
    item.className = 'result-item';
    const icon = file.type === 'pdf' ? 'PDF' : file.type === 'mp3' ? 'Music' : 'File';
    
    item.innerHTML = `
      <h3>\( {icon} \){file.name}</h3>
      <p><strong>Type:</strong> \( {file.type.toUpperCase()} • <strong>Taille:</strong> \){(file.size/1024).toFixed(1)} KB</p>
      <div style="margin-top:15px;">
        <a href="${file.path}" download class="btn-download">Télécharger Premium</a>
        <a href="${file.githubUrl}" target="_blank" class="btn-github">Voir sur GitHub</a>
      </div>
    `;
    resultsContainer.appendChild(item);
  });
}

// Événements
document.getElementById('search-button').addEventListener('click', () => {
  performSearch(document.getElementById('search-input').value);
});

document.getElementById('search-input').addEventListener('keypress', e => {
  if (e.key === 'Enter') performSearch(e.target.value);
});

let timeout;
document.getElementById('search-input').addEventListener('input', e => {
  clearTimeout(timeout);
  const query = e.target.value;
  if (query.length >= 2) {
    timeout = setTimeout(() => performSearch(query), 400);
  }
});

// Init
document.addEventListener('DOMContentLoaded', loadFilesFromGitHub);
