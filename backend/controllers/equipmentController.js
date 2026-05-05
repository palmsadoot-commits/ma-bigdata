const db = require('../config/db');
const masterService = require('../services/masterService');

exports.getEquipments = async (req, res) => {
    try {
        const equipments = await masterService.getAllEquipments();
        res.json(equipments);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch equipments' }); }
};

exports.createEquipment = async (req, res) => {
    try {
        await masterService.createEquipment(req.body);
        res.json({ success: true, message: 'เพิ่มอุปกรณ์เรียบร้อยแล้ว' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถเพิ่มข้อมูลได้' }); }
};

exports.updateEquipment = async (req, res) => {
    try {
        await masterService.updateEquipment(req.params.id, req.body);
        res.json({ success: true, message: 'อัปเดตอุปกรณ์สำเร็จ' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถอัปเดตได้' }); }
};

exports.updateEquipmentStatus = async (req, res) => {
    try {
        await db.query(`UPDATE equipments SET status = ? WHERE equipment_id = ?`, [req.body.status, req.params.id]);
        res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถอัปเดตสถานะได้' }); }
};

exports.deleteEquipment = async (req, res) => {
    try {
        await db.query('DELETE FROM equipments WHERE equipment_id = ?', [req.params.id]);
        res.json({ success: true, message: 'ลบอุปกรณ์สำเร็จ' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถลบได้ เนื่องจากมีการอ้างอิงในใบงาน' }); }
};
