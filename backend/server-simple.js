require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Servir les fichiers statiques du dossier frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rediriger la racine vers index.html (ou login.html si pas de session, géré côté client)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// CrÃ©er le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration de Multer pour l'upload de fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB limit

// Configuration MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mini_erp_2',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test de connexion
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('âœ… MySQL connectÃ© avec succÃ¨s!');
        
        // CrÃ©er les tables si elles n'existent pas
        await createTables(connection);
        
        connection.release();
        return true;
    } catch (error) {
        console.error('âŒ Erreur MySQL:', error.message);
        return false;
    }
}

async function createTables(connection) {
    try {
        // CrÃ©er la table users si elle n'existe pas
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                nom VARCHAR(100) NOT NULL,
                prenom VARCHAR(100) NOT NULL,
                role ENUM('admin', 'chef_projet', 'rh', 'employe') DEFAULT 'employe',
                departement VARCHAR(100),
                telephone VARCHAR(20),
                avatar_url VARCHAR(500),
                statut ENUM('actif', 'inactif', 'en_conge') DEFAULT 'actif',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // CrÃ©er la table projets
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS projets (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nom VARCHAR(255) NOT NULL,
                description TEXT,
                chef_projet_id INT,
                date_debut DATE,
                date_fin DATE,
                budget DECIMAL(12, 2),
                priorite ENUM('haute', 'moyenne', 'basse') DEFAULT 'moyenne',
                statut ENUM('en_attente', 'en_cours', 'termine', 'annule') DEFAULT 'en_attente',
                avancement INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chef_projet_id) REFERENCES users(id)
            )
        `);
        
        // CrÃ©er la table projet_membres
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS projet_membres (
                id INT PRIMARY KEY AUTO_INCREMENT,
                projet_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        // Créer la table taches
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS taches (
                id INT PRIMARY KEY AUTO_INCREMENT,
                projet_id INT NOT NULL,
                titre VARCHAR(255) NOT NULL,
                description TEXT,
                assigne_a INT,
                priorite ENUM('haute', 'moyenne', 'basse') DEFAULT 'moyenne',
                echeance DATE,
                temps_estime INT,
                statut ENUM('a_faire', 'en_cours', 'termine', 'en_retard', 'annule') DEFAULT 'a_faire',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE,
                FOREIGN KEY (assigne_a) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        
        // Créer la table conges
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS conges (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                type ENUM('annuel', 'maladie', 'formation', 'personnel', 'autre') DEFAULT 'annuel',
                date_debut DATE NOT NULL,
                date_fin DATE NOT NULL,
                nombre_jours INT NOT NULL,
                raison TEXT,
                statut ENUM('en_attente', 'approuve', 'refuse') DEFAULT 'en_attente',
                approuve_par INT,
                commentaire_approbation TEXT,
                date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_approbation TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (approuve_par) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Créer la table documents
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS documents (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nom VARCHAR(255) NOT NULL,
                description TEXT,
                chemin_fichier VARCHAR(500) NOT NULL,
                type VARCHAR(50),
                taille INT,
                projet_id INT,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        // Créer la table audits
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS audits (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                action VARCHAR(100) NOT NULL,
                table_affectee VARCHAR(100),
                element_id INT,
                ancienne_valeur TEXT,
                nouvelle_valeur TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Créer la table notifications
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                titre VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
                vue BOOLEAN DEFAULT FALSE,
                lien VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        
        console.log('âœ… Tables crÃ©Ã©es avec succÃ¨s');
        
        // Insérer des données de test si la table est vide
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
        if (users[0].count === 0) {
            const hashedPwd = await bcrypt.hash('admin123', 10);
            await connection.execute(`
                INSERT INTO users (email, password, nom, prenom, role, departement) VALUES
                ('admin@test.com', ?, 'Admin', 'Test', 'admin', 'Direction'),
                ('chef@test.com', ?, 'Dupont', 'Jean', 'chef_projet', 'Développement'),
                ('rh@test.com', ?, 'Martin', 'Sophie', 'rh', 'RH'),
                ('employe@test.com', ?, 'Durand', 'Pierre', 'employe', 'Développement')
            `, [hashedPwd, hashedPwd, hashedPwd, hashedPwd]);
            console.log('✅ Utilisateurs de test créés (Password: admin123)');
        } else {
            // Toujours s'assurer que l'admin principal a un mot de passe connu pour le test
            const hashedAdminPwd = await bcrypt.hash('admin123', 10);
            await connection.execute(
                'UPDATE users SET password = ? WHERE id = 1 OR email = "admin@mini-erp.com"',
                [hashedAdminPwd]
            );
            console.log('✅ Mot de passe Admin synchronisé (admin@mini-erp.com : admin123)');
        }
        
    } catch (error) {
        console.error('âŒ Erreur crÃ©ation tables:', error.message);
    }
}

// Middleware d'authentification
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Token manquant' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        
        next();
    } catch (error) {
        console.error('Erreur auth:', error);
        return res.status(401).json({ error: 'Token invalide' });
    }
};

// ==================== ROUTES ====================

// Route test
app.get('/api/test', (req, res) => {
    res.json({ message: 'API Mini-ERP fonctionnelle!' });
});

// Login avec support BCrypt
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Utilisateur non trouvé' });
        }
        
        const user = users[0];
        
        // Vérifier le mot de passe (BCrypt)
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            // Fallback pour les mots de passe non hachés (pour les anciens tests)
            if (password !== user.password) {
                return res.status(401).json({ error: 'Mot de passe incorrect' });
            }
        }
        
        // CrÃ©er le token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '24h' }
        );
        
        // Retourner sans le mot de passe
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            token,
            user: userWithoutPassword
        });
        
    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// VÃ©rifier le token
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, email, nom, prenom, role, departement FROM users WHERE id = ?',
            [req.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvÃ©' });
        }
        
        res.json({
            authenticated: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==================== UTILISATEURS ====================

// RÃ©cupÃ©rer tous les utilisateurs
app.get('/api/users', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, email, nom, prenom, role, departement, telephone FROM users'
        );
        
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// RÃ©cupÃ©rer le profil courant
app.get('/api/users/me', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, email, nom, prenom, role, departement, telephone FROM users WHERE id = ?',
            [req.userId]
        );
        
        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Mettre Ã  jour un utilisateur
app.put('/api/users/:id', authMiddleware, async (req, res) => {
    try {
        // Validation basique (un utilisateur ne peut modifier que son propre profil si non admin)
        if (req.userRole !== 'admin' && parseInt(req.params.id) !== req.userId) {
            return res.status(403).json({ error: 'AccÃ¨s non autorisÃ©' });
        }
        
        const updates = [];
        const params = [];
        
        if (req.body.telephone !== undefined) {
            updates.push('telephone = ?');
            params.push(req.body.telephone);
        }
        if (req.body.departement !== undefined && req.userRole === 'admin') {
            updates.push('departement = ?');
            params.push(req.body.departement);
        }
        
        if (updates.length === 0) {
            return res.json({ success: true, message: 'Aucune modification apportÃ©e' });
        }
        
        params.push(req.params.id);
        
        await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        
        // Renvoyer les nouvelles donnÃ©es
        const [updatedUser] = await pool.execute(
            'SELECT id, email, nom, prenom, role, departement, telephone FROM users WHERE id = ?',
            [req.params.id]
        );
        
        res.json({
            success: true,
            data: updatedUser[0],
            message: 'Profil mis Ã  jour'
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==================== PROJETS ====================

// RÃ©cupÃ©rer tous les projets
app.get('/api/projects', authMiddleware, async (req, res) => {
    try {
        const [projects] = await pool.execute(`
            SELECT p.*, u.nom as chef_nom, u.prenom as chef_prenom 
            FROM projets p
            LEFT JOIN users u ON p.chef_projet_id = u.id
            ORDER BY p.created_at DESC
        `);
        
        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// RÃ©cupÃ©rer un projet par ID
app.get('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
        const [projects] = await pool.execute(`
            SELECT p.*, u.nom as chef_nom, u.prenom as chef_prenom 
            FROM projets p
            LEFT JOIN users u ON p.chef_projet_id = u.id
            WHERE p.id = ?
        `, [req.params.id]);
        
        if (projects.length === 0) {
            return res.status(404).json({ error: 'Projet non trouvÃ©' });
        }
        
        res.json({
            success: true,
            data: projects[0]
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Créer un projet
app.post('/api/projects', authMiddleware, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { nom, description, chef_projet_id, date_debut, date_fin, budget, priorite, membres } = req.body;
        
        const [result] = await connection.execute(
            `INSERT INTO projets (nom, description, chef_projet_id, date_debut, date_fin, budget, priorite, statut) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'en_cours')`,
            [nom, description || '', chef_projet_id, date_debut, date_fin, budget || 0, priorite || 'moyenne']
        );
        
        const projectId = result.insertId;
        
        // Ajouter les membres
        if (membres && Array.isArray(membres) && membres.length > 0) {
            const values = membres.map(userId => [projectId, userId, 'membre']);
            await connection.query(
                'INSERT INTO projet_membres (projet_id, user_id, role) VALUES ?',
                [values]
            );
        } else if (chef_projet_id) {
            // Toujours ajouter le chef de projet comme membre au minimum
            await connection.execute(
                'INSERT INTO projet_membres (projet_id, user_id, role) VALUES (?, ?, ?)',
                [projectId, chef_projet_id, 'membre']
            );
        }
        
        await connection.commit();
        
        // Logger l'action
        await logAction(req.userId, 'create', 'projets', projectId, { nom });

        res.status(201).json({
            success: true,
            message: 'Projet créé avec succès',
            projectId: projectId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Erreur création projet:', error);
        res.status(500).json({ error: 'Erreur lors de la création du projet' });
    } finally {
        connection.release();
    }
});

// ==================== TÃ‚CHES ====================

// RÃ©cupÃ©rer les tÃ¢ches d'un projet
app.get('/api/projects/:id/tasks', authMiddleware, async (req, res) => {
    try {
        const [tasks] = await pool.execute(
            `SELECT t.*, u.nom as assigne_nom, u.prenom as assigne_prenom
             FROM taches t
             LEFT JOIN users u ON t.assigne_a = u.id
             WHERE t.projet_id = ?
             ORDER BY t.created_at DESC`,
            [req.params.id]
        );
        
        res.json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// CrÃ©er une tÃ¢che
app.post('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const { projet_id, titre, description, assigne_a, priorite, echeance } = req.body;
        
        const [result] = await pool.execute(
            `INSERT INTO taches (projet_id, titre, description, assigne_a, priorite, echeance) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [projet_id, titre, description || '', assigne_a || null, priorite || 'moyenne', echeance || null]
        );
        
        res.status(201).json({
            success: true,
            message: 'TÃ¢che crÃ©Ã©e',
            taskId: result.insertId
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// RÃ©cupÃ©rer les tÃ¢ches en retard
app.get('/api/tasks/late', authMiddleware, async (req, res) => {
    try {
        let query = `
            SELECT t.*, p.nom as projet_nom, u.nom as assigne_nom, u.prenom as assigne_prenom 
            FROM taches t
            LEFT JOIN projets p ON t.projet_id = p.id
            LEFT JOIN users u ON t.assigne_a = u.id
            WHERE t.statut != 'termine' AND t.echeance < CURDATE()
        `;
        
        const params = [];
        
        // Si l'utilisateur est un simple employÃ©, ne voir que ses tÃ¢ches
        if (req.userRole === 'employe') {
            query += ' AND t.assigne_a = ?';
            params.push(req.userId);
        }
        
        query += ' ORDER BY t.echeance ASC';
        
        const [tasks] = await pool.execute(query, params);
        
        res.json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Mettre Ã  jour le statut d'une tÃ¢che
app.put('/api/tasks/:id/status', authMiddleware, async (req, res) => {
    try {
        const { statut } = req.body;
        
        if (!statut) {
            return res.status(400).json({ error: 'Statut manquant' });
        }
        
        await pool.execute(
            'UPDATE taches SET statut = ? WHERE id = ?',
            [statut, req.params.id]
        );
        
        res.json({
            success: true,
            message: 'Statut mis Ã  jour'
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==================== CONGÃ‰S ====================

// CrÃ©er une demande de congÃ©
app.post('/api/leaves', authMiddleware, async (req, res) => {
    try {
        const { type, date_debut, date_fin, raison } = req.body;
        
        // Calculer le nombre de jours
        const date1 = new Date(date_debut);
        const date2 = new Date(date_fin);
        const diffTime = Math.abs(date2 - date1);
        const nombre_jours = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        const [result] = await pool.execute(
            `INSERT INTO conges (user_id, type, date_debut, date_fin, nombre_jours, raison, statut) 
             VALUES (?, ?, ?, ?, ?, ?, 'en_attente')`,
            [req.userId, type, date_debut, date_fin, nombre_jours, raison || '']
        );
        
        res.status(201).json({
            success: true,
            message: 'Demande de congÃ© crÃ©Ã©e',
            leaveId: result.insertId
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// RÃ©cupÃ©rer les congÃ©s
app.get('/api/leaves', authMiddleware, async (req, res) => {
    try {
        let query = `
            SELECT c.*, u.nom, u.prenom, u.email, u.departement 
            FROM conges c
            JOIN users u ON c.user_id = u.id
        `;
        
        const params = [];
        
        // Filtres selon le rÃ´le
        if (req.userRole === 'employe') {
            query += ' WHERE c.user_id = ?';
            params.push(req.userId);
        }
        
        query += ' ORDER BY c.date_demande DESC';
        
        const [leaves] = await pool.execute(query, params);
        
        res.json({
            success: true,
            data: leaves
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// RÃ©cupÃ©rer les congÃ©s en attente
app.get('/api/leaves/pending', authMiddleware, async (req, res) => {
    try {
        let query = `
            SELECT c.*, u.nom as user_nom, u.prenom as user_prenom, u.avatar_url 
            FROM conges c
            JOIN users u ON c.user_id = u.id
            WHERE c.statut = 'en_attente'
        `;
        
        // Si employÃ© normal, on ne voit que ses propres attentes
        const params = [];
        if (req.userRole === 'employe') {
            query += ' AND c.user_id = ?';
            params.push(req.userId);
        }
        
        query += ' ORDER BY c.date_demande ASC LIMIT 10';
        
        const [leaves] = await pool.execute(query, params);
        
        res.json({
            success: true,
            data: leaves
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Approuver un congÃ©
app.put('/api/leaves/:id/approve', authMiddleware, async (req, res) => {
    try {
        // Seul un admin ou RH/chef devrait pouvoir approuver (simplifiÃ© ici)
        if (req.userRole === 'employe') {
            return res.status(403).json({ error: 'AccÃ¨s non autorisÃ©' });
        }
        
        await pool.execute('UPDATE conges SET statut = "approuve", approuve_par = ?, date_approbation = NOW() WHERE id = ?', 
            [req.userId, req.params.id]);
            
        // Logger l'action
        await logAction(req.userId, 'approve', 'conges', req.params.id);

        res.json({ success: true, message: 'Congé approuvé' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Refuser un congÃ©
app.put('/api/leaves/:id/reject', authMiddleware, async (req, res) => {
    try {
        if (req.userRole === 'employe') {
            return res.status(403).json({ error: 'AccÃ¨s non autorisÃ©' });
        }
        
        await pool.execute('UPDATE conges SET statut = "refuse", reponse_par = ?, date_reponse = NOW() WHERE id = ?', 
            [req.userId, req.params.id]);
            
        res.json({ success: true, message: 'CongÃ© refusÃ©' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==================== RH STATS ====================
app.get('/api/rh/stats', authMiddleware, async (req, res) => {
    try {
        // Obtenir des stats de base
        const [enAttente] = await pool.execute('SELECT COUNT(*) as count FROM conges WHERE statut = "en_attente"');
        const [approuve] = await pool.execute('SELECT COUNT(*) as count FROM conges WHERE statut = "approuve"');
        const [total] = await pool.execute('SELECT COUNT(*) as count FROM conges');
        
        // Simuler des chiffres complexes pour le dashboard si la DB est vide
        const countVal = total[0].count;
        const taux_approbation = countVal > 0 ? Math.round((approuve[0].count / countVal) * 100) : 100;
        
        res.json({
            success: true,
            data: {
                absences_en_cours: approuve[0].count,
                total_demandes: countVal,
                taux_approbation: taux_approbation,
                en_attente: enAttente[0].count
            }
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==================== DASHBOARD ====================

// Statistiques du dashboard
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
    try {
        // 1. KPI Stats
        const [projectStats] = await pool.execute(`
            SELECT COUNT(*) as activeProjects FROM projets WHERE statut = 'en_cours'
        `);
        const [taskStats] = await pool.execute(`
            SELECT COUNT(*) as lateTasks FROM taches WHERE statut != 'termine' AND date_echeance < CURDATE()
        `);
        const [leaveStats] = await pool.execute(`
            SELECT COUNT(*) as currentLeaves FROM conges WHERE statut = 'approuve' AND CURDATE() BETWEEN date_debut AND date_fin
        `);
        const [docStats] = await pool.execute(`
            SELECT COUNT(*) as recentDocs FROM documents WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);

        const stats = {
            activeProjects: projectStats[0].activeProjects || 0,
            lateTasks: taskStats[0].lateTasks || 0,
            currentLeaves: leaveStats[0].currentLeaves || 0,
            recentDocs: docStats[0].recentDocs || 0
        };

        // 2. Charts data
        // Projets Progress
        const [projectsProgress] = await pool.execute(`
            SELECT nom, avancement FROM projets WHERE statut = 'en_cours' LIMIT 5
        `);

        // Absence Rate (Simplifié)
        const [absenceStats] = await pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM conges WHERE statut = 'approuve' AND CURDATE() BETWEEN date_debut AND date_fin) as on_leave
        `);
        
        const totalUsers = absenceStats[0].total_users || 1;
        const onLeave = absenceStats[0].on_leave || 0;
        const present = totalUsers - onLeave;

        const charts = {
            projectsProgress: projectsProgress,
            absenceRate: {
                present: present,
                absent: onLeave,
                teletravail: 0 // Placeholder
            }
        };

        // 3. Recent Projects List
        const [projectsList] = await pool.execute(`
            SELECT p.*, u.nom as chef_nom, u.prenom as chef_prenom 
            FROM projets p
            LEFT JOIN users u ON p.chef_projet_id = u.id
            ORDER BY p.created_at DESC LIMIT 4
        `);

        res.json({
            success: true,
            data: { stats, charts, projectsList }
        });
    } catch (error) {
        console.error('Erreur dashboard stats:', error);
        res.status(500).json({ error: 'Erreur serveur lors du chargement du dashboard' });
    }
});

// ==================== ROUTES GESTION DOCUMENTAIRE ====================

// 1. Uploader un document
app.post('/api/documents/upload', authMiddleware, upload.array('files'), async (req, res) => {
    try {
        const { projet_id } = req.body;
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'Aucun fichier n\'a Ã©tÃ© uploadÃ©.' });
        }
        
        const uploadedDocs = [];
        
        for (const file of files) {
            let fileType = 'autre';
            const ext = path.extname(file.originalname).toLowerCase();
            if (['.pdf'].includes(ext)) fileType = 'pdf';
            else if (['.doc', '.docx'].includes(ext)) fileType = 'word';
            else if (['.xls', '.xlsx'].includes(ext)) fileType = 'excel';
            else if (['.ppt', '.pptx'].includes(ext)) fileType = 'ppt';
            else if (['.jpg', '.jpeg', '.png'].includes(ext)) fileType = 'image';
            
            const [result] = await pool.execute(
                `INSERT INTO documents (nom, chemin_fichier, type, taille, projet_id, user_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [file.originalname, file.filename, fileType, file.size, projet_id || null, req.userId]
            );
            
            uploadedDocs.push({
                id: result.insertId,
                nom: file.originalname,
                chemin_fichier: file.filename,
                type: fileType,
                taille: file.size
            });
        }
        
        res.status(201).json({
            success: true,
            message: `${files.length} fichier(s) uploadÃ©(s) avec succÃ¨s`,
            data: uploadedDocs
        });
        
    } catch (error) {
        console.error('Erreur upload:', error);
        res.status(500).json({ error: "Erreur lors de l'upload" });
    }
});

// 2. RÃ©cupÃ©rer tous les documents
app.get('/api/documents', authMiddleware, async (req, res) => {
    try {
        const { projet_id, type } = req.query;
        let query = `
            SELECT d.*, 
                   u.nom as user_nom, u.prenom as user_prenom, u.avatar_url,
                   p.nom as projet_nom
            FROM documents d
            JOIN users u ON d.user_id = u.id
            LEFT JOIN projets p ON d.projet_id = p.id
            WHERE 1=1
        `;
        const params = [];
        
        if (projet_id) {
            query += ' AND d.projet_id = ?';
            params.push(projet_id);
        }
        
        if (type && type !== 'all' && type !== 'recent' && type !== 'shared') {
            query += ' AND d.type = ?';
            params.push(type);
        }
        
        query += ' ORDER BY d.created_at DESC';
        
        if (type === 'recent') {
            query += ' LIMIT 10';
        }
        
        const [documents] = await pool.execute(query, params);
        
        res.json({
            success: true,
            data: documents
        });
        
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 3. Obtenir les statistiques de stockage
app.get('/api/documents/stats', authMiddleware, async (req, res) => {
    try {
        // Obtenir la taille totale utilisÃ©e et par type
        const [statsRows] = await pool.execute(`
            SELECT type, COUNT(*) as count, SUM(taille) as total_size 
            FROM documents 
            GROUP BY type
        `);
        
        let totalSize = 0;
        const totalDocuments = statsRows.reduce((acc, curr) => acc + curr.count, 0);
        
        let typesDist = {
            pdf: { count: 0, percentage: 0 },
            word: { count: 0, percentage: 0 },
            excel: { count: 0, percentage: 0 },
            ppt: { count: 0, percentage: 0 }
        };
        
        statsRows.forEach(row => {
            totalSize += Number(row.total_size) || 0;
            if (typesDist[row.type]) {
                typesDist[row.type].count = row.count;
            }
        });
        
        // Calculer les pourcentages par rapport au nombre total de documents (ou taille)
        if (totalDocuments > 0) {
            Object.keys(typesDist).forEach(type => {
                typesDist[type].percentage = Math.round((typesDist[type].count / totalDocuments) * 100);
            });
        }
        
        res.json({
            success: true,
            data: {
                total_size_bytes: totalSize,
                total_documents: totalDocuments,
                max_size_bytes: 10 * 1024 * 1024 * 1024, // 10 GB limit pour l'exemple
                types: typesDist
            }
        });
        
    } catch (error) {
        console.error('Erreur stat docs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==================== ROUTES DASHBOARD & WORKFLOW ====================

// Fonction helper pour logger les actions
async function logAction(userId, action, table, elementId = null, newValue = null, oldValue = null) {
    try {
        await pool.execute(
            `INSERT INTO audits (user_id, action, table_affectee, element_id, nouvelle_valeur, ancienne_valeur) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, action, table, elementId, 
             newValue ? JSON.stringify(newValue) : null, 
             oldValue ? JSON.stringify(oldValue) : null]
        );
    } catch (error) {
        console.error('Erreur audit logger:', error);
    }
}

// Workflows/Audits
app.get('/api/audits', authMiddleware, async (req, res) => {
    try {
        const [audits] = await pool.execute(`
            SELECT a.*, u.nom as user_nom, u.prenom as user_prenom, u.avatar_url
            FROM audits a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 20
        `);
        res.json({ success: true, data: audits });
    } catch (error) {
        console.error('Erreur audits:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route de santÃ©
app.get('/health', async (req, res) => {
    const dbStatus = await testConnection();
    res.json({
        status: 'OK',
        database: dbStatus ? 'CONNECTED' : 'DISCONNECTED',
        timestamp: new Date().toISOString()
    });
});

// Route 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvÃ©e' });
});

// DÃ©marrer le serveur
app.listen(PORT, async () => {
    console.log(`
    ðŸš€ Serveur dÃ©marrÃ© sur http://localhost:${PORT}
    ðŸ“ Environnement: ${process.env.NODE_ENV || 'development'}
    ðŸ—„ï¸  Base: ${process.env.DB_NAME || 'mini_erp_2'}
    
    ðŸ“ Points d'accÃ¨s:
    - ðŸ” Login: POST http://localhost:${PORT}/api/auth/login
    - ðŸ“Š Projets: GET http://localhost:${PORT}/api/projects
    - ðŸ‘¥ Utilisateurs: GET http://localhost:${PORT}/api/users
    - ðŸŽ¯ TÃ¢ches: POST http://localhost:${PORT}/api/tasks
    - ðŸ–ï¸  CongÃ©s: GET http://localhost:${PORT}/api/leaves
    - ðŸ“ˆ Dashboard: GET http://localhost:${PORT}/api/dashboard/stats
    - â¤ï¸  SantÃ©: GET http://localhost:${PORT}/health
    `);
    
    // Tester la connexion
    await testConnection();
});

