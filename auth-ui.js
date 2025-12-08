/**
 * auth-ui.js - Interface utilisateur pour l'authentification
 * Gère les formulaires, validation et interactions
 */

class AuthUI {
    constructor() {
        this.currentTab = 'login';
        this.init();
    }
    
    init() {
        console.log('🎨 Initialisation AuthUI...');
        
        // Attendre que DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.setupTabs();
        this.setupForms();
        this.setupPasswordToggles();
        this.setupPasswordStrength();
        this.setupRealTimeValidation();
        this.setupGoogleAuth();
        this.checkAuthState();
    }
    
    // ================= GESTION DES ONGLETS =================
    
    setupTabs() {
        const tabs = document.querySelectorAll('.auth-tab');
        const tabContents = document.querySelectorAll('.auth-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // Gérer les liens de switch (comme "Pas de compte ?")
        document.querySelectorAll('.switch-link, .back-link, .forgot-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.dataset.tab;
                if (tabId) {
                    this.switchTab(tabId);
                }
            });
        });
    }
    
    switchTab(tabId) {
        console.log('🔄 Changement onglet:', tabId);
        
        // Mettre à jour les onglets
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Mettre à jour le contenu
        document.querySelectorAll('.auth-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}Tab`);
        });
        
        // Réinitialiser les messages
        this.clearMessages();
        this.clearFormErrors();
        
        // Focus sur le premier champ
        setTimeout(() => {
            const firstInput = document.querySelector(`#${tabId}Tab input`);
            if (firstInput) firstInput.focus();
        }, 100);
        
        this.currentTab = tabId;
    }
    
    // ================= FORMULAIRES =================
    
    setupForms() {
        // Formulaire connexion
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Formulaire inscription
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
        
        // Formulaire réinitialisation
        const resetForm = document.getElementById('resetForm');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => this.handleResetPassword(e));
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        console.log('📝 Traitement connexion...');
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Validation
        if (!this.validateEmail(email)) {
            this.showError('loginEmailError', 'Email invalide');
            return;
        }
        
        if (password.length < 6) {
            this.showError('loginPasswordError', 'Mot de passe trop court');
            return;
        }
        
        // Désactiver bouton et afficher loading
        const submitBtn = e.target.querySelector('.auth-submit-btn');
        const originalText = submitBtn.innerHTML;
        this.setButtonLoading(submitBtn, true);
        
        try {
            // Appeler AuthManager
            if (!window.AuthManager) {
                throw new Error('AuthManager non disponible');
            }
            
            const result = await window.AuthManager.signInWithEmail(email, password);
            
            if (result.success) {
                this.showSuccessMessage('Connexion réussie ! Redirection...');
                
                // Sauvegarder "rester connecté"
                if (rememberMe) {
                    localStorage.setItem('mathx_remember_me', 'true');
                }
                
                // Redirection après délai
                setTimeout(() => {
                    window.location.href = 'profil.html';
                }, 1500);
                
            } else {
                this.showErrorMessage(result.message);
                
                // Afficher erreur spécifique
                if (result.error === 'auth/wrong-password') {
                    this.showError('loginPasswordError', 'Mot de passe incorrect');
                } else if (result.error === 'auth/user-not-found') {
                    this.showError('loginEmailError', 'Compte non trouvé');
                }
            }
            
        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            this.showErrorMessage('Erreur lors de la connexion');
        } finally {
            this.setButtonLoading(submitBtn, false, originalText);
        }
    }
    
    async handleSignup(e) {
        e.preventDefault();
        console.log('📝 Traitement inscription...');
        
        // Récupérer les valeurs
        const userData = {
            firstName: document.getElementById('signupFirstName').value.trim(),
            lastName: document.getElementById('signupLastName').value.trim(),
            level: document.getElementById('signupLevel').value.trim(),
            email: document.getElementById('signupEmail').value.trim(),
            password: document.getElementById('signupPassword').value
        };
        
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;
        
        // Validation
        let isValid = true;
        
        // Prénom
        if (userData.firstName.length < 2) {
            this.showError('signupFirstNameError', 'Prénom trop court');
            isValid = false;
        }
        
        // Nom
        if (userData.lastName.length < 2) {
            this.showError('signupLastNameError', 'Nom trop court');
            isValid = false;
        }
        
        // Niveau
        if (userData.level.length < 2) {
            this.showError('signupLevelError', 'Indiquez votre niveau');
            isValid = false;
        }
        
        // Email
        if (!this.validateEmail(userData.email)) {
            this.showError('signupEmailError', 'Email invalide');
            isValid = false;
        }
        
        // Mot de passe
        if (userData.password.length < 6) {
            this.showError('signupPasswordError', 'Minimum 6 caractères');
            isValid = false;
        }
        
        // Confirmation
        if (userData.password !== confirmPassword) {
            this.showError('signupConfirmPasswordError', 'Les mots de passe ne correspondent pas');
            isValid = false;
        }
        
        // Conditions
        if (!acceptTerms) {
            this.showError('acceptTermsError', 'Vous devez accepter les conditions');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Désactiver bouton et afficher loading
        const submitBtn = e.target.querySelector('.auth-submit-btn');
        const originalText = submitBtn.innerHTML;
        this.setButtonLoading(submitBtn, true);
        
        try {
            // Appeler AuthManager
            if (!window.AuthManager) {
                throw new Error('AuthManager non disponible');
            }
            
            const result = await window.AuthManager.signUp(userData);
            
            if (result.success) {
                // Afficher modal de succès
                this.showSuccessModal(result.message);
                
                // Redirection vers profil après 5 secondes
                setTimeout(() => {
                    window.location.href = 'profil.html';
                }, 5000);
                
            } else {
                this.showErrorMessage(result.message);
                
                // Afficher erreur spécifique
                if (result.error === 'auth/email-already-in-use') {
                    this.showError('signupEmailError', 'Email déjà utilisé');
                } else if (result.error === 'auth/weak-password') {
                    this.showError('signupPasswordError', 'Mot de passe trop faible');
                }
            }
            
        } catch (error) {
            console.error('❌ Erreur inscription:', error);
            this.showErrorMessage('Erreur lors de l\'inscription');
        } finally {
            this.setButtonLoading(submitBtn, false, originalText);
        }
    }
    
    async handleResetPassword(e) {
        e.preventDefault();
        console.log('📝 Traitement réinitialisation...');
        
        const email = document.getElementById('resetEmail').value.trim();
        
        // Validation email
        if (!this.validateEmail(email)) {
            this.showError('resetEmailError', 'Email invalide');
            return;
        }
        
        // Désactiver bouton et afficher loading
        const submitBtn = e.target.querySelector('.auth-submit-btn');
        const originalText = submitBtn.innerHTML;
        this.setButtonLoading(submitBtn, true);
        
        try {
            // Appeler AuthManager
            if (!window.AuthManager) {
                throw new Error('AuthManager non disponible');
            }
            
            const result = await window.AuthManager.resetPassword(email);
            
            if (result.success) {
                this.showSuccessMessage('Email envoyé ! Vérifiez votre boîte de réception.');
                
                // Retour à la connexion après délai
                setTimeout(() => {
                    this.switchTab('login');
                }, 3000);
                
            } else {
                this.showErrorMessage(result.message);
                
                if (result.error === 'auth/user-not-found') {
                    this.showError('resetEmailError', 'Aucun compte avec cet email');
                }
            }
            
        } catch (error) {
            console.error('❌ Erreur réinitialisation:', error);
            this.showErrorMessage('Erreur lors de l\'envoi');
        } finally {
            this.setButtonLoading(submitBtn, false, originalText);
        }
    }
    
    // ================= MOT DE PASSE (VOIR/CACHER) =================
    
    setupPasswordToggles() {
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = button.dataset.target;
                const input = document.getElementById(targetId);
                
                if (input.type === 'password') {
                    input.type = 'text';
                    button.innerHTML = '<i class="fas fa-eye-slash"></i>';
                    button.setAttribute('aria-label', 'Cacher le mot de passe');
                } else {
                    input.type = 'password';
                    button.innerHTML = '<i class="fas fa-eye"></i>';
                    button.setAttribute('aria-label', 'Voir le mot de passe');
                }
                
                input.focus();
            });
        });
    }
    
    // ================= FORCE MOT DE PASSE =================
    
    setupPasswordStrength() {
        const passwordInput = document.getElementById('signupPassword');
        if (!passwordInput) return;
        
        passwordInput.addEventListener('input', () => {
            this.updatePasswordStrength(passwordInput.value);
        });
    }
    
    updatePasswordStrength(password) {
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.getElementById('passwordStrength');
        
        if (!strengthBar || !strengthText) return;
        
        let strength = 0;
        let text = 'Faible';
        let color = '#dc2626'; // Rouge
        
        // Critères
        if (password.length >= 6) strength += 25;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 15;
        if (/[^A-Za-z0-9]/.test(password)) strength += 10;
        
        // Déterminer niveau
        if (strength >= 70) {
            text = 'Fort';
            color = '#10b981'; // Vert
        } else if (strength >= 40) {
            text = 'Moyen';
            color = '#f59e0b'; // Orange
        }
        
        // Mettre à jour l'interface
        strengthBar.style.setProperty('--strength-width', `${strength}%`);
        strengthBar.style.setProperty('--strength-color', color);
        strengthText.textContent = text;
        strengthText.style.color = color;
        
        // Animation CSS
        strengthBar.style.transition = 'width 300ms ease';
    }
    
    // ================= VALIDATION EN TEMPS RÉEL =================
    
    setupRealTimeValidation() {
        // Validation email
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value && !this.validateEmail(input.value)) {
                    const errorId = `${input.id}Error`;
                    this.showError(errorId, 'Email invalide');
                }
            });
            
            input.addEventListener('input', () => {
                const errorId = `${input.id}Error`;
                this.clearError(errorId);
            });
        });
        
        // Validation confirmation mot de passe
        const passwordInput = document.getElementById('signupPassword');
        const confirmInput = document.getElementById('signupConfirmPassword');
        
        if (passwordInput && confirmInput) {
            const validatePasswords = () => {
                if (passwordInput.value && confirmInput.value && 
                    passwordInput.value !== confirmInput.value) {
                    this.showError('signupConfirmPasswordError', 'Les mots de passe ne correspondent pas');
                } else {
                    this.clearError('signupConfirmPasswordError');
                }
            };
            
            passwordInput.addEventListener('input', validatePasswords);
            confirmInput.addEventListener('input', validatePasswords);
        }
    }
    
    // ================= CONNEXION GOOGLE =================
    
    setupGoogleAuth() {
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        const googleSignupBtn = document.getElementById('googleSignupBtn');
        
        const handleGoogleAuth = async () => {
            if (!window.AuthManager) {
                this.showErrorMessage('AuthManager non disponible');
                return;
            }
            
            try {
                this.showInfoMessage('Connexion Google en cours...');
                
                const result = await window.AuthManager.signInWithGoogle();
                
                if (result.success) {
                    this.showSuccessMessage('Connexion réussie ! Redirection...');
                    
                    // Redirection
                    setTimeout(() => {
                        window.location.href = 'profil.html';
                    }, 1500);
                } else {
                    this.showErrorMessage(result.message);
                }
                
            } catch (error) {
                console.error('❌ Erreur Google Auth:', error);
                this.showErrorMessage('Erreur lors de la connexion Google');
            }
        };
        
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', handleGoogleAuth);
        }
        
        if (googleSignupBtn) {
            googleSignupBtn.addEventListener('click', handleGoogleAuth);
        }
    }
    
    // ================= MESSAGES & ERREURS =================
    
    showMessage(type, text) {
        const messagesContainer = document.getElementById('authMessages');
        if (!messagesContainer) return;
        
        // Créer le message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        // Icône selon type
        let icon = 'info-circle';
        switch (type) {
            case 'success': icon = 'check-circle'; break;
            case 'error': icon = 'exclamation-circle'; break;
            case 'warning': icon = 'exclamation-triangle'; break;
        }
        
        messageDiv.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${text}</span>
        `;
        
        // Ajouter au conteneur
        messagesContainer.appendChild(messageDiv);
        
        // Auto-suppression après 5 secondes
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.opacity = '0';
                messageDiv.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
    
    showSuccessMessage(text) {
        this.showMessage('success', text);
    }
    
    showErrorMessage(text) {
        this.showMessage('error', text);
    }
    
    showInfoMessage(text) {
        this.showMessage('info', text);
    }
    
    clearMessages() {
        const messagesContainer = document.getElementById('authMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
    }
    
    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
            
            // Ajouter classe d'erreur au champ parent
            const input = document.getElementById(elementId.replace('Error', ''));
            if (input) {
                input.classList.add('error-input');
            }
        }
    }
    
    clearError(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
            
            // Retirer classe d'erreur
            const input = document.getElementById(elementId.replace('Error', ''));
            if (input) {
                input.classList.remove('error-input');
            }
        }
    }
    
    clearFormErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
        
        document.querySelectorAll('.error-input').forEach(input => {
            input.classList.remove('error-input');
        });
    }
    
        // ================= MODAL DE SUCCÈS =================
    
    showSuccessModal(message = 'Votre compte a été créé avec succès !') {
        const modal = document.getElementById('successModal');
        const messageElement = document.getElementById('successMessage');
        const profileBtn = document.getElementById('goToProfileBtn');
        const continueBtn = document.getElementById('continueBtn');
        
        if (!modal || !messageElement) return;
        
        // Mettre à jour le message
        messageElement.textContent = message;
        
        // Afficher le modal
        modal.classList.add('active');
        
        // Configurer les boutons
        if (profileBtn) {
            profileBtn.onclick = () => {
                window.location.href = 'profil.html';
            };
        }
        
        if (continueBtn) {
            continueBtn.onclick = () => {
                modal.classList.remove('active');
            };
        }
        
        // Fermer en cliquant en dehors
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
    
    // ================= UTILITAIRES =================
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    setButtonLoading(button, isLoading, originalHTML = null) {
        if (!button) return;
        
        const spinner = button.querySelector('.loading-spinner');
        
        if (isLoading) {
            button.disabled = true;
            if (spinner) spinner.style.display = 'block';
            button.style.opacity = '0.7';
        } else {
            button.disabled = false;
            if (spinner) spinner.style.display = 'none';
            button.style.opacity = '1';
            if (originalHTML) {
                button.innerHTML = originalHTML;
            }
        }
    }
    
    // ================= VÉRIFICATION ÉTAT AUTH =================
    
    checkAuthState() {
        // Vérifier si déjà connecté via localStorage
        const cachedUser = localStorage.getItem('mathx_user');
        if (cachedUser) {
            console.log('👤 Utilisateur en cache détecté');
        }
        
        // Écouter les changements d'état Firebase
        if (window.AuthManager) {
            window.AuthManager.onAuthStateChanged((user) => {
                if (user && window.location.pathname.includes('auth.html')) {
                    console.log('✅ Déjà connecté, redirection...');
                    setTimeout(() => {
                        window.location.href = 'profil.html';
                    }, 1000);
                }
            });
        }
    }
}

// Initialiser AuthUI
let authUI = null;

document.addEventListener('DOMContentLoaded', () => {
    authUI = new AuthUI();
    window.AuthUI = authUI;
    console.log('✅ AuthUI initialisé');
});

// CSS supplémentaire pour les erreurs
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    .error-input {
        border-color: #dc2626 !important;
        background-color: rgba(220, 38, 38, 0.05) !important;
    }
    
    .error-input:focus {
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
    }
    
    .strength-bar {
        --strength-width: 0%;
        --strength-color: #dc2626;
    }
    
    .strength-bar::after {
        width: var(--strength-width);
        background-color: var(--strength-color);
    }
`;
document.head.appendChild(errorStyles);