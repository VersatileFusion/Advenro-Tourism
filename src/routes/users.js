const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { schemas } = require('../middleware/validate');
const userController = require('../controllers/user.controller');

// Profile routes
router.get('/me', authenticate, userController.getProfile);
router.put('/profile', authenticate, validate(schemas.updateProfile), userController.updateProfile);
router.put('/email', authenticate, validate(schemas.updateEmail), userController.updateEmail);
router.put('/password', authenticate, validate(schemas.updatePassword), userController.updatePassword);
router.post('/2fa/setup', authenticate, userController.setup2FA);
router.put('/2fa/enable', authenticate, validate(schemas.enable2FA), userController.enable2FA);
router.put('/avatar', authenticate, userController.updateAvatar);

// Admin routes
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);
router.get('/stats', authenticate, authorize('admin'), userController.getUserStats);
router.get('/:id', authenticate, authorize('admin'), userController.getUserById);
router.put('/:id', authenticate, authorize('admin'), validate(schemas.updateUser), userController.updateUser);
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router; 