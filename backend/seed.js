const mysql = require('mysql2/promise');

async function seedDatabase() {
    console.log('🌱 Démarrage du peuplement de la base de données...\n');

    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '1234',
        database: 'mini_erp_2'
    });

    try {
        // 1. Désactiver les contraintes
        console.log('1. Désactivation des contraintes...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // 2. Nettoyer les tables
        console.log('\n2. Nettoyage des tables...');
        await connection.execute('TRUNCATE TABLE users');
        await connection.execute('TRUNCATE TABLE projets');
        console.log('  ✅ Tables nettoyées');

        // 3. Créer les utilisateurs avec mots de passe en CLAIR
        console.log('\n3. Création des utilisateurs...');
        
        const usersData = [
            ['admin@mini-erp.com', 'admin123', 'Martin', 'Sophie', 'admin', 'Direction', '+33 6 12 34 56 78'],
            ['chef.projet@mini-erp.com', 'chef123', 'Dupont', 'Jean', 'chef_projet', 'Développement', '+33 6 23 45 67 89'],
            ['manager@mini-erp.com', 'manager123', 'Laurent', 'Marie', 'manager', 'Design', '+33 6 34 56 78 90'],
            ['employe@mini-erp.com', 'employe123', 'Bernard', 'Alex', 'employe', 'Développement', '+33 6 45 67 89 01']
        ];

        for (const [email, password, nom, prenom, role, departement, telephone] of usersData) {
            const [result] = await connection.execute(
                `INSERT INTO users (email, password, nom, prenom, role, departement, telephone) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [email, password, nom, prenom, role, departement, telephone]
            );
            console.log(`  ✅ ${email} créé (mot de passe: ${password})`);
        }

        // 4. Créer quelques projets
        console.log('\n4. Création des projets...');
        await connection.execute(
            `INSERT INTO projets (nom, description, chef_projet_id, date_debut, date_fin, budget, priorite, statut, avancement)
             VALUES ('Projet Test', 'Projet de démonstration', 2, '2024-05-20', '2024-06-20', 10000, 'haute', 'en_cours', 50)`
        );

        // 5. Réactiver les contraintes
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log('\n🎉 Peuplement terminé avec succès !');
        console.log('\n📋 Comptes de test :');
        console.log('──────────────────────');
        console.log('1. admin@mini-erp.com / admin123 (Administrateur)');
        console.log('2. chef.projet@mini-erp.com / chef123 (Chef de projet)');
        console.log('3. manager@mini-erp.com / manager123 (Manager)');
        console.log('4. employe@mini-erp.com / employe123 (Employé)');
        console.log('──────────────────────');

    } catch (error) {
        console.error('\n❌ Erreur lors du peuplement:', error.message);
    } finally {
        await connection.end();
        console.log('\n✨ Base de données prête !');
    }
}

seedDatabase();