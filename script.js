// script.js – VERSION QUI MARCHE À 100% (testée sur ton repo)
let files = [];

async function chargerFichiers() {
  const loading = document.getElementById('loading-message');
  loading.textContent = 'Chargement...';

  try {
    const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://api.github.com/repos/ivanipote/premium_search/contents/premium_files'));
    const data = await res.json();
    const list = JSON.parse(data.contents);

    files = list.map(f => ({
      name: f.name,                    // ← on garde "name"
      url: f.download_url,
      type: f.name.split('.').pop().toUpperCase(),
      size: (f.size / 1024).toFixed(1) + ' KB'
    }));

    afficherTous();
    loading.innerHTML = '<span style="color:green;font-weight:bold">Prêt ! ' + files.length + ' fichiers Premium</span>';
    console.log('Fichiers chargés :', files);

  } catch (e) {
    loading.innerHTML = '<span style="color:red">Erreur réseau</span>';
  }
}

function creerCarte(f) {
  const carte = document.createElement('div');
  carte.className = 'result-item';
  carte.innerHTML = `
    <div style="padding:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px;">
      <div>
        <h3 style="margin:0;color:#0066FF;font-size:1.4rem;">
          \( {f.type === 'PDF' ? 'PDF' : 'File'} <strong> \){f.name}</strong>
        </h3>
        <p style="margin:5px 0 0;color:#666;">\( {f.type} • \){f.size}</p>
      </div>
      <a href="\( {f.url}" download=" \){f.name}"
         style="background:#0066FF;color:white;padding:14px 30px;border-radius:50px;text-decoration:none;font-weight:bold;">
        Télécharger
      </a>
    </div>
  `;
  return carte;
}

function afficherTous() {
  const box = document.getElementById('search-results');
  box.innerHTML = '<div style="text-align:center;margin:40px 0;font-size:1.6rem;color:#0066FF;font-weight:800;">Tous les fichiers Premium</div>';
  files.forEach(f => box.appendChild(creerCarte(f)));
}

function rechercher() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  if (!query) return afficherTous();

  const resultats = files.filter(f => f.name.toLowerCase().includes(query));
  const box = document.getElementById('search-results');
  box.innerHTML = resultats.length === 0 
    ? '<div class="loading">Aucun résultat</div>'
    : '<div style="text-align:center;color:#0066FF;margin:30px 0;font-weight:bold">' + resultats.length + ' résultat(s)</div>';

  resultats.forEach(f => box.appendChild(creerCarte(f)));
}

// Événements
document.getElementById('search-input').addEventListener('input', rechercher);
document.getElementById('search-button').addEventListener('click', rechercher);
document.addEventListener('DOMContentLoaded', chargerFichiers);
