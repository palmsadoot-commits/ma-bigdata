const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * Service handling all User-related operations
 */
const userService = {
    /**
     * ตรวจสอบข้อมูลผู้ใช้งานและรหัสผ่าน
     */
    async validateLogin(username, password) {
        const [rows] = await db.query(`SELECT * FROM users WHERE username = ?`, [username]);
        if (rows.length === 0) return { success: false, reason: 'User not found' };

        const user = rows[0];
        let isMatch = false;

        // รองรับทั้ง MD5 (แบบเก่า) และ BCrypt (แบบใหม่)
        if (user.password_hash.length === 32) {
            isMatch = (crypto.createHash('md5').update(password).digest('hex') === user.password_hash);
        } else {
            isMatch = await bcrypt.compare(password, user.password_hash);
        }

        if (!isMatch) return { success: false, reason: 'Wrong password', user };
        
        return { success: true, user };
    },

    /**
     * ดึงรายการผู้ใช้งานทั้งหมด
     */
    async getAllUsers() {
        const sql = `SELECT u.user_id, u.username, u.first_name, u.last_name, u.role, u.agency, u.project_id, u.user_photo, p.project_name FROM users u LEFT JOIN projects p ON u.project_id = p.project_id ORDER BY u.created_at DESC`;
        const [rows] = await db.query(sql);
        return rows;
    },

    /**
     * ค้นหาผู้ใช้งานตาม ID
     */
    async getUserById(id) {
        const [rows] = await db.query('SELECT * FROM users WHERE user_id = ?', [id]);
        return rows[0] || null;
    },

    /**
     * อัปเดตข้อมูลผู้ใช้งาน (Admin Update)
     */
    async updateUser(id, data, newPassword = null) {
        const oldData = await this.getUserById(id);
        if (!oldData) throw new Error('User not found');

        const { first_name, last_name, agency, role, project_id, email, is_active } = data;
        
        // แปลง project_id ให้เป็น Number หรือ NULL เพื่อความปลอดภัย
        const activeProjectId = (project_id === 'null' || project_id === '' || project_id === undefined || project_id === null) ? null : Number(project_id);

        let changes = [];
        const fieldLabels = { 
            first_name: 'ชื่อ', 
            last_name: 'นามสกุล', 
            agency: 'หน่วยงาน', 
            role: 'สิทธิ์การใช้งาน', 
            project_id: 'รหัสโปรเจกต์',
            email: 'อีเมล',
            is_active: 'สถานะการใช้งาน'
        };
        const newData = { 
            first_name, 
            last_name, 
            agency, 
            role, 
            project_id: activeProjectId,
            email,
            is_active: is_active === undefined ? oldData.is_active : (is_active ? 1 : 0)
        };

        for (let key in fieldLabels) {
            const oldVal = String(oldData[key] || '');
            const newVal = String(newData[key] === null || newData[key] === undefined ? '' : newData[key]);
            if (newVal !== oldVal) {
                changes.push(`${fieldLabels[key]} (จาก "${oldData[key] || '-'}" เป็น "${newData[key] || '-'}")`);
            }
        }
        if (newPassword && newPassword.trim() !== '') changes.push('รีเซ็ตรหัสผ่านใหม่');

        let sql = `UPDATE users SET first_name = ?, last_name = ?, agency = ?, role = ?, project_id = ?, email = ?, is_active = ?`;
        let params = [
            first_name, 
            last_name, 
            agency || null, 
            role, 
            activeProjectId, 
            email || null,
            newData.is_active
        ];

        if (newPassword && newPassword.trim() !== '') {
            sql += `, password_hash = ?`;
            params.push(await bcrypt.hash(newPassword, 10));
        }
        sql += ` WHERE user_id = ?`;
        params.push(id);

        await db.query(sql, params);
        return { changes, oldUsername: oldData.username };
    },



    /**
     * อัปเดตข้อมูลส่วนตัว (Self Update)
     */
    async updateProfile(id, data) {
        const oldData = await this.getUserById(id);
        if (!oldData) throw new Error('User not found');

        // Mapping: Frontend ส่ง 'department' -> Backend บันทึกลง 'agency'
        const { first_name, last_name, position, department, email, telephone, mobile } = data;
        const agency = department || null; 

        let changes = [];
        const fieldLabels = { first_name: 'ชื่อ', last_name: 'นามสกุล', position: 'ตำแหน่ง', agency: 'หน่วยงาน', email: 'อีเมล', telephone: 'เบอร์โทรศัพท์', mobile: 'เบอร์มือถือ' };
        const newData = { first_name, last_name, position, agency, email, telephone, mobile };

        for (let key in fieldLabels) {
            if (newData[key] !== undefined && String(newData[key]) !== String(oldData[key] || '')) {
                changes.push(`${fieldLabels[key]} (จาก "${oldData[key] || '-'}" เป็น "${newData[key] || '-'}")`);
            }
        }

        const sql = `UPDATE users SET first_name = ?, last_name = ?, agency = ?, position = ?, email = ?, telephone = ?, mobile = ? WHERE user_id = ?`;
        await db.query(sql, [
            first_name || null, 
            last_name || null, 
            agency || null, 
            position || null, 
            email || null, 
            telephone || null, 
            mobile || null, 
            id
        ]);
        
        return { changes };
    }

};

module.exports = userService;

