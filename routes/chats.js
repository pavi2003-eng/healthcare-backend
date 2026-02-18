const express = require('express');
const Chat = require('../models/Chat');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper to add unread count and profile picture
const enrichChat = (chat, userRole, userName) => {
  const lastRead = userRole === 'doctor' ? chat.lastReadByDoctor : chat.lastReadByPatient;
  const unreadCount = chat.messages.filter(m => new Date(m.timestamp) > (lastRead || new Date(0)) && m.sender !== userName).length;
  const chatObj = chat.toObject();
  chatObj.unreadCount = unreadCount;
  
  if (userRole === 'doctor') {
    chatObj.patientProfilePicture = chat.patientId?.userId?.profilePicture || null;
  } else {
    chatObj.doctorProfilePicture = chat.doctorId?.userId?.profilePicture || null;
  }
  return chatObj;
};

// Get all chats for a doctor (with patient picture)
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ doctorId: req.params.doctorId })
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'profilePicture name' }
      })
      .sort({ lastUpdated: -1 });
    
    const enriched = chats.map(chat => enrichChat(chat, 'doctor', req.user.name));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all chats for a patient (with doctor picture)
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ patientId: req.params.patientId })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'profilePicture' }
      })
      .sort({ lastUpdated: -1 });
    
    const enriched = chats.map(chat => enrichChat(chat, 'patient', req.user.name));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single chat by ID (with both profile pictures)
router.get('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'profilePicture name' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'profilePicture' }
      });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    
    const chatObj = chat.toObject();
    chatObj.patientProfilePicture = chat.patientId?.userId?.profilePicture || null;
    chatObj.doctorProfilePicture = chat.doctorId?.userId?.profilePicture || null;
    res.json(chatObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new chat
router.post('/', async (req, res) => {
  try {
    const chat = new Chat(req.body);
    await chat.save();
    res.status(201).json({ message: 'Chat created', chat });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add a message to a chat
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    const { sender, text } = req.body;
    chat.messages.push({ sender, text, timestamp: new Date() });
    chat.lastUpdated = new Date();
    await chat.save();
    // Repopulate to return full chat with profile pictures
    const updatedChat = await Chat.findById(req.params.id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'profilePicture name' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'profilePicture' }
      });
    res.json({ message: 'Message added', chat: updatedChat });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark chat as read for the current user
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const user = req.user;
    if (user.role === 'doctor') {
      chat.lastReadByDoctor = new Date();
    } else if (user.role === 'patient') {
      chat.lastReadByPatient = new Date();
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }

    await chat.save();
    res.json({ message: 'Chat marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a chat
router.delete('/:id', async (req, res) => {
  try {
    const chat = await Chat.findByIdAndDelete(req.params.id);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.json({ message: 'Chat deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;