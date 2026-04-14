// js/projets.js - Gestion complète de la page projets

// ==================== GESTION DE LA PAGE PROJETS ====================

// Charger les données de la page projets
async function loadProjectsPage() {
    console.log('📂 Chargement de la page projets...');
    
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
            loadProjects(),
            loadLateTasks(),
            loadUsersForFilters(),
            loadUsersForProjectForm()
        ]);
        
        // Configurer les événements
        setupProjectsPageEvents();
        
        // Mettre à jour l'UI selon le rôle
        updateProjectsPageUI();
        
    } catch (error) {
        console.error('Erreur lors du chargement de la page projets:', error);
        showToast('Erreur lors du chargement des données', 'error');
    }
}
// projets.js - Ajoutez cette fonction au début du fichier
function getSelectedMembers() {
    const selectedMembers = [];
    
    // Méthode 1: Récupérer depuis les checkboxes du formulaire
    const memberCheckboxes = document.querySelectorAll('.member-checkbox:checked');
    memberCheckboxes.forEach(checkbox => {
        const memberId = parseInt(checkbox.value);
        if (memberId && !isNaN(memberId)) {
            selectedMembers.push(memberId);
        }
    });
    
    // Méthode 2: Si vous avez un select multiple
    const memberSelect = document.getElementById('projectMembers');
    if (memberSelect && memberSelect.multiple) {
        const options = memberSelect.selectedOptions;
        Array.from(options).forEach(option => {
            const memberId = parseInt(option.value);
            if (memberId && !isNaN(memberId)) {
                selectedMembers.push(memberId);
            }
        });
    }
    
    // Méthode 3: Si vous avez un champ caché avec les membres sélectionnés
    const hiddenMembersField = document.getElementById('selectedMembers');
    if (hiddenMembersField && hiddenMembersField.value) {
        try {
            const members = JSON.parse(hiddenMembersField.value);
            if (Array.isArray(members)) {
                members.forEach(memberId => {
                    if (!selectedMembers.includes(memberId)) {
                        selectedMembers.push(memberId);
                    }
                });
            }
        } catch (e) {
            console.error('Erreur parsing hidden members:', e);
        }
    }
    
    console.log('👥 Membres sélectionnés:', selectedMembers);
    return selectedMembers;
}

// Fonction utilitaire pour afficher/cacher les membres
function updateSelectedMembersDisplay() {
    const selectedMembers = getSelectedMembers();
    const displayElement = document.getElementById('selectedMembersDisplay');
    
    if (displayElement && selectedMembers.length > 0) {
        displayElement.innerHTML = `
            <div class="selected-members-list">
                <strong>Membres sélectionnés (${selectedMembers.length}) :</strong>
                <div class="member-tags mt-2" id="memberTags"></div>
            </div>
        `;
        
        // Charger les détails des membres pour les afficher
        loadMemberDetails(selectedMembers);
    } else if (displayElement) {
        displayElement.innerHTML = '<em>Aucun membre sélectionné</em>';
    }
}

// Fonction pour charger les détails des membres
async function loadMemberDetails(memberIds) {
    try {
        const container = document.getElementById('memberTags');
        if (!container) return;
        
        container.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
        
        // Récupérer les détails des membres
        const response = await fetch(`${API_BASE_URL}/users`);
        const users = await response.json();
        
        const memberTags = memberIds.map(memberId => {
            const user = users.find(u => u.id === memberId);
            if (user) {
                return `
                    <span class="member-tag badge bg-primary me-2 mb-2">
                        ${user.prenom} ${user.nom}
                        <button type="button" class="btn-close btn-close-white ms-1" 
                                onclick="removeMember(${memberId})" 
                                aria-label="Supprimer"></button>
                    </span>
                `;
            }
            return '';
        }).join('');
        
        container.innerHTML = memberTags;
        
    } catch (error) {
        console.error('Erreur chargement membres:', error);
        const container = document.getElementById('memberTags');
        if (container) {
            container.innerHTML = '<span class="text-muted">Impossible de charger les membres</span>';
        }
    }
}

