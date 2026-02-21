const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

router.get('/', auth, authorize('admin'), analyticsController.getAnalytics);
router.get('/details', auth, authorize('admin'), analyticsController.getPatientRiskDetails);

module.exports = router;