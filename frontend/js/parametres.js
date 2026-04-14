// js/parametres.js - Gestion de la page paramètres

// ==================== GESTION DE LA PAGE PARAMÈTRES ====================

// Charger les données de la page paramètres
async function loadSettingsPage() {
    console.log('📋 Chargement de la page paramètres...');
    
    try {
        // Vérifier l'authentification
        if (!authService.user) {
            const isAuthenticated = await authService.checkSession();
            if (!isAuthenticated) {
                window.location.href = 'login.html';
                return;
            }
        }
        
        // Mettre à jour l'interface utilisateur
        updateUserInterface();
        
        // Charger les données
        await Promise.all([
            loadUserProfile(),
            loadAllUsers() // Pour la section gestion des utilisateurs
        ]);
        
        // Configurer les événements
        setupSettingsPageEvents();
        
    } catch (error) {
        console.error('Erreur lors du chargement de la page paramètres:', error);
        showToast('Erreur lors du chargement des données', 'error');
    }
}

// Charger le profil utilisateur
async function loadUserProfile() {
    try {
        const userData = await userService.getCurrentUser();
        console.log('👤 Profil utilisateur:', userData);
        
        // Remplir le formulaire de profil
        fillProfileForm(userData);
        
    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        showToast('Erreur lors du chargement du profil', 'error');
    }
}

// Remplir le formulaire de profil
function fillProfileForm(userData) {
    // Nom complet
    const nomCompletInput = document.getElementById('profile-nom-complet');
    if (nomCompletInput) {
        nomCompletInput.value = `${userData.prenom} ${userData.nom}`;
    }
    
    // Email
    const emailInput = document.getElementById('profile-email');
    if (emailInput) {
        emailInput.value = userData.email || '';
    }
    
    // Téléphone
    const telephoneInput = document.getElementById('profile-telephone');
    if (telephoneInput) {
        telephoneInput.value = userData.telephone || '';
    }
    
    // Département
    const departementSelect = document.querySelector('#profile-section select:nth-of-type(1)');
    if (departementSelect && userData.departement) {
        const options = Array.from(departementSelect.options);
        const option = options.find(opt => opt.value === userData.departement);
        if (option) {
            departementSelect.value = userData.departement;
        }
    }
    
    // Rôle
    const roleSelect = document.querySelector('#profile-section select:nth-of-type(2)');
    if (roleSelect && userData.role) {
        const roleMapping = {
            'admin': 'Administrateur',
            'chef_projet': 'Chef de Projet',
            'rh': 'Manager RH',
            'employe': 'Employé'
        };
        
        const options = Array.from(roleSelect.options);
        const option = options.find(opt => opt.textContent === roleMapping[userData.role]);
        if (option) {
            roleSelect.selectedIndex = option.index;
        }
    }
    
    // Avatar
    const avatarImg = document.querySelector('#profile-section .user-avatar-lg img');
    if (avatarImg) {
        if (userData.avatar_url) {
            avatarImg.src = userData.avatar_url;
        } else {
            avatarImg.src = `https://ui-avatars.com/api/?name=${userData.prenom}+${userData.nom}&background=4361ee&color=fff`;
        }
    }
}

// Charger tous les utilisateurs (pour la section admin)
async function loadAllUsers() {
    // Vérifier si l'utilisateur est admin
    if (authService.user.role !== 'admin') {
        const usersSection = document.getElementById('users-section');
        if (usersSection) {
            usersSection.style.display = 'none';
        }
        
        const usersMenuItem = document.querySelector('[data-section="users"]');
        if (usersMenuItem) {
            usersMenuItem.style.display = 'none';
        }
        return;
    }
    
    try {
        const users = await userService.getUsers();
        console.log('👥 Tous les utilisateurs:', users);
        
        displayUsersList(users);
        
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        // Ne pas afficher d'erreur si l'utilisateur n'est pas admin
        if (authService.user.role === 'admin') {
            showToast('Erreur lors du chargement des utilisateurs', 'error');
        }
    }
}

