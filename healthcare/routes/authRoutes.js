const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST register a new patient
router.post('/register', authController.register);

// POST login
router.post('/login', authController.login);

module.exports = router;