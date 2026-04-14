// database/migrate.js
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
    console.log('🚀 Démarrage des migrations...');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        multipleStatements: true
    });

    try {
        // Lire le fichier de schéma
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        // Exécuter le schéma
        await connection.query(schema);
        console.log('✅ Schéma de base de données créé avec succès');
        
        // Lire le fichier de seed
        const seedPath = path.join(__dirname, 'seed.sql');
        const seed = await fs.readFile(seedPath, 'utf8');
        
        // Exécuter le seed
        await connection.query(seed);
        console.log('✅ Données de test insérées avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors des migrations:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigrations();