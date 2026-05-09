const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true // ✅ ป้องกันการแปลงวันที่เป็น UTC/Local Date Object อัตโนมัติ (แก้ปัญหาประวัติขยับ)
});

db.getConnection()
    .then((connection) => {
        console.log('✅ Connected to MySQL Database successfully!');
        console.log(`📡 Host: ${process.env.DB_HOST}, Database: ${process.env.DB_NAME}`);
        connection.release();
    })
    .catch((err) => {
        console.error('❌ Database connection failed!');
        console.error('Error details:', err.message);
        console.error('Check your .env file and ensure MySQL is running.');
    });

module.exports = db;
