const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// จัดการเมนู (ต้องเป็น Admin เท่านั้น)
router.get('/', authenticateToken, menuController.getMenus);
router.post('/', authenticateToken, requireRole(['admin']), menuController.createMenu);
router.put('/:id', authenticateToken, requireRole(['admin']), menuController.updateMenu);
router.delete('/:id', authenticateToken, requireRole(['admin']), menuController.deleteMenu);

module.exports = router;
