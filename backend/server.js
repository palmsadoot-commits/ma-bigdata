const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer'); // นำเข้า multer 
const path = require('path');     // นำเข้า path สำหรับจัดการชื่อไฟล์
require('dotenv').config();
const bcrypt = require('bcrypt'); // นำเข้าเครื่องมือเข้ารหัส

const app = express();

// ==========================================
// ตั้งค่า Middleware
// ==========================================
app.use(cors());
app.use(express.json()); // อนุญาตให้ API รับส่งข้อมูลแบบ JSON

// อนุญาตให้หน้าเว็บ (Frontend) สามารถเข้าถึงรูปภาพในโฟลเดอร์ uploads ได้โดยตรง
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// ตั้งค่า Multer (ระบบจัดการไฟล์อัปโหลด)
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // ระบุโฟลเดอร์ที่จะบันทึกไฟล์ (ต้องสร้างโฟลเดอร์นี้ไว้ด้วย)
    },
    filename: function (req, file, cb) {
        // ตั้งชื่อไฟล์ใหม่ ป้องกันชื่อซ้ำกัน: เวลาระดับมิลลิวินาที + นามสกุลไฟล์เดิม
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// ==========================================
// ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL
// ==========================================
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ตรวจสอบสถานะการเชื่อมต่อฐานข้อมูล
db.getConnection()
    .then(() => console.log('✅ Connected to MySQL Database successfully!'))
    .catch((err) => console.error('❌ Database connection failed:', err.message));

// ==========================================
// เส้นทาง API (Routes)
// ==========================================

// 1. API: หน้าแรกสำหรับทดสอบว่า Server รันอยู่หรือไม่
app.get('/', (req, res) => {
    res.send('LIMS Ticketing System API is running...');
});

// 2. API: ดึงข้อมูลหมวดหมู่ระบบและอุปกรณ์ทั้งหมด
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// ==========================================
// API: สร้างใบแจ้งซ่อมใหม่ (Create Ticket) + รองรับการแนบไฟล์
// ==========================================
app.post('/api/tickets', upload.single('attachment'), async (req, res) => {
    try {
        const { reporter_id, category_id, equipment_no, software_no, problem_detail } = req.body;
        
        // ถ้ามีการแนบไฟล์มา ให้เก็บชื่อไฟล์ไว้ แต่ถ้าไม่มีให้เป็น null
        const attachment = req.file ? req.file.filename : null;

        if (!reporter_id || !category_id || !problem_detail) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
        }

        // สร้างเลขที่ใบแจ้งซ่อมอัตโนมัติ (Running Number)
        const currentYearBE = new Date().getFullYear() + 543; 
        
        const [rows] = await db.query('SELECT COUNT(*) as count FROM tickets WHERE ticket_number LIKE ?', [`%/${currentYearBE}`]);
        const nextNumber = rows[0].count + 1;
        const ticket_number = `${nextNumber}/${currentYearBE}`; 

        const sql = `
            INSERT INTO tickets 
            (ticket_number, reporter_id, category_id, equipment_no, software_no, problem_detail, status, attachment) 
            VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
        `;
        const values = [ticket_number, reporter_id, category_id, equipment_no, software_no, problem_detail, attachment];
        
        const [result] = await db.query(sql, values);

        res.status(201).json({ 
            message: 'บันทึกใบแจ้งซ่อมสำเร็จ!', 
            ticket_id: result.insertId,
            ticket_number: ticket_number 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
});

// ==========================================
// 🚨 API (เวอร์ชันสมบูรณ์): อัปเดตสถานะ และรองรับการรับไฟล์แนบเพิ่มเติม (อัปโหลดเข้า Server จริง)
// ==========================================
app.put('/api/tickets/:id/update-status', upload.array('attachments', 10), async (req, res) => {
    const ticket_id = req.params.id;
    const { status, technician_id, root_cause_and_solution } = req.body;

    try {
        // 1. อัปเดตสถานะในตาราง tickets
        await db.query('UPDATE tickets SET status = ? WHERE ticket_id = ?', [status, ticket_id]);

        // 2. ถ้าช่างกด "ส่งตรวจสอบ" (Resolved) ให้บันทึกวิธีแก้ไขลงตาราง ticket_resolutions
        if (status === 'Resolved' && root_cause_and_solution) {
            // เช็คว่าเคยมีข้อมูลการซ่อมใบนี้ในระบบหรือยัง
            const [existing] = await db.query(`SELECT * FROM ticket_resolutions WHERE ticket_id = ?`, [ticket_id]);
            
            if (existing.length > 0) {
                // ถ้าเคยมี (เช่น โดนตีกลับแล้วแก้ใหม่) -> ให้อัปเดตข้อมูลเดิมและอัปเดตเวลาใหม่
                const updateRes = `UPDATE ticket_resolutions SET root_cause_and_solution = ?, technician_id = ?, resolved_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`;
                await db.query(updateRes, [root_cause_and_solution, technician_id, ticket_id]);
            } else {
                // ถ้ายังไม่เคยมี -> ให้ Insert ใหม่
                const insertRes = `INSERT INTO ticket_resolutions (ticket_id, technician_id, root_cause_and_solution) VALUES (?, ?, ?)`;
                await db.query(insertRes, [ticket_id, technician_id, root_cause_and_solution]);
            }
        }

        // 3. จัดการไฟล์แนบ (ถ้ามีการแนบมาเพิ่ม ทั้งจากช่างตอนส่งแก้ หรือจากผู้แจ้งตอนตีกลับ)
        let savedFiles = [];
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                // บันทึกประวัติไฟล์ลงตาราง ticket_attachments
                const insertFileSql = `INSERT INTO ticket_attachments (ticket_id, file_name, file_path, uploaded_by) VALUES (?, ?, ?, ?)`;
                
                // file.originalname = ชื่อเดิม (เช่น error.png)
                // file.filename = ชื่อใหม่ที่ Server รันเลขใส่ให้กันซ้ำ (เช่น 169xxxx-error.png)
                await db.query(insertFileSql, [ticket_id, file.originalname, file.filename, technician_id]);
                
                // เก็บชื่อไฟล์ใหม่เพื่อส่งกลับไปให้หน้าเว็บ เอาไปบันทึก Log 
                savedFiles.push(file.filename); 
            }
        }

        res.json({ 
            success: true, 
            files: savedFiles, // ส่งอาร์เรย์รายชื่อไฟล์กลับไปที่ TicketDetail.jsx
            message: 'อัปเดตสถานะและบันทึกข้อมูลสำเร็จ' 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลและอัปโหลดไฟล์' });
    }
});

// ==========================================
// API: ดึงข้อมูลใบแจ้งซ่อมทั้งหมด (สำหรับหน้า Dashboard)
// ==========================================
app.get('/api/tickets', async (req, res) => {
    const project_id = req.query.project_id; 
    try {
        let sql = `
            SELECT 
                t.ticket_id, 
                t.ticket_number, 
                t.equipment_no, 
                t.problem_detail, 
                t.status, 
                t.created_at,
                t.attachment, 
                c.category_name,
                CONCAT(u.first_name, ' ', u.last_name) AS reporter_name  
            FROM tickets t
            LEFT JOIN categories c ON t.category_id = c.category_id
            LEFT JOIN users u ON t.reporter_id = u.user_id
        `;
        let params = [];

        if (project_id) {
            sql += ' WHERE c.project_id = ?';
            params.push(project_id);
        }

        sql += ' ORDER BY t.created_at DESC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// ==========================================
// API: ดึงข้อมูลใบแจ้งซ่อมแบบเจาะจง 1 ใบ (สำหรับหน้า Print/Detail)
// ==========================================
app.get('/api/tickets/:id', async (req, res) => {
    const ticket_id = req.params.id;
    try {
        const sql = `
            SELECT 
                t.*, 
                c.category_name, 
                c.category_type,
                CONCAT(u.first_name, ' ', u.last_name) AS reporter_name, 
                u.agency AS reporter_department, 
                u.phone_number AS reporter_phone,
                tr.root_cause_and_solution, 
                tr.resolved_at,
                CONCAT(tech.first_name, ' ', tech.last_name) AS technician_name,
                CONCAT(a.first_name, ' ', a.last_name) AS assigned_to_name
            FROM tickets t
            LEFT JOIN categories c ON t.category_id = c.category_id
            LEFT JOIN users u ON t.reporter_id = u.user_id
            LEFT JOIN ticket_resolutions tr ON t.ticket_id = tr.ticket_id
            LEFT JOIN users tech ON tr.technician_id = tech.user_id
            LEFT JOIN users a ON t.assigned_to = a.user_id
            WHERE t.ticket_id = ?
        `;
        const [rows] = await db.query(sql, [ticket_id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลใบแจ้งซ่อม' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ticket details' });
    }
});

// ==========================================
// API: ระบบเข้าสู่ระบบ (Login)
// ==========================================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const sql = `SELECT * FROM users WHERE username = ?`;
        const [rows] = await db.query(sql, [username]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้งานไม่ถูกต้อง!' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง!' });
        }

        delete user.password_hash; 
        res.json({ success: true, user: user });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' });
    }
});

// ดึงโปรเจกต์ทั้งหมด
app.get('/api/projects', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM projects');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// ==========================================
// API: เพิ่มผู้ใช้งานใหม่ 
// ==========================================
app.post('/api/register', async (req, res) => {
    const { username, password, first_name, last_name, role, project_id, agency } = req.body;
    try {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const sql = `INSERT INTO users (username, password_hash, first_name, last_name, role, project_id, agency) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await db.query(sql, [username, hashedPassword, first_name, last_name, role, project_id || null, agency || null]);
        
        res.json({ success: true, message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// ==========================================
// API: ดึงรายชื่อผู้ใช้งานทั้งหมด 
// ==========================================
app.get('/api/users', async (req, res) => {
    try {
        const sql = `
            SELECT 
                u.user_id, u.username, u.first_name, u.last_name, 
                u.role, u.agency, p.project_name
            FROM users u
            LEFT JOIN projects p ON u.project_id = p.project_id
            ORDER BY u.created_at DESC
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ==========================================
// API: อัปเดตข้อมูลส่วนตัว / เปลี่ยนรหัสผ่าน
// ==========================================
app.put('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    const { first_name, last_name, agency, new_password } = req.body;

    try {
        let sql = `UPDATE users SET first_name = ?, last_name = ?, agency = ?`;
        let params = [first_name, last_name, agency];

        if (new_password && new_password.trim() !== '') {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(new_password, 10);
            sql += `, password_hash = ?`;
            params.push(hashedPassword);
        }

        sql += ` WHERE user_id = ?`;
        params.push(userId);

        await db.query(sql, params);

        const [updatedUser] = await db.query(`SELECT * FROM users WHERE user_id = ?`, [userId]);
        const user = updatedUser[0];
        delete user.password_hash; 

        res.json({ success: true, message: 'อัปเดตข้อมูลสำเร็จ!', user: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลได้' });
    }
});

// ==========================================
// API: ดึงรายชื่อช่างตามโปรเจกต์ 
// ==========================================
app.get('/api/technicians', async (req, res) => {
    const project_id = req.query.project_id;
    try {
        let sql = `SELECT user_id, CONCAT(first_name, ' ', last_name) AS full_name 
                   FROM users 
                   WHERE role IN ('technician', 'head_technician') AND status = 'active'`;
        let params = [];
        
        if (project_id) {
            sql += ` AND project_id = ?`;
            params.push(project_id);
        }

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch technicians' });
    }
});

// ==========================================
// API: มอบหมายงาน (Assign Ticket)
// ==========================================
app.put('/api/tickets/:id/assign', async (req, res) => {
    const ticket_id = req.params.id;
    const { assigned_to } = req.body;
    try {
        const sql = `
            UPDATE tickets 
            SET assigned_to = ?, 
                status = IF(status = 'Pending', 'In Progress', status) 
            WHERE ticket_id = ?
        `;
        await db.query(sql, [assigned_to, ticket_id]);
        res.json({ success: true, message: 'มอบหมายงานสำเร็จ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to assign ticket' });
    }
});

// ==========================================
// API: ตีกลับงาน (ลูกน้องส่งคืนหัวหน้า / หรือยกเลิกการมอบหมาย)
// ==========================================
app.put('/api/tickets/:id/return', async (req, res) => {
    const ticket_id = req.params.id;
    try {
        const sql = `UPDATE tickets SET assigned_to = NULL, status = 'Pending' WHERE ticket_id = ?`;
        await db.query(sql, [ticket_id]);
        
        res.json({ success: true, message: 'ตีกลับงานสำเร็จ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to return ticket' });
    }
});

// ==========================================
// 1. API: ดึงประวัติการทำงาน (GET Logs)
// ==========================================
app.get('/api/tickets/:id/logs', async (req, res) => {
    try {
        const sql = `SELECT * FROM ticket_logs WHERE ticket_id = ? ORDER BY created_at ASC`;
        const [rows] = await db.query(sql, [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// ==========================================
// 2. API: บันทึกประวัติการทำงาน (POST Log)
// ==========================================
app.post('/api/tickets/:id/logs', async (req, res) => {
    const ticket_id = req.params.id;
    const { action, actor_name, detail } = req.body;
    try {
        const sql = `INSERT INTO ticket_logs (ticket_id, action, actor_name, detail) VALUES (?, ?, ?, ?)`;
        await db.query(sql, [ticket_id, action, actor_name, detail]);
        res.json({ success: true, message: 'Log added successfully' });
    } catch (err) {
        console.error('Error adding log:', err);
        res.status(500).json({ error: 'Failed to add log' });
    }
});

// ==========================================
// เปิดใช้งาน Server
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});