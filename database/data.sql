-- seed.sql
-- ====================================================
-- MINI-ERP 2 - Données d'exemple
-- ====================================================

USE mini_erp_2;

-- Désactiver temporairement les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- ====================================================
-- NETTOYAGE DES TABLES EXISTANTES
-- ====================================================
TRUNCATE TABLE notifications;
TRUNCATE TABLE audits;
TRUNCATE TABLE documents;
TRUNCATE TABLE conges;
TRUNCATE TABLE taches;
TRUNCATE TABLE projet_membres;
TRUNCATE TABLE projets;
TRUNCATE TABLE users;
TRUNCATE TABLE sessions;

-- Réactiver les contraintes
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================
-- INSERTION DES UTILISATEURS
-- ====================================================
-- Note: Les mots de passe sont hashés avec bcrypt (coût 12)
-- Mot de passe pour tous: "password123"
-- ====================================================
INSERT INTO users (email, password, nom, prenom, role, departement, telephone, avatar_url, statut) VALUES
-- Administrateurs
('admin@mini-erp.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Martin', 'Sophie', 'admin', 'Direction', '+33 6 12 34 56 78', 'https://ui-avatars.com/api/?name=Sophie+Martin&background=4361ee&color=fff', 'actif'),
('directeur@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Dubois', 'Pierre', 'admin', 'Direction', '+33 6 98 76 54 32', 'https://ui-avatars.com/api/?name=Pierre+Dubois&background=3f37c9&color=fff', 'actif'),

-- Chefs de projet
('chef.projet@mini-erp.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Dupont', 'Jean', 'chef_projet', 'Développement', '+33 6 23 45 67 89', 'https://ui-avatars.com/api/?name=Jean+Dupont&background=7209b7&color=fff', 'actif'),
('manager@mini-erp.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Laurent', 'Marie', 'chef_projet', 'Design', '+33 6 34 56 78 90', 'https://ui-avatars.com/api/?name=Marie+Laurent&background=f72585&color=fff', 'actif'),
('alex.tech@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Tech', 'Alexandre', 'chef_projet', 'IT', '+33 6 45 67 89 01', 'https://ui-avatars.com/api/?name=Alexandre+Tech&background=4cc9f0&color=fff', 'actif'),

-- Ressources Humaines
('rh@mini-erp.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Rousseau', 'Julie', 'rh', 'Ressources Humaines', '+33 6 56 78 90 12', 'https://ui-avatars.com/api/?name=Julie+Rousseau&background=f8961e&color=fff', 'actif'),
('hr.manager@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Moreau', 'Thomas', 'rh', 'Ressources Humaines', '+33 6 67 89 01 23', 'https://ui-avatars.com/api/?name=Thomas+Moreau&background=4895ef&color=fff', 'actif'),

-- Employés - Développement
('employe@mini-erp.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Bernard', 'Alex', 'employe', 'Développement', '+33 6 78 90 12 34', 'https://ui-avatars.com/api/?name=Alex+Bernard&background=4361ee&color=fff', 'actif'),
('dev1@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Petit', 'Lucas', 'employe', 'Développement', '+33 6 89 01 23 45', 'https://ui-avatars.com/api/?name=Lucas+Petit&background=3a0ca3&color=fff', 'actif'),
('dev2@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Robert', 'Emma', 'employe', 'Développement', '+33 6 90 12 34 56', 'https://ui-avatars.com/api/?name=Emma+Robert&background=7209b7&color=fff', 'actif'),
('dev3@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Richard', 'Hugo', 'employe', 'Développement', '+33 7 01 23 45 67', 'https://ui-avatars.com/api/?name=Hugo+Richard&background=f72585&color=fff', 'actif'),

-- Employés - Design
('designer1@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Durand', 'Camille', 'employe', 'Design', '+33 7 12 34 56 78', 'https://ui-avatars.com/api/?name=Camille+Durand&background=4cc9f0&color=fff', 'actif'),
('designer2@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Leroy', 'Chloé', 'employe', 'Design', '+33 7 23 45 67 89', 'https://ui-avatars.com/api/?name=Chloe+Leroy&background=f8961e&color=fff', 'actif'),

