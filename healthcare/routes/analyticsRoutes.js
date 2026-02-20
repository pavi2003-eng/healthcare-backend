const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

// GET summary analytics (admin only)
router.get('/', auth, authorize('admin'), analyticsController.getAnalytics);

// GET detailed patient risk list
router.get('/details', auth, authorize('admin'), analyticsController.getPatientRiskDetails);

module.exports = router;