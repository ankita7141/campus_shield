const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { uploadReportFiles } = require('../middleware/upload');

// Public routes
router.post('/', uploadReportFiles, reportController.createReport);
router.get('/', reportController.getReports);
router.get('/stats', reportController.getStats);
router.get('/:id', reportController.getReport);

// Protected routes (would add auth middleware here)
router.patch('/:id', reportController.updateReport);
router.post('/:id/notes', reportController.addNote);

module.exports = router;