// Afficher la liste des utilisateurs
function displayUsersList(users) {
    const userListContainer = document.querySelector('#users-section .user-list');
    if (!userListContainer) return;
    
    const roleMapping = {
        'admin': { label: 'Administrateur', class: 'role-admin' },
        'chef_projet': { label: 'Chef de Projet', class: 'role-manager' },
        'rh': { label: 'RH', class: 'role-manager' },
        'employe': { label: 'Employé', class: 'role-user' }
    };
    
    userListContainer.innerHTML = users.map(user => {
        const role = roleMapping[user.role] || { label: user.role, class: 'role-user' };
        const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${user.prenom}+${user.nom}&background=4361ee&color=fff`;
        
        return `
            <div class="user-item" data-user-id="${user.id}">
                <div class="user-info">
                    <div class="user-avatar-lg">
                        <img src="${avatarUrl}" alt="${user.prenom} ${user.nom}">
                    </div>
                    <div class="user-details">
                        <h5>${user.prenom} ${user.nom}</h5>
                        <p>${user.email}</p>
                        <p>Département: ${user.departement || 'Non spécifié'}</p>
                    </div>
                </div>
                <div>
                    <span class="role-badge ${role.class}">${role.label}</span>
                    <div class="user-actions" style="margin-top: 10px; display: flex; gap: 5px;">
                        <button class="btn-icon small" onclick="editUser(${user.id})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${user.id !== authService.user.id ? `
                            <button class="btn-icon small" onclick="deleteUser(${user.id})" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Configurer les événements de la page
function setupSettingsPageEvents() {
    // Navigation entre les sections
    const settingsItems = document.querySelectorAll('.settings-item');
    settingsItems.forEach(item => {
        item.addEventListener('click', function() {
            // Retirer la classe active de tous les items
            settingsItems.forEach(i => i.classList.remove('active'));
            // Ajouter la classe active à l'item cliqué
            this.classList.add('active');
            
            // Cacher toutes les sections
            const sections = document.querySelectorAll('.settings-section');
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Afficher la section sélectionnée
            const sectionId = this.dataset.section + '-section';
            const sectionToShow = document.getElementById(sectionId);
            if (sectionToShow) {
                sectionToShow.style.display = 'block';
            }
        });
    });
    
    // Bouton de sauvegarde
    const saveButtons = document.querySelectorAll('.btn-primary');
    saveButtons.forEach(btn => {
        if (btn.textContent.includes('Sauvegarder')) {
            btn.addEventListener('click', saveSettings);
        }
    });
    
    // Bouton de réinitialisation
    const resetButtons = document.querySelectorAll('.btn-outline');
    resetButtons.forEach(btn => {
        if (btn.textContent.includes('Réinitialiser')) {
            btn.addEventListener('click', resetSettings);
        }
    });
}

// Sauvegarder les paramètres
async function saveSettings() {
    try {
        console.log('💾 Sauvegarde des paramètres...');
        
        // Récupérer les valeurs du formulaire
        const telephoneInput = document.getElementById('profile-telephone');
        
        if (!telephoneInput) {
            console.error('Champ téléphone non trouvé');
            showToast('Erreur: champ non trouvé', 'error');
            return;
        }
        
        const updates = {};
        const newPhone = telephoneInput.value.trim();
        
        console.log('📞 Téléphone actuel:', authService.user.telephone);
        console.log('📞 Nouveau téléphone:', newPhone);
        
        // Vérifier si le téléphone a changé
        if (newPhone && newPhone !== authService.user.telephone) {
            updates.telephone = newPhone;
        }
        
        // Si aucune modification, afficher un message
        if (Object.keys(updates).length === 0) {
            showToast('Aucune modification à sauvegarder', 'info');
            return;
        }
        
        console.log('📤 Envoi des modifications:', updates);
        
        // Envoyer les modifications au serveur
        const updatedUser = await userService.updateProfile(authService.user.id, updates);
        
        console.log('✅ Résultat:', updatedUser);
        
        // Si on n'a pas d'erreur (throw error géré par apiRequest), c'est un succès
        showToast('Paramètres sauvegardés avec succès !', 'success');
        
        // Mettre à jour les données locales
        authService.user = { ...authService.user, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(authService.user));
        
        // Recharger le profil pour confirmation
        await loadUserProfile();
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        showToast(error.message || 'Erreur lors de la sauvegarde', 'error');
    }
}

// Réinitialiser les paramètres
function resetSettings() {
    if (confirm('Voulez-vous vraiment réinitialiser tous les paramètres ?')) {
        loadUserProfile();
        showToast('Paramètres réinitialisés', 'info');
    }
}

// Modifier un utilisateur
window.editUser = function(userId) {
    showToast('Fonctionnalité d\'édition en cours de développement', 'info');
    // TODO: Implémenter la modal d'édition
};

// Supprimer un utilisateur
window.deleteUser = async function(userId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
        return;
    }
    
    try {
        await userService.deleteUser(userId);
        showToast('Utilisateur supprimé avec succès', 'success');
        
        // Recharger la liste
        await loadAllUsers();
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showToast(error.message || 'Erreur lors de la suppression', 'error');
    }
};

// Initialisation de la page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Page paramètres initialisée');
    
    // Charger la page
    await loadSettingsPage();
});