const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/dashboard', authenticate, reportController.getDashboardData);
router.get('/analytics', authenticate, authorize(['admin', 'accountant']), reportController.getReports);

// Notifications
router.get('/notifications', authenticate, reportController.getNotifications);
router.put('/notifications/:id/read', authenticate, reportController.markNotificationRead);

module.exports = router;
