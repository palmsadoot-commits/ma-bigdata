const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Categories
router.get('/', authenticateToken, categoryController.getCategories);
router.post('/', authenticateToken, requireRole(['admin']), categoryController.createCategory);
router.put('/:id', authenticateToken, requireRole(['admin']), categoryController.updateCategory);
router.delete('/:id', authenticateToken, requireRole(['admin']), categoryController.deleteCategory);

// Category Types
router.get('/types', authenticateToken, categoryController.getCategoryTypes);
router.post('/types', authenticateToken, requireRole(['admin']), categoryController.createCategoryType);
router.put('/types/:id', authenticateToken, requireRole(['admin']), categoryController.updateCategoryType);
router.delete('/types/:id', authenticateToken, requireRole(['admin']), categoryController.deleteCategoryType);

module.exports = router;
