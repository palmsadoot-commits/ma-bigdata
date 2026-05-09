const statusService = require('../services/statusService');
const { logAction, sysLog } = require('../utils/logger');

/**
 * Controller for Ticket Status management
 */

exports.getStatuses = async (req, res, next) => {
    try {
        const statuses = await statusService.getAllStatuses();
        res.json(statuses);
    } catch (err) { next(err); }
};

exports.createStatus = async (req, res, next) => {
    try {
        const statusId = await statusService.createStatus(req.body);
        await sysLog('INFO', 'OPERATIONAL', `เพิ่มป้ายสถานะใหม่: ${req.body.status_name}`, { userId: req.user.user_id, req });
        res.status(201).json({ success: true, message: 'เพิ่มสถานะเรียบร้อยแล้ว', status_id: statusId });
    } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const statusId = req.params.id;
        // รับค่าทั้งหมดจาก body รวมถึง is_active
        await statusService.updateStatus(statusId, req.body);
        
        await sysLog('INFO', 'OPERATIONAL', `อัปเดตข้อมูลป้ายสถานะ ID: ${statusId}`, { 
            userId: req.user.user_id, req,
            metadata: { body: req.body }
        });
        
        res.json({ success: true, message: 'อัปเดตสถานะเรียบร้อยแล้ว' });
    } catch (err) { next(err); }
};


exports.deleteStatus = async (req, res, next) => {
    try {
        const statusId = req.params.id;
        await statusService.deleteStatus(statusId);
        await sysLog('WARN', 'OPERATIONAL', `ลบป้ายสถานะ ID: ${statusId}`, { userId: req.user.user_id, req });
        res.json({ success: true, message: 'ลบสถานะเรียบร้อยแล้ว' });
    } catch (err) { 
        res.status(400).json({ error: err.message });
    }
};
