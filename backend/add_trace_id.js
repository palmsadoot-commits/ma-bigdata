const db = require('./config/db');

async function addTraceIdColumn() {
    try {
        console.log('🚀 Starting Database Migration: Adding trace_id to system_logs...');
        
        const sql = `
            ALTER TABLE system_logs 
            ADD COLUMN trace_id VARCHAR(50) DEFAULT NULL AFTER message;
        `;
        
        await db.query(sql);
        console.log('✅ Column "trace_id" added successfully!');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ Column "trace_id" already exists. Skipping...');
            process.exit(0);
        } else {
            console.error('❌ Migration Failed:', err.message);
            process.exit(1);
        }
    }
}

addTraceIdColumn();
