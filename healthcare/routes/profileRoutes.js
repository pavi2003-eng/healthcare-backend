const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../../common/middleware/auth');
const upload = require('../../common/middleware/uploads');
router.get('/me', auth, profileController.getProfile);
router.put('/me', auth, profileController.updateProfile);
router.post('/me/picture', auth, upload.single('profilePicture'), profileController.uploadProfilePicture);
router.delete('/me', auth, profileController.deleteAccount);
router.post('/change-password', auth, profileController.changePassword);

module.exports = router;