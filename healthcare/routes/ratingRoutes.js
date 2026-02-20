const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

// POST a new rating (patient only)
router.post('/', auth, authorize('patient'), ratingController.createRating);

// GET ratings for a specific doctor
router.get('/doctor/:doctorId', ratingController.getDoctorRatings);

module.exports = router;