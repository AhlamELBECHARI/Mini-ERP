// js/script.js - Fonctions communes à toutes les pages
// Les services API sont dans services.js

// ==================== INITIALISATION ====================

// Initialisation globale au chargement de la page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Application chargée:', window.location.pathname);
    
    // Ne pas vérifier l'auth sur la page de login
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    // Vérifier l'authentification pour toutes les autres pages
    const isAuthenticated = await authService.checkSession();
    
    if (!isAuthenticated) {
        console.log('🔒 Non authentifié, redirection vers login');
        window.location.href = 'login.html';
        return;
    }
    
    // Mettre à jour l'interface utilisateur
    updateUserInterface();
    
    // Configurer les événements communs
    setupCommonEvents();
});

// ==================== ÉVÉNEMENTS COMMUNS ====================

function setupCommonEvents() {
    console.log('⚙️ Configuration des événements communs');
    
    // Bouton de déconnexion
    setupLogoutButtons();
    
    // Menu toggle (sidebar)
    setupMenuToggle();
    
    // Toggle thème
    setupThemeToggle();
    
    // Navigation active
    setupActiveNavigation();
}

// Configuration des boutons de déconnexion
function setupLogoutButtons() {
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
                console.log('👋 Déconnexion');
                authService.logout();
            }
        });
    });
}

// Configuration du menu toggle
function setupMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            // Vue mobile (bascule via translation)
            if (window.innerWidth <= 1200) {
                sidebar.classList.toggle('active');
            } else {
                // Vue desktop (bascule mini-sidebar)
                sidebar.classList.toggle('collapsed');
                if (mainContent) {
                    mainContent.classList.toggle('expanded');
                }
            }
        });
    }

    // Fermer la sidebar mobile au clic extérieur
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 1200 && 
            sidebar && sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// Configuration du toggle de thème
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle) {
        // Charger le thème sauvegardé
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.className = savedTheme + '-mode';
        
        // Mettre à jour l'icône
        updateThemeIcon(savedTheme);
        
        // Événement de clic
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.body.className = newTheme + '-mode';
            localStorage.setItem('theme', newTheme);
            
            updateThemeIcon(newTheme);
        });
    }
}

// Mettre à jour l'icône du thème
function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const icon = themeToggle.querySelector('i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Configuration de la navigation active
function setupActiveNavigation() {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        
        // Retirer la classe active de tous les items
        item.classList.remove('active');
        
        // Ajouter la classe active à l'item correspondant
        if (href && currentPath.includes(href)) {
            item.classList.add('active');
        }
    });
}

// ==================== UTILITAIRES UI ====================

// Afficher un loader sur un bouton
function showButtonLoading(button, loadingText = 'Chargement...') {
    if (!button) return;
    
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
}

// Cacher le loader d'un bouton
function hideButtonLoading(button) {
    if (!button) return;
    
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || button.innerHTML;
}

// Afficher une modal de confirmation
function showConfirmDialog(message, onConfirm, onCancel) {
    if (confirm(message)) {
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    } else {
        if (typeof onCancel === 'function') {
            onCancel();
        }
    }
}

// Valider un email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Valider un numéro de téléphone
function isValidPhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return phone.length >= 10 && re.test(phone);
}

// Formater un nombre avec des espaces
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Formater une devise
function formatCurrency(amount, currency = '€') {
    return `${formatNumber(amount)} ${currency}`;
}

// Calculer le pourcentage
function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

// Formater une date (ex: 2024-04-14 -> 14 Avr 2024)
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Formater une date complète avec heure
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==================== GESTION DES ERREURS ====================

// Gestionnaire d'erreur global
window.addEventListener('error', function(event) {
    console.error('❌ Erreur globale:', event.error);
    
    // Ne pas afficher de toast pour les erreurs de script
    if (event.error && event.error.message) {
        // Logger l'erreur pour le débogage
        console.error('Stack:', event.error.stack);
    }
});

// Gestionnaire de promesses non gérées
window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Promise rejetée:', event.reason);
    
    // Afficher un message générique à l'utilisateur
    if (event.reason && event.reason.message) {
        showToast('Une erreur est survenue', 'error');
    }
});

// ==================== ÉVÉNEMENTS DE RECHERCHE ====================

// Configuration de la barre de recherche (si présente)
function setupSearchBar() {
    const searchInput = document.querySelector('.search-bar input');
    
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            
            // Debounce la recherche
            clearTimeout(searchTimeout);
            
            if (query.length >= 3) {
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 500);
            }
        });
    }
}

// Effectuer une recherche
function performSearch(query) {
    console.log('🔍 Recherche:', query);
    // À implémenter selon la page
    showToast(`Recherche de: ${query}`, 'info');
}

// ==================== INITIALISATION SUPPLÉMENTAIRE ====================

// Après le chargement initial, configurer la recherche
window.addEventListener('load', function() {
    setupSearchBar();
});

// ==================== EXPORTS GLOBAUX ====================

// Rendre les fonctions utilitaires disponibles globalement
window.showButtonLoading = showButtonLoading;
window.hideButtonLoading = hideButtonLoading;
window.showConfirmDialog = showConfirmDialog;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.formatNumber = formatNumber;
window.formatCurrency = formatCurrency;
window.calculatePercentage = calculatePercentage;

console.log('✅ Script commun chargé et prêt');