// Fonction pour supprimer un membre
function removeMember(memberId) {
    const checkboxes = document.querySelectorAll(`.member-checkbox[value="${memberId}"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Mettre à jour l'affichage
    updateSelectedMembersDisplay();
}

// Initialiser l'affichage des membres
document.addEventListener('DOMContentLoaded', function() {
    updateSelectedMembersDisplay();
    
    // Écouter les changements sur les checkboxes
    document.querySelectorAll('.member-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedMembersDisplay);
    });
});

// Charger les projets depuis l'API
async function loadProjects(filters = {}) {
    try {
        const projects = await projectService.getAllProjects(filters);
        console.log('📊 Projets chargés:', projects);
        
        displayProjects(projects);
        
    } catch (error) {
        console.error('Erreur lors du chargement des projets:', error);
        showToast('Erreur lors du chargement des projets', 'error');
    }
}

// Afficher les projets dans la grille
function displayProjects(projects) {
    const container = document.querySelector('.projects-grid');
    if (!container) return;
    
    if (!projects || projects.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-inbox fa-3x mb-3" style="color: var(--text-secondary);"></i>
                <h4>Aucun projet trouvé</h4>
                <p style="color: var(--text-secondary);">Commencez par créer votre premier projet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = projects.map(project => {
        // Déterminer le badge de statut
        let badgeClass = 'success';
        let badgeIcon = 'check-circle';
        let badgeText = 'À jour';
        
        if (project.priorite === 'haute') {
            badgeClass = 'urgent';
            badgeIcon = 'exclamation-circle';
            badgeText = 'Urgent';
        } else if (project.statut === 'en_retard') {
            badgeClass = 'warning';
            badgeIcon = 'clock';
            badgeText = 'En retard';
        }
        
        // Calculer les jours restants
        const endDate = new Date(project.date_fin);
        const today = new Date();
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        const daysText = daysRemaining > 0 ? `${daysRemaining}j` : 'Échu';
        
        // Générer les avatars des membres
        const membersHtml = project.membres && project.membres.length > 0 
            ? project.membres.slice(0, 3).map((member, index) => {
                const avatarUrl = member.avatar_url || `https://ui-avatars.com/api/?name=${member.prenom}+${member.nom}&background=4361ee&color=fff`;
                return `
                    <img src="${avatarUrl}" 
                         alt="${member.prenom} ${member.nom}" 
                         title="${member.prenom} ${member.nom}"
                         style="margin-left: ${index > 0 ? '-8px' : '0'}">
                `;
            }).join('') + (project.membres.length > 3 ? `<span class="more-count">+${project.membres.length - 3}</span>` : '')
            : '<span class="more-count">Aucun membre</span>';
        
        return `
            <div class="project-card" data-id="${project.id}">
                <div class="project-header">
                    <div class="project-badge ${badgeClass}">
                        <i class="fas fa-${badgeIcon}"></i>
                        ${badgeText}
                    </div>
                    <div class="project-actions">
                        <button class="btn-icon" onclick="showProjectMenu(${project.id}, event)">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                <div class="project-body">
                    <h3 class="project-title">${project.nom}</h3>
                    <p class="project-desc">${project.description || 'Aucune description'}</p>
                    
                    <div class="project-meta">
                        <div class="meta-item">
                            <i class="far fa-calendar"></i>
                            <span>${formatDate(project.date_fin)}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-user"></i>
                            <span>${project.chef_projet_prenom || ''} ${project.chef_projet_nom || ''}</span>
                        </div>
                    </div>
                    
                    <div class="project-progress">
                        <div class="progress-info">
                            <span>Avancement</span>
                            <span>${project.avancement || 0}%</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar" style="width: ${project.avancement || 0}%"></div>
                        </div>
                    </div>
                    
                    <div class="project-team">
                        <div class="team-members">
                            ${membersHtml}
                        </div>
                        <div class="project-stats">
                            <div class="stat">
                                <i class="far fa-clock"></i>
                                <span>${daysText}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Afficher le menu contextuel du projet
window.showProjectMenu = function(projectId, event) {
    event.stopPropagation();
    
    // Créer le menu contextuel
    const menu = document.createElement('div');
    menu.style.cssText = `
        position: fixed;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        min-width: 150px;
    `;
    
    menu.innerHTML = `
        <div style="padding: 5px;">
            <button onclick="viewProject(${projectId})" style="width: 100%; text-align: left; padding: 10px 15px; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-eye"></i> Voir détails
            </button>
            ${authService.user.role !== 'employe' ? `
                <button onclick="editProject(${projectId})" style="width: 100%; text-align: left; padding: 10px 15px; background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button onclick="deleteProject(${projectId})" style="width: 100%; text-align: left; padding: 10px 15px; background: none; border: none; color: var(--danger); cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            ` : ''}
        </div>
    `;
    
    // Positionner le menu
    const rect = event.target.closest('.btn-icon').getBoundingClientRect();
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;
    
    document.body.appendChild(menu);
    
    // Fermer au clic extérieur
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            document.body.removeChild(menu);
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 0);
};

// Voir les détails d'un projet
window.viewProject = function(projectId) {
    showToast('Affichage des détails du projet', 'info');
    // TODO: Implémenter la vue détaillée
};

// Modifier un projet
window.editProject = function(projectId) {
    showToast('Modification du projet', 'info');
    // TODO: Implémenter l'édition
};

// Supprimer un projet
window.deleteProject = async function(projectId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
        return;
    }
    
    try {
        await projectService.deleteProject(projectId);
        showToast('Projet supprimé avec succès', 'success');
        
        // Recharger les projets
        await loadProjects();
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showToast(error.message || 'Erreur lors de la suppression', 'error');
    }
};

// Charger les tâches en retard
async function loadLateTasks() {
    try {
        const tasks = await taskService.getLateTasks();
        console.log('⏰ Tâches en retard:', tasks);
        
        displayLateTasks(tasks);
        
    } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
    }
}

// Afficher les tâches en retard
function displayLateTasks(tasks) {
    const tbody = document.querySelector('.table tbody');
    if (!tbody) return;
    
    if (!tasks || tasks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <i class="fas fa-check-circle" style="color: var(--success); font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Aucune tâche en retard</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = tasks.map(task => {
        const avatarUrl = task.assigne_avatar || `https://ui-avatars.com/api/?name=${task.assigne_prenom}+${task.assigne_nom}&background=4361ee&color=fff`;
        const priorityBadge = task.priorite === 'haute' ? 'urgent' : 'high';
        
        return `
            <tr>
                <td>
                    <div class="task-info">
                        <div class="task-title">${task.titre}</div>
                        <div class="task-desc">${task.description || 'Aucune description'}</div>
                    </div>
                </td>
                <td>${task.projet_nom || 'Non assigné'}</td>
                <td>
                    <div class="user-cell">
                        <img src="${avatarUrl}" alt="${task.assigne_prenom} ${task.assigne_nom}">
                        <span>${task.assigne_prenom || ''} ${task.assigne_nom || 'Non assigné'}</span>
                    </div>
                </td>
                <td>
                    <span class="date overdue">${formatDate(task.echeance)}</span>
                </td>
                <td>
                    <span class="badge ${priorityBadge}">${task.priorite === 'haute' ? 'Haute' : 'Moyenne'}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon small" onclick="completeTask(${task.id})" title="Marquer comme terminée">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Marquer une tâche comme terminée
window.completeTask = async function(taskId) {
    try {
        await taskService.updateTaskStatus(taskId, 'termine');
        showToast('Tâche marquée comme terminée', 'success');
        
        // Recharger les tâches
        await loadLateTasks();
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast(error.message || 'Erreur lors de la mise à jour', 'error');
    }
};

// Charger les utilisateurs pour les filtres
async function loadUsersForFilters() {
    try {
        const users = await userService.getUsers();
        const chefFilter = document.getElementById('chefFilter');
        
        if (!chefFilter) return;
        
        const chefs = users.filter(user => 
            user.role === 'chef_projet' || user.role === 'admin'
        );
        
        chefFilter.innerHTML = `
            <option value="">Tous</option>
            ${chefs.map(user => `
                <option value="${user.id}">${user.prenom} ${user.nom}</option>
            `).join('')}
        `;
        
    } catch (error) {
        console.error('Erreur chargement filtres:', error);
    }
}

// Charger les utilisateurs pour le formulaire
async function loadUsersForProjectForm() {
    try {
        const users = await userService.getUsers();
        const chefSelect = document.getElementById('chefSelectModal');
        const teamSelector = document.getElementById('teamSelector');
        
        if (chefSelect) {
            const chefs = users.filter(user => 
                user.role === 'chef_projet' || user.role === 'admin'
            );
            
            chefSelect.innerHTML = `
                <option value="">Sélectionner...</option>
                ${chefs.map(user => `
                    <option value="${user.id}">${user.prenom} ${user.nom} (${user.departement})</option>
                `).join('')}
            `;
        }
        
        if (teamSelector) {
            teamSelector.innerHTML = users.map(user => `
                <div class="form-check">
                    <input class="form-check-input member-checkbox" 
                           type="checkbox" 
                           id="user_${user.id}" 
                           value="${user.id}">
                    <label class="form-check-label" for="user_${user.id}">
                        ${user.prenom} ${user.nom} 
                        <small style="color: var(--text-secondary);">(${user.departement} - ${user.role})</small>
                    </label>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
    }
}

