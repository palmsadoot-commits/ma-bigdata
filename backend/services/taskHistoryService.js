const db = require('../config/db');
const dayjs = require('dayjs');

const taskHistoryService = {
    /**
     * ✅ ตรวจสอบว่าวันที่กำหนด ตรงกับ Schedule หรือไม่
     */
    checkScheduleMatch(date, setting) {
        if (!setting || setting.is_active !== 1) return false;
        const d = dayjs(date);
        if (setting.schedule_type === 'daily') return true;
        if (setting.schedule_type === 'weekly') {
            const days = setting.schedule_days ? setting.schedule_days.split(',') : [];
            return days.includes(String(d.day()));
        }
        if (setting.schedule_type === 'monthly') {
            return String(d.date()) === String(setting.schedule_days);
        }
        return false;
    },

    /**
     * 📅 สร้างแผนงานสำรองข้อมูลสำหรับวันที่ระบุ
     */
    async generateTasksForDate(date) {
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        const todayStr = dayjs().format('YYYY-MM-DD');
        const isFutureOrToday = dateStr >= todayStr;
        
        try {
            // ดึงการตั้งค่าทั้งหมด
            const [dbSets] = await db.query('SELECT * FROM backup_settings WHERE id = 1');
            const [srcSets] = await db.query('SELECT * FROM source_backup_settings'); // ✅ ดึงทุก Profile
            const [gitSets] = await db.query('SELECT * FROM github_settings WHERE id = 1');
            const [gdriveSets] = await db.query('SELECT * FROM gdrive_settings WHERE id = 1');

            const tasks = [
                { type: 'db', profile_id: 0, setting: dbSets[0] },
                { type: 'github', profile_id: 0, setting: gitSets[0] },
                { type: 'gdrive', profile_id: 0, setting: gdriveSets[0] }
            ];

            // ✅ เพิ่ม Source Backup ตาม Profile (ใช้ 'source' เสมอเพื่อให้ Frontend แสดงผลได้ และแยกด้วย profile_id)
            srcSets.forEach(set => {
                tasks.push({ 
                    type: 'source', 
                    profile_id: set.id,
                    setting: set 
                });
            });

            for (const task of tasks) {
                const matches = this.checkScheduleMatch(dateStr, task.setting);
                
                if (matches) {
                    const time = task.setting.schedule_time || '00:00:00';
                    if (isFutureOrToday) {
                        // ✅ สำหรับวันนี้และอนาคต: อัปเดตแผนงานให้ตรงกับ Setting ล่าสุดเสมอ
                        await db.query(
                            `INSERT INTO backup_tasks_history (task_type, profile_id, scheduled_date, scheduled_time, status) 
                             VALUES (?, ?, ?, ?, 'pending')
                             ON DUPLICATE KEY UPDATE scheduled_time = VALUES(scheduled_time)`,
                            [task.type, task.profile_id, dateStr, time]
                        );
                    } else {
                        // ❌ สำหรับอดีต: ลงทะเบียนเฉพาะถ้ายังไม่มี (รักษาประวัติเดิมไว้ ไม่ทับค่า)
                        await db.query(
                            `INSERT IGNORE INTO backup_tasks_history (task_type, profile_id, scheduled_date, scheduled_time, status) 
                             VALUES (?, ?, ?, ?, 'pending')`,
                            [task.type, task.profile_id, dateStr, time]
                        );
                    }
                } else if (isFutureOrToday) {
                    // 🗑️ ถ้า "ไม่ตรงเงื่อนไขใหม่" และ "ยังไม่ทำ (pending)": ให้ลบทิ้งทันทีสำหรับแผนในอนาคต
                    await db.query(
                        `DELETE FROM backup_tasks_history 
                         WHERE task_type = ? AND profile_id = ? AND scheduled_date = ? AND status = 'pending'`,
                        [task.type, task.profile_id, dateStr]
                    );
                }
            }
        } catch (err) {
            console.error(`❌ generateTasksForDate Error (${dateStr}):`, err.message);
        }
    },

    /**
     * ✅ อัปเดตสถานะงานเมื่อทำรายการสำเร็จหรือล้มเหลว
     */
    async updateTaskStatus(type, date, status, logId = null, profileId = 0) {
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        try {
            await db.query(
                `UPDATE backup_tasks_history 
                 SET status = ?, completed_at = NOW(), log_id = ? 
                 WHERE task_type = ? AND profile_id = ? AND DATE(scheduled_date) = ?`,
                [status, logId, type, profileId, dateStr]
            );
        } catch (err) {
            console.error(`❌ updateTaskStatus Error:`, err.message);
        }
    },

    /**
     * 🕵️ ตรวจสอบงานที่ค้างในอดีตแล้วเปลี่ยนเป็น 'missed'
     */
    async syncMissedTasks() {
        try {
            const today = dayjs().format('YYYY-MM-DD');
            const [result] = await db.query(
                `UPDATE backup_tasks_history 
                 SET status = 'missed' 
                 WHERE scheduled_date < ? AND status = 'pending'`,
                [today]
            );
            if (result.affectedRows > 0) {
                console.log(`🧹 Marked ${result.affectedRows} tasks as MISSED`);
            }
        } catch (err) {
            console.error(`❌ syncMissedTasks Error:`, err.message);
        }
    },

    /**
     * 📊 ดึงประวัติแผนงานสำหรับแสดงในหน้าบ้าน
     */
    async getHistory(startDate, endDate) {
        const [rows] = await db.query(
            `SELECT id, task_type, DATE_FORMAT(scheduled_date, '%Y-%m-%d') as scheduled_date, 
                    scheduled_time, status, completed_at, log_id 
             FROM backup_tasks_history 
             WHERE scheduled_date BETWEEN ? AND ? 
             ORDER BY scheduled_date ASC, scheduled_time ASC`,
            [startDate, endDate]
        );
        return rows;
    }
};

module.exports = taskHistoryService;
