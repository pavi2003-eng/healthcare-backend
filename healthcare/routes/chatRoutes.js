const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

router.get('/doctor/:doctorId', auth, chatController.getChatsForDoctor);
router.get('/patient/:patientId', auth, chatController.getChatsForPatient);
router.get('/:id', auth, chatController.getChatById);
router.post('/', auth, chatController.createChat);
router.post('/:id/messages', auth, chatController.addMessage);
router.patch('/:id/read', auth, chatController.markAsRead);
router.delete('/:id', auth, authorize('admin'), chatController.deleteChat);

module.exports = router;