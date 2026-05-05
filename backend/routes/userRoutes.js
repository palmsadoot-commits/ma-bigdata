const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { uploadAvatar } = require('../utils/upload');

const validate = require('../middleware/validate');
const { loginSchema, createUserSchema, updateProfileSchema, updatePasswordSchema, adminUpdateUserSchema } = require('../schemas/userSchema');

router.post('/login', validate({ body: loginSchema }), userController.login);
router.post('/logout', authenticateToken, userController.logout);
router.post('/register', authenticateToken, requireRole(['admin']), validate({ body: createUserSchema }), userController.register);
router.get('/', authenticateToken, requireRole(['admin']), userController.getUsers);
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, validate({ body: updateProfileSchema }), userController.updateProfile);
router.patch('/profile', authenticateToken, validate({ body: updateProfileSchema }), userController.updateProfile); // ✅ เพิ่ม PATCH เผื่อไว้
router.put('/complete-profile', authenticateToken, userController.completeProfile);
router.post('/upload-avatar', authenticateToken, uploadAvatar.single('avatar'), userController.uploadAvatar);
router.put('/password', authenticateToken, validate({ body: updatePasswordSchema }), userController.updatePassword);
router.patch('/password', authenticateToken, validate({ body: updatePasswordSchema }), userController.updatePassword); // ✅ เพิ่ม PATCH เผื่อไว้

router.get('/technicians', authenticateToken, userController.getTechnicians);
router.put('/:id', authenticateToken, requireRole(['admin']), validate({ body: adminUpdateUserSchema }), userController.updateUser);
router.delete('/:id', authenticateToken, requireRole(['admin']), userController.deleteUser);

module.exports = router;