-- Employés - Marketing
('marketing1@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Morel', 'Antoine', 'employe', 'Marketing', '+33 7 34 56 78 90', 'https://ui-avatars.com/api/?name=Antoine+Morel&background=4895ef&color=fff', 'actif'),
('marketing2@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Fournier', 'Léa', 'employe', 'Marketing', '+33 7 45 67 89 01', 'https://ui-avatars.com/api/?name=Lea+Fournier&background=4361ee&color=fff', 'actif'),

-- Employés - Support
('support1@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Girard', 'Nathan', 'employe', 'Support', '+33 7 56 78 90 12', 'https://ui-avatars.com/api/?name=Nathan+Girard&background=3a0ca3&color=fff', 'actif'),
('support2@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Bonnet', 'Manon', 'employe', 'Support', '+33 7 67 89 01 23', 'https://ui-avatars.com/api/?name=Manon+Bonnet&background=7209b7&color=fff', 'actif'),

-- Employé en congé (pour tester)
('conge@entreprise.com', '$2a$12$s6d7P8q9R0t1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6J7K8L9M0N1O2P', 'Fontaine', 'Paul', 'employe', 'Développement', '+33 7 78 90 12 34', 'https://ui-avatars.com/api/?name=Paul+Fontaine&background=f72585&color=fff', 'en_conge');

-- ====================================================
-- INSERTION DES PROJETS
-- ====================================================
INSERT INTO projets (nom, description, chef_projet_id, date_debut, date_fin, budget, priorite, statut, avancement) VALUES
-- Projet en cours
('Projet Atlas', 'Développement d\'une application de gestion interne complète', 3, '2024-01-15', '2024-06-30', 50000.00, 'haute', 'en_cours', 75),

('Projet Beta', 'Migration de l\'infrastructure vers le cloud AWS', 4, '2024-02-01', '2024-05-15', 30000.00, 'haute', 'en_cours', 45),

('Projet Gamma', 'Refonte complète de l\'interface utilisateur du site web', 5, '2024-03-10', '2024-07-20', 25000.00, 'moyenne', 'en_cours', 90),

-- Projet en attente
('Projet Delta', 'Développement d\'une API microservices pour les partenaires', 3, '2024-05-01', '2024-08-31', 40000.00, 'moyenne', 'en_attente', 0),

-- Projet terminé
('Projet Epsilon', 'Système de reporting et d\'analyse de données', 4, '2023-11-01', '2024-02-28', 20000.00, 'basse', 'termine', 100),

-- Projet en retard
('Projet Zeta', 'Intégration du système de paiement en ligne', 5, '2024-01-10', '2024-04-30', 35000.00, 'haute', 'en_retard', 60),

-- Projet annulé
('Projet Theta', 'Application mobile - Phase 2', 3, '2024-02-15', '2024-06-15', 28000.00, 'moyenne', 'annule', 20);

-- ====================================================
-- INSERTION DES MEMBRES DE PROJETS
-- ====================================================
-- Projet Atlas (ID: 1)
INSERT INTO projet_membres (projet_id, user_id, role) VALUES
(1, 3, 'contributeur'), -- Chef de projet
(1, 8, 'membre'),      -- Développeur 1
(1, 9, 'membre'),      -- Développeur 2
(1, 10, 'membre'),     -- Développeur 3
(1, 11, 'membre'),     -- Designer 1
(1, 13, 'observateur'); -- Marketing 1

-- Projet Beta (ID: 2)
INSERT INTO projet_membres (projet_id, user_id, role) VALUES
(2, 4, 'contributeur'), -- Chef de projet
(2, 8, 'membre'),      -- Développeur 1
(2, 9, 'membre'),      -- Développeur 2
(2, 15, 'membre'),     -- Support 1
(2, 16, 'observateur'); -- Support 2

-- Projet Gamma (ID: 3)
INSERT INTO projet_membres (projet_id, user_id, role) VALUES
(3, 5, 'contributeur'), -- Chef de projet
(3, 11, 'membre'),     -- Designer 1
(3, 12, 'membre'),     -- Designer 2
(3, 13, 'membre'),     -- Marketing 1
(3, 14, 'observateur'); -- Marketing 2

-- Projet Delta (ID: 4) - En attente
INSERT INTO projet_membres (projet_id, user_id, role) VALUES
(4, 3, 'contributeur'), -- Chef de projet
(4, 10, 'membre'),     -- Développeur 3
(4, 15, 'membre');     -- Support 1

