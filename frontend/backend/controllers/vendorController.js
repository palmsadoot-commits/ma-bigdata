const masterService = require('../services/masterService');
const db = require('../config/db');

exports.getVendors = async (req, res) => {
    try {
        const vendors = await masterService.getAllVendors();
        res.json(vendors);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch vendors' }); }
};

exports.createVendor = async (req, res) => {
    try {
        await masterService.createVendor(req.body);
        res.json({ success: true, message: 'เพิ่มผู้รับจ้างเรียบร้อยแล้ว' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถเพิ่มข้อมูลได้' }); }
};

exports.updateVendor = async (req, res) => {
    try {
        await masterService.updateVendor(req.params.id, req.body);
        res.json({ success: true, message: 'อัปเดตข้อมูลสำเร็จ' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถอัปเดตได้' }); }
};

exports.deleteVendor = async (req, res) => {
    try {
        await db.query('DELETE FROM vendors WHERE vendor_id = ?', [req.params.id]);
        res.json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถลบได้ เนื่องจากมีสัญญาหรือตั๋วผูกอยู่' }); }
};
