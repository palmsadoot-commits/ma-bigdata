const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, projectController.getProjects);
router.post('/', authenticateToken, requireRole(['admin']), projectController.createProject);
router.put('/:id', authenticateToken, requireRole(['admin']), projectController.updateProject);
router.delete('/:id', authenticateToken, requireRole(['admin']), projectController.deleteProject);

module.exports = router;
