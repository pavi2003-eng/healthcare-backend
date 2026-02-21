const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

router.post('/', auth, authorize('patient'), ratingController.createRating);
router.get('/doctor/:doctorId', ratingController.getDoctorRatings);

module.exports = router;