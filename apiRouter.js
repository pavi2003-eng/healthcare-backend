const express = require('express');
const router = express.Router();

router.use('/', require('./healthcare/routes/index'));

module.exports = router;