const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const connectedUsers = new Map(); // userId -> Set of socketIds

const socketHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name role');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${socket.user.name} (${userId})`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Track connected users
    if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
    connectedUsers.get(userId).add(socket.id);

    // Doctor joins their room for real-time patient updates
    if (socket.user.role === 'doctor') {
      socket.join(`doctor:${userId}`);
    }

    // Handle joining appointment/consultation room
    socket.on('join_consultation', ({ appointmentId }) => {
      socket.join(`consultation:${appointmentId}`);
      socket.to(`consultation:${appointmentId}`).emit('user_joined', { userId, name: socket.user.name });
    });

    socket.on('leave_consultation', ({ appointmentId }) => {
      socket.leave(`consultation:${appointmentId}`);
      socket.to(`consultation:${appointmentId}`).emit('user_left', { userId });
    });

    // Handle consultation chat messages
    socket.on('consultation_message', ({ appointmentId, message }) => {
      io.to(`consultation:${appointmentId}`).emit('consultation_message', {
        from: { id: userId, name: socket.user.name, role: socket.user.role },
        message,
        timestamp: new Date()
      });
    });

    // Handle typing indicators
    socket.on('typing', ({ appointmentId, isTyping }) => {
      socket.to(`consultation:${appointmentId}`).emit('typing', { userId, isTyping });
    });

    // Handle appointment queue updates
    socket.on('update_queue', ({ doctorId, tokenNumber }) => {
      io.to(`doctor:${doctorId}`).emit('queue_update', { currentToken: tokenNumber });
    });

    socket.on('disconnect', () => {
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) connectedUsers.delete(userId);
      }
      console.log(`Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

const isUserOnline = (userId) => connectedUsers.has(userId.toString());
const getOnlineCount = () => connectedUsers.size;

module.exports = socketHandler;
module.exports.isUserOnline = isUserOnline;
module.exports.getOnlineCount = getOnlineCount;
