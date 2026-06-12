const projectService = require('../services/projectService');

exports.getProjects = async (req, res, next) => {
    try {
        const projects = await projectService.getProjects();
        res.json(projects);
    } catch (err) { next(err); }
};

exports.getMilestones = async (req, res, next) => {
    try {
        const milestones = await projectService.getMilestones();
        res.json(milestones);
    } catch (err) { next(err); }
};

exports.getTasks = async (req, res, next) => {
    try {
        const { milestone_id } = req.query;
        const tasks = milestone_id 
            ? await projectService.getTasksByMilestone(milestone_id)
            : await projectService.getAllTasks();
        res.json(tasks);
    } catch (err) { next(err); }
};

exports.updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;
        const userId = req.user.user_id;

        // User role is view only
        if (userRole === 'user') {
            return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลงานนี้' });
        }

        // For head_technician and technician, ideally they should only update assigned tasks, 
        // but for now we'll allow them to update any task or we can fetch task to verify.
        // We'll trust the frontend for hiding the button, but backend blocks 'user'.

        // รองรับทั้งการอัปเดตสถานะอย่างเดียว และการอัปเดตข้อมูลทั้งหมด
        if (Object.keys(req.body).length === 2 && (req.body.status || req.body.completion_date)) {
            const { status, completion_date } = req.body;
            await projectService.updateTaskStatus(id, status, completion_date);
        } else {
            await projectService.updateTask(id, req.body);
        }
        res.json({ success: true, message: 'บันทึกข้อมูลงานเรียบร้อย' });
    } catch (err) { next(err); }
};

exports.getProjectUsers = async (req, res, next) => {
    try {
        const { project_id } = req.query;
        const users = await projectService.getProjectUsers(project_id || 1);
        res.json(users);
    } catch (err) { next(err); }
};

exports.getSLALogs = async (req, res, next) => {
    try {
        const { project_id } = req.query;
        const logs = await projectService.getSLALogs(project_id || 1);
        res.json(logs);
    } catch (err) { next(err); }
};

exports.getTORScope = async (req, res, next) => {
    try {
        const scope = await projectService.getTORScope();
        res.json(scope);
    } catch (err) { next(err); }
};

exports.createTORClause = async (req, res, next) => {
    try {
        const newId = await projectService.createTORClause(req.body);
        res.json({ success: true, message: 'เพิ่มขอบเขตงานเรียบร้อย', clause_id: newId });
    } catch (err) { next(err); }
};

exports.updateTORClause = async (req, res, next) => {
    try {
        const { id } = req.params;
        await projectService.updateTORClause(id, req.body);
        res.json({ success: true, message: 'อัปเดตขอบเขตงานเรียบร้อย' });
    } catch (err) { next(err); }
};

exports.deleteTORClause = async (req, res, next) => {
    try {
        const { id } = req.params;
        await projectService.deleteTORClause(id);
        res.json({ success: true, message: 'ลบขอบเขตงานเรียบร้อย' });
    } catch (err) { next(err); }
};

exports.updateMilestone = async (req, res, next) => {
    try {
        const { id } = req.params;
        await projectService.updateMilestone(id, req.body);
        res.json({ success: true, message: 'อัปเดตข้อมูลงวดงานเรียบร้อย' });
    } catch (err) { next(err); }
};

exports.createMilestone = async (req, res, next) => {
    try {
        const newId = await projectService.createMilestone(req.body);
        res.json({ success: true, message: 'สร้างงวดงานใหม่เรียบร้อย', milestone_id: newId });
    } catch (err) { next(err); }
};

exports.deleteMilestone = async (req, res, next) => {
    try {
        const { id } = req.params;
        await projectService.deleteMilestone(id);
        res.json({ success: true, message: 'ลบงวดงานเรียบร้อย' });
    } catch (err) { next(err); }
};

exports.getDeliverables = async (req, res, next) => {
    try {
        const deliverables = await projectService.getDeliverables(req.query.milestone_id);
        res.json(deliverables);
    } catch (err) { next(err); }
};

exports.createDeliverable = async (req, res, next) => {
    try {
        const newId = await projectService.createDeliverable(req.body);
        res.json({ success: true, message: 'เพิ่มสิ่งส่งมอบเรียบร้อย', deliverable_id: newId });
    } catch (err) { next(err); }
};

exports.updateDeliverable = async (req, res, next) => {
    try {
        const { id } = req.params;
        await projectService.updateDeliverable(id, req.body);
        res.json({ success: true, message: 'อัปเดตสิ่งส่งมอบเรียบร้อย' });
    } catch (err) { next(err); }
};

exports.deleteDeliverable = async (req, res, next) => {
    try {
        const { id } = req.params;
        await projectService.deleteDeliverable(id);
        res.json({ success: true, message: 'ลบสิ่งส่งมอบเรียบร้อย' });
    } catch (err) { next(err); }
};

exports.updateTORMapping = async (req, res, next) => {
    try {
        const { id } = req.params;
        await projectService.updateTORMapping(id, req.body);
        res.json({ success: true, message: 'บันทึกการจับคู่ TOR เรียบร้อย' });
    } catch (err) { next(err); }
};
