const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const asyncHandler = require('../../common/utils/asyncHandler');

const getUnreadCount = async (chatId, userRole, lastRead) => {
  return await Message.countDocuments({
    chatId,
    senderRole: { $ne: userRole },
    createdAt: { $gt: lastRead || new Date(0) }
  });
};

exports.getChatsForDoctor = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ doctorId: req.params.doctorId })
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'profilePicture' }
    })
    .sort({ lastMessageAt: -1 });

  const enrichedChats = await Promise.all(
    chats.map(async (chat) => {
      const lastMessage = await Message.findOne({ chatId: chat._id })
        .sort({ createdAt: -1 });

      const unreadCount = await getUnreadCount(
        chat._id,
        'doctor',
        chat.lastReadByDoctor
      );

      const chatObj = chat.toObject();
      chatObj.lastMessage = lastMessage;
      chatObj.unreadCount = unreadCount;
      chatObj.patientProfilePicture = chat.patientId?.userId?.profilePicture || null;
      
      return chatObj;
    })
  );

  res.json(enrichedChats);
});

exports.getChatsForPatient = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ patientId: req.params.patientId })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'profilePicture' }
    })
    .sort({ lastMessageAt: -1 });

  const enrichedChats = await Promise.all(
    chats.map(async (chat) => {
      const lastMessage = await Message.findOne({ chatId: chat._id })
        .sort({ createdAt: -1 });

      const unreadCount = await getUnreadCount(
        chat._id,
        'patient',
        chat.lastReadByPatient
      );

      const chatObj = chat.toObject();
      chatObj.lastMessage = lastMessage;
      chatObj.unreadCount = unreadCount;
      chatObj.doctorProfilePicture = chat.doctorId?.userId?.profilePicture || null;
      
      return chatObj;
    })
  );

  res.json(enrichedChats);
});

exports.getChatById = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'profilePicture name' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'profilePicture name' }
    });

  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }

  const messages = await Message.find({ chatId: chat._id })
    .sort({ createdAt: 1 });

  const chatObj = chat.toObject();
  chatObj.messages = messages;
  chatObj.patientProfilePicture = chat.patientId?.userId?.profilePicture || null;
  chatObj.doctorProfilePicture = chat.doctorId?.userId?.profilePicture || null;

  res.json(chatObj);
});

exports.createChat = asyncHandler(async (req, res) => {
  const { doctorId, patientId, doctorName, patientName, subject, appointmentId } = req.body;

  let chat = await Chat.findOne({ doctorId, patientId });

  if (!chat) {
    chat = new Chat({
      doctorId,
      patientId,
      doctorName,
      patientName,
      subject,
      appointmentId
    });
    await chat.save();
  }

  res.status(201).json({ message: 'Chat created', chat });
});

exports.addMessage = asyncHandler(async (req, res) => {
  const { sender, text } = req.body;
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }

  const senderRole = sender === chat.doctorName ? 'doctor' : 'patient';
  
  let senderId;
  if (senderRole === 'doctor') {
    const doctorUser = await User.findOne({ doctorId: chat.doctorId });
    senderId = doctorUser?._id;
  } else {
    const patientUser = await User.findOne({ patientId: chat.patientId });
    senderId = patientUser?._id;
  }

  const message = new Message({
    chatId,
    senderId,
    senderName: sender,
    senderRole,
    text
  });
  await message.save();

  chat.lastMessageAt = new Date();
  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'profilePicture name' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'profilePicture name' }
    });

  const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

  const chatObj = updatedChat.toObject();
  chatObj.messages = messages;
  chatObj.patientProfilePicture = updatedChat.patientId?.userId?.profilePicture || null;
  chatObj.doctorProfilePicture = updatedChat.doctorId?.userId?.profilePicture || null;

  res.json({ message: 'Message added', chat: chatObj });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }

  const now = new Date();
  
  if (req.user.role === 'doctor') {
    chat.lastReadByDoctor = now;
    await Message.updateMany(
      { 
        chatId: chat._id,
        senderRole: 'patient',
        read: false
      },
      { 
        read: true,
        readAt: now
      }
    );
  } else if (req.user.role === 'patient') {
    chat.lastReadByPatient = now;
    await Message.updateMany(
      { 
        chatId: chat._id,
        senderRole: 'doctor',
        read: false
      },
      { 
        read: true,
        readAt: now
      }
    );
  }

  await chat.save();
  res.json({ message: 'Chat marked as read' });
});

exports.deleteChat = asyncHandler(async (req, res) => {
  await Message.deleteMany({ chatId: req.params.id });
  const chat = await Chat.findByIdAndDelete(req.params.id);
  
  if (!chat) {
    return res.status(404).json({ message: 'Chat not found' });
  }
  
  res.json({ message: 'Chat and all messages deleted' });
});