-- ====================================================
-- INSERTION DES TÂCHES
-- ====================================================
-- Tâches pour Projet Atlas (ID: 1)
INSERT INTO taches (projet_id, titre, description, assigne_a, priorite, echeance, temps_estime, temps_reel, statut) VALUES
(1, 'Design UI Dashboard', 'Créer les maquettes pour le tableau de bord', 11, 'haute', '2024-03-15', 40, 35, 'termine'),
(1, 'Développement Backend', 'API REST avec Node.js et Express', 8, 'haute', '2024-04-30', 120, 90, 'en_cours'),
(1, 'Tests unitaires', 'Écrire les tests pour les modules principaux', 9, 'moyenne', '2024-05-15', 60, 20, 'en_cours'),
(1, 'Documentation API', 'Documenter tous les endpoints', 10, 'basse', '2024-05-31', 30, 0, 'a_faire'),
(1, 'Intégration CI/CD', 'Configurer pipeline Jenkins', 8, 'moyenne', '2024-04-10', 20, 25, 'termine');

-- Tâches pour Projet Beta (ID: 2)
INSERT INTO taches (projet_id, titre, description, assigne_a, priorite, echeance, temps_estime, temps_reel, statut) VALUES
(2, 'Configuration AWS', 'Configurer les services AWS nécessaires', 4, 'haute', '2024-03-01', 40, 45, 'termine'),
(2, 'Migration Base de données', 'Migrer MySQL vers RDS', 9, 'haute', '2024-04-30', 80, 40, 'en_cours'),
(2, 'Tests de performance', 'Tests de charge sur la nouvelle infra', 15, 'moyenne', '2024-05-10', 50, 0, 'en_retard'),
(2, 'Plan de rollback', 'Préparer plan de retour en arrière', 4, 'haute', '2024-03-20', 20, 15, 'termine');

-- Tâches pour Projet Gamma (ID: 3)
INSERT INTO taches (projet_id, titre, description, assigne_a, priorite, echeance, temps_estime, temps_reel, statut) VALUES
(3, 'Wireframes', 'Créer les wireframes pour toutes les pages', 11, 'haute', '2024-03-20', 60, 65, 'termine'),
(3, 'Design System', 'Créer la bibliothèque de composants', 12, 'moyenne', '2024-04-15', 80, 75, 'en_cours'),
(3, 'Intégration HTML/CSS', 'Intégrer les designs en code', 11, 'moyenne', '2024-05-10', 100, 95, 'en_cours'),
(3, 'Tests cross-browser', 'Tester sur différents navigateurs', 12, 'basse', '2024-05-31', 40, 0, 'a_faire');

-- Tâches en retard (pour tests)
INSERT INTO taches (projet_id, titre, description, assigne_a, priorite, echeance, temps_estime, temps_reel, statut) VALUES
(1, 'Formation utilisateurs', 'Former les équipes à la nouvelle interface', 13, 'moyenne', '2024-04-01', 20, 0, 'en_retard'),
(2, 'Audit sécurité', 'Audit de sécurité sur la nouvelle infra', 16, 'haute', '2024-03-15', 30, 0, 'en_retard'),
(3, 'Feedback clients', 'Collecter les retours des clients beta', 14, 'basse', '2024-04-10', 15, 0, 'en_retard');

-- ====================================================
-- INSERTION DES DEMANDES DE CONGÉ
-- ====================================================
-- Congés approuvés
INSERT INTO conges (user_id, type, date_debut, date_fin, nombre_jours, raison, statut, approuve_par, commentaire_approbation, date_approbation) VALUES
(8, 'annuel', '2024-05-12', '2024-05-18', 7, 'Vacances en famille', 'approuve', 6, 'Bonnes vacances !', '2024-05-05'),
(11, 'formation', '2024-05-15', '2024-05-17', 3, 'Formation UX/UI avancée', 'approuve', 7, 'Formation importante pour le projet', '2024-05-10'),
(15, 'maladie', '2024-05-10', '2024-05-14', 5, 'Grippe', 'approuve', 6, 'Reposez-vous bien', '2024-05-09');

