const masterService = require('../services/masterService');

exports.getProjects = async (req, res) => {
    try {
        const projects = await masterService.getAllProjects();
        res.json(projects);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch projects' }); }
};

exports.createProject = async (req, res) => {
    try {
        await masterService.createProject(req.body);
        res.json({ success: true, message: 'เพิ่มโครงการและสัญญาเรียบร้อยแล้ว' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถเพิ่มโครงการได้' }); }
};

exports.updateProject = async (req, res) => {
    try {
        await masterService.updateProject(req.params.id, req.body);
        res.json({ success: true, message: 'อัปเดตโครงการและสัญญาเรียบร้อยแล้ว' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถอัปเดตโครงการได้' }); }
};

exports.deleteProject = async (req, res) => {
    try {
        await masterService.deleteProject(req.params.id);
        res.json({ success: true, message: 'ลบโครงการเรียบร้อยแล้ว' });
    } catch (err) { res.status(500).json({ error: err.message || 'ไม่สามารถลบโครงการได้' }); }
};
