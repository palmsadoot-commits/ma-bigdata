const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, projectController.getProjects);
router.get('/milestones', authenticateToken, projectController.getMilestones);
router.get('/tasks', authenticateToken, projectController.getTasks);
router.put('/tasks/:id', authenticateToken, projectController.updateTask);
router.get('/sla-logs', authenticateToken, projectController.getSLALogs);
router.get('/deliverables', authenticateToken, projectController.getDeliverables);
router.get('/users', authenticateToken, projectController.getProjectUsers);
router.get('/tor-scope', authenticateToken, projectController.getTORScope);
router.put('/milestones/:id', authenticateToken, requireRole(['admin']), projectController.updateMilestone);
router.put('/tor-mapping/:id', authenticateToken, requireRole(['admin']), projectController.updateTORMapping);

module.exports = router;
