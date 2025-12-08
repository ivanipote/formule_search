/**
 * profil.js - Version refaite avec sidebar fonctionnelle
 */

// Variable pour suivre l'état de la sidebar
let sidebarOpen = false;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 Chargement de la page profil...');
    initProfil();
});

async function initProfil() {
    try {
        // 1. Vérifier l'authentification
        const user = await getCurrentUser();
        
        if (!user) {
            redirectToAuth();
            return;
        }
        
        console.log('✅ Utilisateur connecté:', user.email);
        
        // 2. Afficher les données du profil
        await displayProfile(user);
        
        // 3. Initialiser la sidebar (APRÈS le chargement du DOM)
        initSidebar();
        
        // 4. Configurer le bouton déconnexion
        setupLogoutButton();
        
        // 5. Mettre à jour la date de connexion
        updateLoginTime();
        
    } catch (error) {
        console.error('❌ Erreur initialisation profil:', error);
        showMessage('Erreur de chargement du profil', 'error');
    }
}

// Récupérer l'utilisateur courant
async function getCurrentUser() {
    // Vérifier Firebase Auth
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) return user;
        
        // Attendre l'authentification
        return new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });
    }
    
    // Vérifier le cache local
    const cachedUser = localStorage.getItem('mathx_user');
    if (cachedUser) {
        try {
            return JSON.parse(cachedUser);
        } catch (e) {
            console.warn('⚠️ Erreur parsing utilisateur cache');
        }
    }
    
    return null;
}

// Afficher le profil
async function displayProfile(user) {
    try {
        // Nom
        const name = user.displayName || user.email.split('@')[0];
        document.getElementById('userName').textContent = name;
        document.getElementById('userFullName').textContent = name;
        
        // Email (surligné)
        document.getElementById('userEmail').textContent = user.email;
        
        // Niveau
        const level = localStorage.getItem('mathx_user_level') || 'Non défini';
        document.getElementById('userLevel').textContent = level;
        
        // Date d'inscription
        if (user.metadata?.creationTime) {
            const date = new Date(user.metadata.creationTime);
            document.getElementById('memberSince').textContent = formatDate(date);
        } else {
            document.getElementById('memberSince').textContent = 'Date inconnue';
        }
        
        // Avatar - Première lettre
        updateAvatar(name);
        
    } catch (error) {
        console.error('❌ Erreur affichage profil:', error);
    }
}

// Mettre à jour l'avatar avec première lettre
function updateAvatar(userName) {
    const avatarElement = document.getElementById('userAvatar');
    
    // Première lettre du nom en majuscule
    const firstLetter = userName ? userName.charAt(0).toUpperCase() : 'U';
    
    // Créer avatar avec première lettre
    avatarElement.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%233b82f6"/><text x="50%" y="50%" font-family="Arial" font-size="60" fill="white" text-anchor="middle" dy=".3em" font-weight="bold">${firstLetter}</text></svg>`;
}

// Mettre à jour l'heure de connexion
function updateLoginTime() {
    const now = new Date();
    const loginTimeElement = document.getElementById('lastLogin');
    
    if (loginTimeElement) {
        const timeString = now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        loginTimeElement.textContent = `Aujourd'hui à ${timeString}`;
    }
    
    localStorage.setItem('mathx_last_login', now.toISOString());
}

// Formater une date
function formatDate(date) {
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ================= SIDEBAR REFAIT - SIMPLE ET FONCTIONNEL =================

function initSidebar() {
    console.log('🔧 Initialisation de la sidebar...');
    
    // Récupérer les éléments
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const profileSidebar = document.getElementById('profileSidebar');
    const sidebarClose = document.getElementById('sidebarClose');
    
    // Vérifier que tous les éléments existent
    if (!hamburgerBtn || !sidebarOverlay || !profileSidebar || !sidebarClose) {
        console.error('❌ Éléments sidebar manquants');
        return;
    }
    
    console.log('✅ Tous les éléments sidebar trouvés');
    
    // Fonction pour ouvrir la sidebar
    function openSidebar() {
        console.log('📱 OUVRIR sidebar');
        profileSidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        sidebarOpen = true;
        document.body.style.overflow = 'hidden'; // Empêcher le scroll
    }
    
    // Fonction pour fermer la sidebar
    function closeSidebar() {
        console.log('📱 FERMER sidebar');
        profileSidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        sidebarOpen = false;
        document.body.style.overflow = ''; // Rétablir le scroll
    }
    
    // Fonction pour basculer (ouvrir/fermer)
    function toggleSidebar() {
        if (sidebarOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }
    
    // Événements
    hamburgerBtn.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // Fermer avec la touche Échap
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && sidebarOpen) {
            closeSidebar();
        }
    });
    
    // Empêcher la fermeture en cliquant dans la sidebar
    profileSidebar.addEventListener('click', function(event) {
        event.stopPropagation();
    });
    
    // Fermer la sidebar quand on clique sur un lien (sauf le lien actif)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (!this.classList.contains('active')) {
                setTimeout(closeSidebar, 300);
            }
        });
    });
    
    console.log('✅ Sidebar initialisée avec succès');
    
    // Test: Vérifier la position initiale
    console.log('📐 Position sidebar:', profileSidebar.style.right);
}

// Configurer le bouton déconnexion
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) {
        console.warn('⚠️ Bouton déconnexion non trouvé');
        return;
    }
    
    logoutBtn.addEventListener('click', async function() {
        if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            return;
        }
        
        try {
            showMessage('Déconnexion en cours...', 'info');
            
            // Déconnexion Firebase
            if (typeof firebase !== 'undefined' && firebase.auth) {
                await firebase.auth().signOut();
            }
            
            // Nettoyer le cache
            localStorage.removeItem('mathx_user');
            localStorage.removeItem('mathx_last_auth');
            localStorage.removeItem('mathx_last_login');
            
            // Redirection
            setTimeout(function() {
                window.location.href = 'auth.html';
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
            showMessage('Erreur lors de la déconnexion', 'error');
        }
    });
    
    console.log('✅ Bouton déconnexion configuré');
}

// Redirection si non authentifié
function redirectToAuth() {
    console.log('❌ Utilisateur non connecté, redirection...');
    showMessage('Redirection vers la page de connexion...', 'warning');
    
    setTimeout(function() {
        window.location.href = 'auth.html';
    }, 2000);
}

// Afficher un message
function showMessage(text, type) {
    // Supprimer les anciens messages
    const oldMessages = document.querySelectorAll('.profile-message');
    oldMessages.forEach(msg => msg.remove());
    
    // Créer le message
    const message = document.createElement('div');
    message.className = `profile-message profile-message-${type}`;
    message.textContent = text;
    
    // Style du message
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? '#ef4444' : 
                     type === 'warning' ? '#f59e0b' : 
                     type === 'info' ? '#3b82f6' : '#10b981'};
        color: white;
        border-radius: 8px;
        z-index: 2000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: messageSlideIn 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    // Auto-suppression
    setTimeout(function() {
        message.style.animation = 'messageSlideOut 0.3s ease';
        setTimeout(function() {
            if (message.parentNode) {
                message.remove();
            }
        }, 300);
    }, 3000);
}

// Ajouter les animations CSS pour les messages
if (!document.querySelector('#message-styles')) {
    const style = document.createElement('style');
    style.id = 'message-styles';
    style.textContent = `
        @keyframes messageSlideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes messageSlideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ profil.js chargé avec succès');