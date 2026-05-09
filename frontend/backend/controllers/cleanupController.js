const cleanupService = require('../services/cleanupService');
const cronService = require('../services/cronService');

exports.getSettings = async (req, res, next) => {
    try {
        const settings = await cleanupService.getSettings();
        res.json(settings);
    } catch (err) { next(err); }
};

exports.getPreview = async (req, res, next) => {
    try {
        const preview = await cleanupService.getCleanupPreview();
        res.json(preview);
    } catch (err) { next(err); }
};

exports.getDetails = async (req, res, next) => {
    try {
        const { type } = req.query;
        const details = await cleanupService.getCleanupDetails(type);
        res.json(details);
    } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
    try {
        await cleanupService.updateSettings(req.body);
        // สั่งให้ Cron Job อัปเดตตารางเวลาใหม่
        await cronService.setupCleanupCronJob();
        res.json({ success: true, message: 'บันทึกการตั้งค่าการล้างข้อมูลสำเร็จ' });
    } catch (err) { next(err); }
};

exports.manualCleanup = async (req, res, next) => {
    try {
        const report = await cleanupService.performCleanup(`Admin ID: ${req.user.user_id} (Manual)`);
        res.json({ 
            success: true, 
            message: 'เริ่มการทำความสะอาดระบบเรียบร้อยแล้ว',
            report
        });
    } catch (err) { next(err); }
};
