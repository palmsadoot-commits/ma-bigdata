const db = require('../config/db');
const { sysLog } = require('../utils/logger');

async function setupGeminiDB() {
    console.log('🚀 Starting Gemini Database Setup...');
    
    const queries = [
        `CREATE TABLE IF NOT EXISTS gemini_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) DEFAULT 'New Chat',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            is_archived BOOLEAN DEFAULT FALSE,
            INDEX (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
        
        `CREATE TABLE IF NOT EXISTS gemini_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_id INT NOT NULL,
            role ENUM('user', 'model') NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (session_id),
            FOREIGN KEY (session_id) REFERENCES gemini_sessions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    ];

    try {
        for (const query of queries) {
            await db.query(query);
            console.log(`✅ Executed query successfully.`);
        }
        console.log('🎉 Gemini Database tables are ready!');
        await sysLog('INFO', 'SYSTEM', 'Gemini Database tables initialized.');
    } catch (error) {
        console.error('❌ Error setting up Gemini Database:', error);
        await sysLog('ERROR', 'SYSTEM', `Gemini Database setup failed: ${error.message}`);
    } finally {
        process.exit(0);
    }
}

setupGeminiDB();