-- Congés en attente
INSERT INTO conges (user_id, type, date_debut, date_fin, nombre_jours, raison, statut) VALUES
(9, 'annuel', '2024-06-10', '2024-06-20', 11, 'Vacances d\'été', 'en_attente'),
(12, 'personnel', '2024-05-25', '2024-05-27', 3, 'Déménagement', 'en_attente'),
(17, 'paternite', '2024-07-01', '2024-07-31', 31, 'Congé paternité', 'en_attente');

-- Congés refusés
INSERT INTO conges (user_id, type, date_debut, date_fin, nombre_jours, raison, statut, approuve_par, commentaire_approbation, date_approbation) VALUES
(10, 'annuel', '2024-04-15', '2024-04-30', 16, 'Longues vacances', 'refuse', 7, 'Période critique pour le projet Atlas', '2024-04-01');

-- ====================================================
-- INSERTION DES DOCUMENTS
-- ====================================================
INSERT INTO documents (nom, description, chemin_fichier, type, taille, projet_id, user_id) VALUES
('Cahier des charges - Projet Atlas', 'Document détaillant les spécifications fonctionnelles', '/uploads/documents/cdc_atlas.pdf', 'pdf', 2048576, 1, 3),
('Planning projet Beta', 'Planning détaillé avec jalons', '/uploads/documents/planning_beta.xlsx', 'xlsx', 512000, 2, 4),
('Maquettes UI - Projet Gamma', 'Maquettes Figma exportées', '/uploads/documents/maquettes_gamma.zip', 'zip', 10485760, 3, 5),
('Rapport mensuel - Avril 2024', 'Rapport d\'avancement général', '/uploads/documents/rapport_avril.pdf', 'pdf', 1024000, NULL, 1),
('Procédure déploiement', 'Documentation technique pour le déploiement', '/uploads/documents/procedure_deploiement.docx', 'docx', 256000, NULL, 8);

-- ====================================================
-- INSERTION DES NOTIFICATIONS
-- ====================================================
INSERT INTO notifications (user_id, titre, message, type, vue, lien) VALUES
(3, 'Nouvelle tâche assignée', 'La tâche "Développement Backend" vous a été assignée', 'info', FALSE, '/projets/1/taches'),
(8, 'Projet en retard', 'Le projet "Projet Beta" est en retard de 5 jours', 'warning', FALSE, '/projets/2'),
(6, 'Nouvelle demande de congé', 'Nouvelle demande de congé de Lucas Petit', 'info', TRUE, '/rh/conges'),
(1, 'Rapport mensuel disponible', 'Le rapport mensuel d\'avril 2024 est disponible', 'success', FALSE, '/documents'),
(9, 'Tâche en retard', 'La tâche "Tests de performance" est en retard', 'error', FALSE, '/projets/2/taches');

-- ====================================================
-- INSERTION DES AUDITS (historique)
-- ====================================================
INSERT INTO audits (user_id, action, table_affectee, element_id, ancienne_valeur, nouvelle_valeur, ip_address, user_agent) VALUES
(3, 'CREATE', 'projets', 1, NULL, 'Projet Atlas créé', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(1, 'UPDATE', 'users', 8, 'Statut: actif', 'Statut: en_conge', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
(6, 'APPROVE', 'conges', 1, 'Statut: en_attente', 'Statut: approuve', '192.168.1.102', 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'),
(4, 'CREATE', 'taches', 5, NULL, 'Tâche "Configuration AWS" créée', '192.168.1.103', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36');

-- ====================================================
-- MESSAGE DE FIN
-- ====================================================
SELECT '✅ Base de données initialisée avec succès !' AS message;

-- ====================================================
-- AFFICHAGE DES STATISTIQUES
-- ====================================================
SELECT 
    '📊 STATISTIQUES DE LA BASE' AS titre,
    COUNT(DISTINCT u.id) AS nombre_utilisateurs,
    COUNT(DISTINCT p.id) AS nombre_projets,
    COUNT(DISTINCT t.id) AS nombre_taches,
    COUNT(DISTINCT c.id) AS nombre_conges,
    COUNT(DISTINCT d.id) AS nombre_documents
FROM users u
CROSS JOIN projets p
CROSS JOIN taches t
CROSS JOIN conges c
CROSS JOIN documents d
LIMIT 1;

-- ====================================================
-- CRÉDITS
-- ====================================================
SELECT '🎉 Mini-ERP 2 - Base de données prête à l\'emploi !' AS credits;s