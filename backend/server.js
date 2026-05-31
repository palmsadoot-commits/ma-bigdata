const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const errorHandler = require('./middleware/errorHandler');
const trafficLogger = require('./middleware/trafficLogger');
const threatDetector = require('./middleware/threatDetector'); // ✅ นำเข้า Threat Engine
const { sysLog } = require('./utils/logger');
const { simpleSanitize } = require('./utils/dataHelper'); // ✅ นำเข้า Sanitizer
const cronService = require('./services/cronService');
const { authenticateToken, requireRole } = require('./middleware/auth');

const app = express();

// ✅ ตั้งค่า Trust Proxy สำหรับการรันหลัง Proxy (เช่น ngrok, Nginx, Cloudflare)
app.set('trust proxy', 1);

// --- 1. Basic Middlewares ---
app.use(threatDetector); // ✅ เปิดใช้งานระบบตรวจจับและป้องกันภัยคุกคาม (First Priority)
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// ✅ ติดตั้งระบบ Traffic Tracking ระดับโลก
app.use(trafficLogger);

// --- 2. Advanced Security ---
app.use(cors({
    origin: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use((req, res, next) => {
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, 
    contentSecurityPolicy: false, 
}));

// ✅ [New] Express 5 Compatible XSS Protection Middleware
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj !== 'object' || obj === null) return;
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = simpleSanitize(obj[key]);
            } else if (typeof obj[key] === 'object') {
                sanitize(obj[key]); // Recursive sanitize for nested objects
            }
        }
    };
    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);
    next();
});

const limiter = rateLimit({


    windowMs: 5 * 60 * 1000, 
    max: 2000,
    message: { error: 'Too many requests' },
    skip: (req) => req.method === 'OPTIONS', 
});
app.use('/api/', limiter);

// --- 3. Static Files & Dirs ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/backups', express.static(path.join(__dirname, '../backups'))); 

const dirs = [
    'uploads/', 
    'uploads/avatars/', 
    '../backups/', 
    '../backups/database/', 
    '../backups/source/', 
    '../backups/github_sync/'
];
dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// --- 4. Route Definition ---
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const projectRoutes = require('./routes/projectRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const backupRoutes = require('./routes/backupRoutes');
const cleanupRoutes = require('./routes/cleanupRoutes'); // ✅ เพิ่มการนำเข้า Cleanup
const statusRoutes = require('./routes/statusRoutes');
const settingRoutes = require('./routes/settingRoutes');
const auditRoutes = require('./routes/auditRoutes');
const menuRoutes = require('./routes/menuRoutes');
const authRoutes = require('./routes/authRoutes'); // ✅ เพิ่ม Auth Routes

const securityRoutes = require('./routes/securityRoutes'); // ✅ เพิ่มการนำเข้า Security
const reportRoutes = require('./routes/reportRoutes'); // ✅ เพิ่มการนำเข้า Reports

// API Mount Points
const userController = require('./controllers/userController');
app.post('/api/login', userController.login);
app.post('/api/register', authenticateToken, requireRole(['admin']), userController.register);

app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/equipments', equipmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/auth', authRoutes); // ✅ ติดตั้ง Auth Routes สำหรับ Social Login
app.use('/api/cleanup', cleanupRoutes); // ✅ ติดตั้ง Cleanup Routes
app.use('/api/security', securityRoutes); // ✅ ติดตั้ง Security Routes
app.use('/api/reports', reportRoutes); // ✅ ติดตั้ง Report Routes

// ✅ [New] Health Check Endpoint
app.get('/api/health', async (req, res) => {
    const db = require('./config/db');
    const health = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: new Date(),
        checks: {
            server: 'UP',
            database: 'Unknown'
        }
    };
    try {
        await db.query('SELECT 1');
        health.checks.database = 'CONNECTED';
        res.status(200).json(health);
    } catch (err) {
        health.message = 'ERROR';
        health.checks.database = 'DISCONNECTED';
        health.error = err.message;
        res.status(503).json(health);
    }
});

// 🚩 [TEMPORARY] Test Routes for Logging Verification
app.get('/api/test/error', (req, res) => {
    // จำลอง Error: เรียกใช้ตัวแปรที่ไม่ได้ประกาศไว้ (ReferenceError)
    const result = someUndefinedVariable + 10; 
    res.json({ result });
});

app.get('/api/test/critical', async (req, res) => {
    const { sysLog } = require('./utils/logger');
    // จำลองเหตุการณ์วิกฤตระดับสูงสุด
    await sysLog('CRITICAL', 'SYSTEM', 'CRITICAL: Database connection pool exhausted! System is unable to process new requests.', {
        req,
        metadata: {
            service: 'MySQL Connection Pool',
            active_connections: 100,
            max_limit: 100,
            action_required: 'Immediate server scaling or connection leak investigation'
        }
    });
    res.status(503).json({ error: 'Service Unavailable', message: 'System is under critical load' });
});

app.use('/api/backup', backupRoutes);

app.use('/api/github', backupRoutes);
app.get('/', (req, res) => { res.send('LMIS API is online'); });

// --- 5. Error & Start ---
app.use(errorHandler);

// ✅ ดักจับ Error ระดับ Process (ป้องกันการตายเงียบ)
process.on('uncaughtException', async (err) => {
    console.error('❌ CRITICAL: Uncaught Exception:', err.message);
    await sysLog('CRITICAL', 'ERROR', `[Uncaught Exception] ${err.message}`, { metadata: { stack: err.stack } });
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('❌ CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
    await sysLog('CRITICAL', 'ERROR', `[Unhandled Rejection] ${reason}`, { metadata: { reason: reason } });
});

const PORT = process.env.PORT || 3000;
let server;

// --- 5. Server Start (HTTP/HTTPS) ---
const sslPath = path.join(__dirname, 'certs');
const sslOptions = {
    key: fs.existsSync(path.join(sslPath, 'mol.go.th.key')) ? fs.readFileSync(path.join(sslPath, 'mol.go.th.key')) : null,
    cert: fs.existsSync(path.join(sslPath, 'star_mol_go_th.crt')) ? fs.readFileSync(path.join(sslPath, 'star_mol_go_th.crt')) : null,
    ca: fs.existsSync(path.join(sslPath, 'RapidSSL_TLS_RSA_CA_G1.crt')) ? fs.readFileSync(path.join(sslPath, 'RapidSSL_TLS_RSA_CA_G1.crt')) : null
};

if (sslOptions.key && sslOptions.cert) {
    const https = require('https');
    server = https.createServer(sslOptions, app);
    server.listen(PORT, async () => {
        console.log(`🔒 Secure Server is running on https://ma-bigdata.mol.go.th:${PORT} (via HTTPS)`);
        await sysLog('INFO', 'SYSTEM', `Secure server started on port ${PORT} with SSL`);
        await initializeServices();
    });
} else {
    server = app.listen(PORT, async () => {
        console.log(`🚀 Server is running on port ${PORT} (via HTTP)`);
        await sysLog('INFO', 'SYSTEM', `Server started on port ${PORT} (SSL missing)`);
        await initializeServices();
    });
}

async function initializeServices() {
    try {
        await cronService.setupCronJob();
        await cronService.setupSourceCronJob();
        await cronService.setupGithubCronJob();
        await cronService.setupGDriveCronJob();
        await cronService.setupCleanupCronJob();
        await cronService.setupTaskHistoryCronJob();
    } catch (e) { console.error("Cron Error:", e.message); }
}

// ✅ ขยายเวลา Timeout เป็น 10 นาที สำหรับงาน Backup หนักๆ
server.timeout = 600000; 
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
