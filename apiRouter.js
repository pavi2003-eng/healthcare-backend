const express = require('express');
const router = express.Router();

// Mount each module under its own path
router.use('/', require('./healthcare/routes/index'));

module.exports = router;