const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { schemas } = require('../middleware/validate');
const userController = require('../controllers/user.controller');

// Admin routes
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);
router.get('/stats', authenticate, authorize('admin'), userController.getUserStats);
router.get('/:id', authenticate, authorize('admin'), userController.getUserById);
router.put('/:id', authenticate, authorize('admin'), validate(schemas.updateUser), userController.updateUser);
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router; 