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
router.post('/deliverables', authenticateToken, requireRole(['admin']), projectController.createDeliverable);
router.put('/deliverables/:id', authenticateToken, requireRole(['admin']), projectController.updateDeliverable);
router.delete('/deliverables/:id', authenticateToken, requireRole(['admin']), projectController.deleteDeliverable);
router.get('/users', authenticateToken, projectController.getProjectUsers);
router.get('/tor-scope', authenticateToken, projectController.getTORScope);
router.post('/tor-scope', authenticateToken, requireRole(['admin']), projectController.createTORClause);
router.put('/tor-scope/:id', authenticateToken, requireRole(['admin']), projectController.updateTORClause);
router.delete('/tor-scope/:id', authenticateToken, requireRole(['admin']), projectController.deleteTORClause);

router.post('/milestones', authenticateToken, requireRole(['admin']), projectController.createMilestone);
router.put('/milestones/:id', authenticateToken, requireRole(['admin']), projectController.updateMilestone);
router.delete('/milestones/:id', authenticateToken, requireRole(['admin']), projectController.deleteMilestone);
router.put('/tor-mapping/:id', authenticateToken, requireRole(['admin']), projectController.updateTORMapping);

module.exports = router;
