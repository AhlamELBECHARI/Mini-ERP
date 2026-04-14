// database/seed.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    console.log('🌱 Démarrage du peuplement de la base de données...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'mini_erp_2'
    });

    try {
        // 1. Désactiver les contraintes
        console.log('1. Désactivation des contraintes...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // 2. Nettoyer les tables (sauf sessions)
        console.log('\n2. Nettoyage des tables...');
        const tables = ['users', 'projets', 'projet_membres', 'taches', 'conges', 'documents', 'audits', 'notifications'];
        
        for (const table of tables) {
            await connection.execute(`DELETE FROM ${table}`);
            console.log(`  ✅ Table ${table} nettoyée`);
        }

        // 3. Créer les utilisateurs
        console.log('\n3. Création des utilisateurs...');
        
        const usersData = [
            ['admin@mini-erp.com', 'admin123', 'Martin', 'Sophie', 'admin', 'Direction', '+33 6 12 34 56 78'],
            ['chef.projet@mini-erp.com', 'chef123', 'Dupont', 'Jean', 'chef_projet', 'Développement', '+33 6 23 45 67 89'],
            ['rh@mini-erp.com', 'rh123', 'Laurent', 'Marie', 'rh', 'RH', '+33 6 34 56 78 90'],
            ['employe@mini-erp.com', 'employe123', 'Bernard', 'Alex', 'employe', 'Développement', '+33 6 45 67 89 01'],
            ['employe2@mini-erp.com', 'employe123', 'Durand', 'Julie', 'employe', 'Design', '+33 6 56 78 90 12']
        ];

        for (const [email, password, nom, prenom, role, departement, telephone] of usersData) {
            const hashedPassword = await bcrypt.hash(password, 12);
            const [result] = await connection.execute(
                `INSERT INTO users (email, password, nom, prenom, role, departement, telephone) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [email, hashedPassword, nom, prenom, role, departement, telephone]
            );
            console.log(`  ✅ ${email} créé (ID: ${result.insertId})`);
        }

        // 4. Créer des projets
        console.log('\n4. Création des projets...');
        
        const projetsData = [
            ['Projet Atlas', 'Développement application web', 2, '2024-01-15', '2024-06-30', 50000, 'haute'],
            ['Projet Beta', 'Migration infrastructure cloud', 2, '2024-02-01', '2024-05-15', 30000, 'moyenne'],
            ['Projet Gamma', 'Refonte interface utilisateur', 1, '2024-03-01', '2024-07-31', 25000, 'basse']
        ];

        for (const [nom, description, chef_projet_id, date_debut, date_fin, budget, priorite] of projetsData) {
            const [result] = await connection.execute(
                `INSERT INTO projets (nom, description, chef_projet_id, date_debut, date_fin, budget, priorite, statut, avancement)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'en_cours', 45)`,
                [nom, description, chef_projet_id, date_debut, date_fin, budget, priorite]
            );
            console.log(`  ✅ Projet "${nom}" créé (ID: ${result.insertId})`);
        }

        // 5. Ajouter des membres aux projets
        console.log('\n5. Ajout des membres aux projets...');
        
        const membresData = [
            [1, 4], // Projet 1, Employé Alex
            [1, 5], // Projet 1, Employé Julie
            [2, 4], // Projet 2, Employé Alex
            [3, 5]  // Projet 3, Employé Julie
        ];

        for (const [projet_id, user_id] of membresData) {
            await connection.execute(
                'INSERT INTO projet_membres (projet_id, user_id) VALUES (?, ?)',
                [projet_id, user_id]
            );
            console.log(`  ✅ Membre ${user_id} ajouté au projet ${projet_id}`);
        }

        // 6. Créer des tâches
        console.log('\n6. Création des tâches...');
        
        const tachesData = [
            [1, 'Design UI', 'Créer les maquettes Figma', 5, 'haute', '2024-05-15', 40],
            [1, 'Développement Backend', 'API REST avec Node.js', 4, 'haute', '2024-06-15', 120],
            [2, 'Configuration serveurs', 'Setup des instances cloud', 4, 'moyenne', '2024-04-30', 60],
            [3, 'Tests utilisateurs', 'Recueil feedback utilisateurs', 5, 'basse', '2024-07-15', 30]
        ];

        for (const [projet_id, titre, description, assigne_a, priorite, echeance, temps_estime] of tachesData) {
            const [result] = await connection.execute(
                `INSERT INTO taches (projet_id, titre, description, assigne_a, priorite, echeance, temps_estime, statut)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'a_faire')`,
                [projet_id, titre, description, assigne_a, priorite, echeance, temps_estime]
            );
            console.log(`  ✅ Tâche "${titre}" créée (ID: ${result.insertId})`);
        }

        // 7. Créer des demandes de congé
        console.log('\n7. Création des demandes de congé...');
        
        const congesData = [
            [4, 'annuel', '2024-07-01', '2024-07-15', 15, 'Vacances d\'été'],
            [5, 'formation', '2024-06-10', '2024-06-12', 3, 'Formation React'],
            [4, 'maladie', '2024-05-20', '2024-05-21', 2, 'Grippe']
        ];

        for (const [user_id, type, date_debut, date_fin, nombre_jours, raison] of congesData) {
            const statut = Math.random() > 0.5 ? 'approuve' : 'en_attente';
            const approuve_par = statut === 'approuve' ? 3 : null; // RH approuve
            
            const [result] = await connection.execute(
                `INSERT INTO conges (user_id, type, date_debut, date_fin, nombre_jours, raison, statut, approuve_par, date_approbation)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [user_id, type, date_debut, date_fin, nombre_jours, raison, statut, approuve_par, statut === 'approuve' ? new Date() : null]
            );
            console.log(`  ✅ Congé pour user ${user_id} créé (Statut: ${statut})`);
        }

        // 8. Réactiver les contraintes
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log('\n🎉 Peuplement terminé avec succès !');
        console.log('\n📋 Comptes de test :');
        console.log('──────────────────────');
        console.log('1. admin@mini-erp.com / admin123 (Administrateur)');
        console.log('2. chef.projet@mini-erp.com / chef123 (Chef de projet)');
        console.log('3. rh@mini-erp.com / rh123 (RH)');
        console.log('4. employe@mini-erp.com / employe123 (Employé - Dev)');
        console.log('5. employe2@mini-erp.com / employe123 (Employé - Design)');
        console.log('──────────────────────');

    } catch (error) {
        console.error('\n❌ Erreur lors du peuplement:', error.message);
        throw error;
    } finally {
        await connection.end();
        console.log('\n✨ Base de données prête !');
    }
}

// Exécuter le seed
seedDatabase().catch(console.error);