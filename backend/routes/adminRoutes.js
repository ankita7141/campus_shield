const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, admin, superAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(auth);
router.use(admin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Admin management (super admin only)
router.get('/admins', superAdmin, adminController.getAdmins);
router.post('/admins', superAdmin, adminController.createAdmin);
router.put('/admins/:id', superAdmin, adminController.updateAdmin);
router.delete('/admins/:id', superAdmin, adminController.deleteAdmin);

module.exports = router;