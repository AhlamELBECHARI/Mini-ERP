// js/services.js - Services pour l'intégration avec le backend

const API_BASE_URL = 'http://localhost:3000/api';

// ==================== CLIENT API CENTRALISÉ ====================
// Fonction générique pour tous les appels API (avec token auto et gestion erreurs)
async function apiRequest(endpoint, options = {}) {
    // Récupérer le token
    const token = localStorage.getItem('token');
    
    // Headers par défaut
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };
    
    // Ajouter le token si existant
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    // Configuration finale
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        // Gestion de la session expirée
        if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/verify') {
            authService.logout();
            throw new Error('Session expirée ou non autorisée. Veuillez vous reconnecter.');
        }
        
        // Parser la réponse JSON
        let data;
        try {
            data = await response.json();
        } catch (e) {
            // Dans le cas où l'API ne renvoie pas de JSON (ex: suppression réussi sans corps)
            data = { success: response.ok };
        }
        
        // Si la réponse n'est pas OK (4xx, 5xx)
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Une erreur serveur est survenue');
        }
        
        // Retourner les données
        return data.data !== undefined ? data.data : data;
        
    } catch (error) {
        console.error(`❌ Erreur API [${options.method || 'GET'} ${endpoint}]:`, error);
        throw error;
    }
}

// ==================== SERVICE D'AUTHENTIFICATION ====================
const authService = {
    user: null,
    token: null,

    // Initialiser à partir du localStorage
    init() {
        this.token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined') {
            try {
                this.user = JSON.parse(userStr);
            } catch (e) {
                console.error('Erreur parsing user:', e);
            }
        }
    },

    // Connexion
    async login(email, password) {
        try {
            // Ici on n'utilise pas apiRequest car le format de retour attendu par login.js
            // nécessite { success, user, error }, on fait un fetch standard ou on adapte.
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.token = data.token;
                this.user = data.user;
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error || 'Connexion échouée' };
            }
        } catch (error) {
            console.error('Erreur login:', error);
            return { success: false, error: 'Erreur de connexion au serveur' };
        }
    },

    // Vérifier la session
    async checkSession() {
        if (!this.token) return false;

        try {
            // On bypass apiRequest ici pour ne pas déclencher une boucle (car c'est la vérification)
            const response = await fetch(`${API_BASE_URL}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user) {
                    this.user = data.user;
                    localStorage.setItem('user', JSON.stringify(data.user));
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Erreur vérification session:', error);
            return false;
        }
    },

    // Déconnexion
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
};

// ==================== SERVICE UTILISATEURS ====================
const userService = {
    async getUsers() {
        return await apiRequest('/users');
    },

    async getCurrentUser() {
        return await apiRequest('/users/me');
    },

    async updateProfile(userId, userData) {
        // Renvoie l'utilisateur mis à jour
        return await apiRequest(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    async deleteUser(userId) {
        return await apiRequest(`/users/${userId}`, {
            method: 'DELETE'
        });
    }
};

// ==================== SERVICE PROJETS ====================
const projectService = {
    async getAllProjects(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const url = `/projects${queryParams ? '?' + queryParams : ''}`;
        return await apiRequest(url);
    },

    async getProjectById(projectId) {
        return await apiRequest(`/projects/${projectId}`);
    },

    async createProject(projectData) {
        return await apiRequest('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    },

    async updateProject(projectId, updates) {
        return await apiRequest(`/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    async deleteProject(projectId) {
        return await apiRequest(`/projects/${projectId}`, {
            method: 'DELETE'
        });
    }
};

// ==================== SERVICE TÂCHES ====================
const taskService = {
    async getLateTasks() {
        // En supposant que le backend supporte /tasks/late
        return await apiRequest('/tasks/late');
    },

    async updateTaskStatus(taskId, status) {
        return await apiRequest(`/tasks/${taskId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ statut: status })
        });
    }
};

// ==================== SERVICES CONGÉS ====================
const leaveService = {
    async getAll(filters = {}) {
        const params = new URLSearchParams(filters);
        return await apiRequest(`/leaves?${params}`);
    },

    async getPending() {
        return await apiRequest('/leaves/pending');
    },

    async create(leaveData) {
        return await apiRequest('/leaves', {
            method: 'POST',
            body: JSON.stringify(leaveData)
        });
    },

    async approve(leaveId, commentaire = '') {
        return await apiRequest(`/leaves/${leaveId}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ commentaire_approbation: commentaire })
        });
    },

    async reject(leaveId, commentaire = '') {
        return await apiRequest(`/leaves/${leaveId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ commentaire_approbation: commentaire })
        });
    },

    async getStats() {
        return await apiRequest('/rh/stats'); // On pointe vers une route plus globale
    }
};

// ==================== SERVICES DOCUMENTS ====================
const documentService = {
    async getAll(filters = {}) {
        const params = new URLSearchParams(filters);
        return await apiRequest(`/documents?${params}`);
    },

    async getStats() {
        return await apiRequest('/documents/stats');
    },

    async upload(files, projectId = null) {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        if (projectId) {
            formData.append('projet_id', projectId);
        }

        // Nous devons gérer l'upload avec fetch directement car apiRequest utilise JSON.stringify
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Non authentifié');

        const response = await fetch('http://localhost:3000/api/documents/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Ne PAS définir 'Content-Type': 'multipart/form-data', le navigateur le fait automatiquement avec boundary
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
        }

        return await response.json();
    }
};

// ==================== UTILITAIRES ====================

// Fonction pour afficher des notifications toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4cc9f0' : type === 'error' ? '#f72585' : '#4361ee'};
        color: white;
        border-radius: 8px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
    `;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
    
    // Ajouter les styles s'ils n'existent pas
    if (!document.querySelector('#toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Fonction pour formater une date
function formatDate(dateString) {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// Fonction pour mettre à jour l'interface utilisateur
function updateUserInterface() {
    if (!authService.user) return;
    
    const roleLabels = {
        'admin': 'Administrateur',
        'chef_projet': 'Chef de Projet',
        'rh': 'Responsable RH',
        'employe': 'Employé'
    };
    
    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = `${authService.user.prenom} ${authService.user.nom}`;
    });
    
    document.querySelectorAll('.user-role').forEach(el => {
        el.textContent = roleLabels[authService.user.role] || authService.user.role;
    });
    
    document.querySelectorAll('.user-avatar img').forEach(el => {
        if (authService.user.avatar_url) {
            el.src = authService.user.avatar_url;
        } else {
            // Fallback UI Avatar
            el.src = `https://ui-avatars.com/api/?name=${authService.user.prenom}+${authService.user.nom}&background=4361ee&color=fff`;
        }
    });

    // Optionnel: Cacher les menus RH/Paramètres si non autorisé
    if (authService.user.role === 'employe') {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => el.style.display = 'none');
    }
}

// Initialiser authService au chargement
authService.init();

// Exporter pour utilisation globale
window.apiRequest = apiRequest;
window.authService = authService;
window.userService = userService;
window.projectService = projectService;
window.taskService = taskService;
window.leaveService = leaveService;
window.documentService = documentService;
window.showToast = showToast;
window.formatDate = formatDate;
window.updateUserInterface = updateUserInterface;