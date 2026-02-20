const Chat = require('../models/Chat');
const User = require('../models/User');
const asyncHandler = require('../../common/utils/asyncHandler');

// Helper to add unread count and profile picture
const enrichChat = (chat, userRole, userName) => {
  const lastRead = userRole === 'doctor' ? chat.lastReadByDoctor : chat.lastReadByPatient;
  const unreadCount = chat.messages.filter(
    m => new Date(m.timestamp) > (lastRead || new Date(0)) && m.sender !== userName
  ).length;
  const chatObj = chat.toObject();
  chatObj.unreadCount = unreadCount;
  
  if (userRole === 'doctor') {
    chatObj.patientProfilePicture = chat.patientId?.userId?.profilePicture || null;
  } else {
    chatObj.doctorProfilePicture = chat.doctorId?.userId?.profilePicture || null;
  }
  return chatObj;
};

// GET all chats for a doctor (with patient picture)
exports.getChatsForDoctor = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ doctorId: req.params.doctorId })
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'profilePicture name' }
    })
    .sort({ lastUpdated: -1 });
  
  const enriched = chats.map(chat => enrichChat(chat, 'doctor', req.user.name));
  res.json(enriched);
});

// GET all chats for a patient (with doctor picture)
exports.getChatsForPatient = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ patientId: req.params.patientId })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'profilePicture' }
    })
    .sort({ lastUpdated: -1 });
  
  const enriched = chats.map(chat => enrichChat(chat, 'patient', req.user.name));
  res.json(enriched);
});

// GET a single chat by ID (with both profile pictures)
exports.getChatById = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'profilePicture name' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'profilePicture' }
    });
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }
  
  const chatObj = chat.toObject();
  chatObj.patientProfilePicture = chat.patientId?.userId?.profilePicture || null;
  chatObj.doctorProfilePicture = chat.doctorId?.userId?.profilePicture || null;
  res.json(chatObj);
});

// POST a new chat (when appointment accepted)
exports.createChat = asyncHandler(async (req, res) => {
  const chat = new Chat(req.body);
  await chat.save();
  res.status(201).json({ message: 'Chat created', chat });
});

// POST a message to an existing chat
exports.addMessage = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }
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
});

// PATCH mark chat as read for the current user
exports.markAsRead = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }

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
});

// DELETE a chat (admin only)
exports.deleteChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findByIdAndDelete(req.params.id);
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }
  res.json({ message: 'Chat deleted' });
});