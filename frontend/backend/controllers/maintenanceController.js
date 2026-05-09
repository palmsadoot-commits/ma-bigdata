const maintenanceService = require('../services/maintenanceService');

/**
 * Controller for System Maintenance & Cleanup
 */
exports.getSettings = async (req, res) => {
    try {
        const settings = await maintenanceService.getSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการตั้งค่าได้' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        await maintenanceService.updateSettings(req.body);
        res.json({ success: true, message: 'บันทึกการตั้งค่า Maintenance เรียบร้อยแล้ว' });
    } catch (error) {
        res.status(500).json({ error: 'ไม่สามารถบันทึกการตั้งค่าได้' });
    }
};

exports.runManualCleanup = async (req, res) => {
    try {
        const stats = await maintenanceService.runCleanup(true);
        res.json({ 
            success: true, 
            message: `ทำความสะอาดระบบสำเร็จ! ลบ Log ${stats.logsDeleted} รายการ และไฟล์เก่า ${stats.filesDeleted} ไฟล์`,
            stats 
        });
    } catch (error) {
        res.status(500).json({ error: 'กระบวนการ Cleanup ล้มเหลว', details: error.message });
    }
};
