// js/login.js - Gestion de la page de connexion

// ==================== GESTION DU LOGIN ====================

// Vérifier si déjà connecté
async function checkAlreadyLoggedIn() {
    if (authService.token) {
        const isAuthenticated = await authService.checkSession();
        if (isAuthenticated) {
            console.log('✅ Utilisateur déjà connecté, redirection...');
            window.location.href = 'index.html';
            return true;
        }
    }
    return false;
}

// Gérer la soumission du formulaire de connexion
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    const loginLoading = document.getElementById('loginLoading');
    const generalError = document.getElementById('generalError');
    
    // Récupérer les valeurs
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validation basique
    if (!email || !password) {
        showLoginError('Veuillez remplir tous les champs');
        return;
    }
    
    if (!isValidEmail(email)) {
        showLoginError('Email invalide');
        return;
    }
    
    try {
        // Afficher le loading
        loginBtn.disabled = true;
        loginText.style.display = 'none';
        loginLoading.style.display = 'inline';
        generalError.style.display = 'none';
        
        console.log('🔐 Tentative de connexion:', email);
        
        // Appeler le service de connexion
        const result = await authService.login(email, password);
        
        if (result.success) {
            console.log('✅ Connexion réussie!');
            showToast('Connexion réussie ! Redirection...', 'success');
            
            // Attendre un peu avant la redirection
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
            
        } else {
            console.error('❌ Échec de connexion:', result.error);
            showLoginError(result.error || 'Email ou mot de passe incorrect');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la connexion:', error);
        showLoginError('Erreur de connexion au serveur. Vérifiez que le backend est démarré.');
    } finally {
        // Cacher le loading
        loginBtn.disabled = false;
        loginText.style.display = 'inline';
        loginLoading.style.display = 'none';
    }
}

// Afficher une erreur de connexion
function showLoginError(message) {
    const generalError = document.getElementById('generalError');
    if (generalError) {
        generalError.textContent = message;
        generalError.style.display = 'block';
    }
    
    // Afficher aussi un toast
    showToast(message, 'error');
}

// Pré-remplir les identifiants (pour le développement)
function fillCredentials(email, password) {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) emailInput.value = email;
    if (passwordInput) passwordInput.value = password;
    
    showToast('Identifiants pré-remplis', 'info');
}

// Basculer la visibilité du mot de passe
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    
    if (passwordInput && toggleBtn) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            passwordInput.type = 'password';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }
}

// Initialisation de la page de login
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Page de connexion chargée');
    
    // Vérifier si déjà connecté
    const alreadyLoggedIn = await checkAlreadyLoggedIn();
    if (alreadyLoggedIn) {
        return; // Redirection en cours
    }
    
    // Attacher l'événement de soumission du formulaire
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Pré-remplir pour le développement (localhost uniquement)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const rememberMe = document.getElementById('rememberMe');
        
        if (emailInput && !emailInput.value) {
            emailInput.value = 'admin@mini-erp.com';
        }
        if (passwordInput && !passwordInput.value) {
            passwordInput.value = 'admin123';
        }
        if (rememberMe) {
            rememberMe.checked = true;
        }
    }
    
    // Focus sur le champ email
    const emailInput = document.getElementById('email');
    if (emailInput && !emailInput.value) {
        emailInput.focus();
    }
    
    // Ajouter un bouton pour voir/cacher le mot de passe si non présent
    addPasswordToggle();
});

// Ajouter un bouton pour voir/cacher le mot de passe
function addPasswordToggle() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;
    
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.id = 'togglePassword';
    toggleBtn.className = 'password-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    toggleBtn.style.cssText = `
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 5px;
    `;
    
    toggleBtn.addEventListener('click', togglePasswordVisibility);
    
    // Insérer le bouton
    const passwordGroup = passwordInput.closest('.form-group');
    if (passwordGroup) {
        passwordGroup.style.position = 'relative';
        passwordGroup.appendChild(toggleBtn);
    }
}

// Gérer "Se souvenir de moi"
function handleRememberMe() {
    const rememberMe = document.getElementById('rememberMe');
    const emailInput = document.getElementById('email');
    
    if (rememberMe && rememberMe.checked && emailInput) {
        localStorage.setItem('rememberedEmail', emailInput.value);
    } else {
        localStorage.removeItem('rememberedEmail');
    }
}

// Charger l'email mémorisé
function loadRememberedEmail() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const emailInput = document.getElementById('email');
    const rememberMe = document.getElementById('rememberMe');
    
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberMe) {
            rememberMe.checked = true;
        }
    }
}

// Charger l'email mémorisé au chargement
window.addEventListener('load', loadRememberedEmail);

// Exporter pour utilisation globale
window.fillCredentials = fillCredentials;

console.log('✅ Script de login chargé et prêt');