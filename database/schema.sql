-- schema.sql
CREATE DATABASE IF NOT EXISTS mini_erp_2;
USE mini_erp_2;

-- Table utilisateurs
CREATE TABLE users (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table projets
CREATE TABLE projets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    chef_projet_id INT,
    date_debut DATE NOT NULL,
    date_fin DATE,
    budget DECIMAL(12, 2),
    priorite ENUM('haute', 'moyenne', 'basse') DEFAULT 'moyenne',
    statut ENUM('en_attente', 'en_cours', 'termine', 'annule') DEFAULT 'en_attente',
    avancement INT DEFAULT 0 CHECK (avancement >= 0 AND avancement <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (chef_projet_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Table projet_membres (relation many-to-many)
CREATE TABLE projet_membres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    projet_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('membre', 'contributeur', 'observateur') DEFAULT 'membre',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_membre (projet_id, user_id),
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table tâches
CREATE TABLE taches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    projet_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    assigne_a INT,
    priorite ENUM('haute', 'moyenne', 'basse') DEFAULT 'moyenne',
    echeance DATE,
    temps_estime INT, -- en heures
    temps_reel INT DEFAULT 0,
    statut ENUM('a_faire', 'en_cours', 'termine', 'en_retard', 'annule') DEFAULT 'a_faire',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projet_id) REFERENCES projets(id) ON DELETE CASCADE,
    FOREIGN KEY (assigne_a) REFERENCES users(id) ON DELETE SET NULL
);

-- Table congés
CREATE TABLE conges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('annuel', 'maladie', 'formation', 'personnel', 'maternite', 'paternite', 'autre') DEFAULT 'annuel',
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
);

-- Table documents
CREATE TABLE documents (
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
);

-- Table audits (pour le suivi des actions)
CREATE TABLE audits (
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
);

-- Table notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
    vue BOOLEAN DEFAULT FALSE,
    lien VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table sessions (si vous utilisez express-session avec MySQL store)
CREATE TABLE IF NOT EXISTS sessions (
    session_id varchar(128) COLLATE utf8mb4_bin NOT NULL,
    expires int(11) unsigned NOT NULL,
    data mediumtext COLLATE utf8mb4_bin,
    PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Index pour optimiser les performances
CREATE INDEX idx_projets_statut ON projets(statut);
CREATE INDEX idx_projets_chef_projet ON projets(chef_projet_id);
CREATE INDEX idx_taches_projet ON taches(projet_id);
CREATE INDEX idx_taches_assigne ON taches(assigne_a);
CREATE INDEX idx_conges_user ON conges(user_id);
CREATE INDEX idx_conges_statut ON conges(statut);
CREATE INDEX idx_conges_dates ON conges(date_debut, date_fin);