// Configurer les événements
function setupProjectsPageEvents() {
    // Appliquer les filtres
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', async () => {
            const filters = {
                statut: document.getElementById('statusFilter')?.value,
                priorite: document.getElementById('priorityFilter')?.value,
                chef_projet_id: document.getElementById('chefFilter')?.value
            };
            
            // Retirer les filtres vides
            Object.keys(filters).forEach(key => {
                if (!filters[key]) delete filters[key];
            });
            
            await loadProjects(filters);
            showToast('Filtres appliqués', 'success');
        });
    }
    
    // Formulaire de création de projet
    const newProjectForm = document.getElementById('newProjectForm');
    if (newProjectForm) {
        newProjectForm.addEventListener('submit', handleCreateProject);
    }
}

// Gérer la création d'un projet
async function handleCreateProject(event) {
    event.preventDefault();
    
    const form = event.target;
    
    // Chercher le bouton de soumission de manière plus robuste
    let submitBtn = document.getElementById('createProjectBtn');
    if (!submitBtn) {
        submitBtn = form.querySelector('button[type="submit"]');
    }
    
    if (!submitBtn) {
        console.error('Bouton de soumission non trouvé');
        showToast('Erreur: Bouton non trouvé', 'error');
        return;
    }
    
    const originalText = submitBtn.textContent;
    
    try {
        // Désactiver le bouton
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
        
        // Récupérer les données
        const formData = new FormData(form);
        const projectData = {
            nom: formData.get('nom'),
            description: formData.get('description'),
            chef_projet_id: parseInt(formData.get('chef_projet_id')),
            date_debut: formData.get('date_debut'),
            date_fin: formData.get('date_fin'),
            budget: formData.get('budget') ? parseFloat(formData.get('budget')) : null,
            priorite: formData.get('priorite'),
            membres: getSelectedMembers() // Vérifiez cette fonction
        };
        
        // Validation
        if (!projectData.nom) {
            throw new Error('Le nom du projet est requis');
        }
        if (!projectData.chef_projet_id) {
            throw new Error('Veuillez sélectionner un chef de projet');
        }
        if (!projectData.date_debut || !projectData.date_fin) {
            throw new Error('Les dates sont requises');
        }
        
        // Récupérer les membres sélectionnés
        projectData.membres = getSelectedMembers();
        
        // S'assurer que le chef de projet est dans la liste des membres si non présent
        if (projectData.chef_projet_id && !projectData.membres.includes(projectData.chef_projet_id)) {
            projectData.membres.push(projectData.chef_projet_id);
        }
        
        console.log('📤 Création projet:', projectData);
        
        // Envoyer au serveur
        const result = await projectService.createProject(projectData);
        console.log('✅ Projet créé:', result);
        
        // Succès
        showToast('Projet créé avec succès !', 'success');
        
        // Réinitialiser le formulaire
        form.reset();
        
        // Décocher toutes les cases
        document.querySelectorAll('.member-checkbox').forEach(cb => cb.checked = false);
        
        // Fermer la modal
        const modalElement = document.getElementById('newProjectModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
        
        // Recharger les projets
        await loadProjects();
        
    } catch (error) {
        console.error('Erreur création projet:', error);
        showToast(error.message || 'Erreur lors de la création', 'error');
    } finally {
        // Réactiver le bouton
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

// Mettre à jour l'interface selon le rôle
function updateProjectsPageUI() {
    if (!authService.user) return;
    
    // Cacher le bouton pour les employés
    const newProjectBtn = document.querySelector('[data-bs-target="#newProjectModal"]');
    if (newProjectBtn && authService.user.role === 'employe') {
        newProjectBtn.style.display = 'none';
    }
}


// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Page projets initialisée');
    await loadProjectsPage();
});