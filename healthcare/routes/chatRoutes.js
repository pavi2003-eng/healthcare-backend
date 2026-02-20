const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatsController');
const auth = require('../../common/middleware/auth');
const authorize = require('../../common/middleware/role');

// GET all chats for a doctor
router.get('/doctor/:doctorId', auth, chatController.getChatsForDoctor);

// GET all chats for a patient
router.get('/patient/:patientId', auth, chatController.getChatsForPatient);

// GET a single chat by ID (with profile pictures)
router.get('/:id', auth, chatController.getChatById);

// POST a new chat (when appointment accepted)
router.post('/', auth, chatController.createChat);

// POST a message to an existing chat
router.post('/:id/messages', auth, chatController.addMessage);

// PATCH mark chat as read
router.patch('/:id/read', auth, chatController.markAsRead);

// DELETE a chat (admin only)
router.delete('/:id', auth, authorize('admin'), chatController.deleteChat);

module.exports = router;