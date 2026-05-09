const db = require('./config/db');

async function optimizeDatabase() {
    try {
        console.log('🚀 Starting Database Optimization: Adding Performance Indexes...');

        const operations = [
            // --- 1. system_logs ---
            { table: 'system_logs', col: 'trace_id', name: 'idx_trace_id' },
            
            // --- 2. tickets ---
            { table: 'tickets', col: 'status_id', name: 'idx_status_id' },
            { table: 'tickets', col: 'created_at', name: 'idx_created_at' },
            
            // --- 3. categories ---
            { table: 'categories', col: 'project_id', name: 'idx_project_id' },
            
            // --- 4. equipments ---
            { table: 'equipments', col: 'category_id', name: 'idx_category_id' }
        ];

        for (const op of operations) {
            try {
                console.log(`🔎 Adding index ${op.name} to ${op.table}(${op.col})...`);
                await db.query(`ALTER TABLE ${op.table} ADD INDEX ${op.name} (${op.col})`);
                console.log(`✅ Success: ${op.name} added.`);
            } catch (err) {
                if (err.code === 'ER_DUP_KEYNAME') {
                    console.log(`ℹ️ Skip: Index ${op.name} already exists.`);
                } else {
                    console.warn(`⚠️ Warning adding ${op.name}:`, err.message);
                }
            }
        }

        console.log('\n✨ Database Optimization Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Optimization Failed:', err.message);
        process.exit(1);
    }
}

optimizeDatabase();
