const { socketAuth } = require('../middleware/auth');
const Message = require('../models/Message');
const Session = require('../models/Session');
const User = require('../models/User');

// Store active users and their socket connections
const activeUsers = new Map();
const activeSessions = new Map();

const socketHandler = (io) => {
  // Authentication middleware
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`);
    
    // Store user connection
    activeUsers.set(socket.user._id.toString(), {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // Join user to their personal room for notifications
    socket.join(`user_${socket.user._id}`);

    // Emit user online status to their contacts
    socket.broadcast.emit('user_online', {
      userId: socket.user._id,
      name: socket.user.name,
      avatar: socket.user.avatar
    });

    // Handle joining chat rooms
    socket.on('join_chat', async (data) => {
      try {
        const { matchId } = data;
        
        // Verify user is part of this match
        const Match = require('../models/Match');
        const match = await Match.findById(matchId);
        
        if (!match || (
          match.teacher.toString() !== socket.user._id.toString() && 
          match.learner.toString() !== socket.user._id.toString()
        )) {
          socket.emit('error', { message: 'Unauthorized to join this chat' });
          return;
        }

        const roomName = `chat_${matchId}`;
        socket.join(roomName);
        
        socket.emit('joined_chat', { matchId, roomName });
        
        // Notify other user that someone joined
        socket.to(roomName).emit('user_joined_chat', {
          userId: socket.user._id,
          name: socket.user.name
        });

      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { matchId, message, type = 'text' } = data;
        
        // Verify user is part of this match
        const Match = require('../models/Match');
        const match = await Match.findById(matchId);
        
        if (!match || (
          match.teacher.toString() !== socket.user._id.toString() && 
          match.learner.toString() !== socket.user._id.toString()
        )) {
          socket.emit('error', { message: 'Unauthorized to send message' });
          return;
        }

        // Create message in database
        const newMessage = await Message.create({
          match: matchId,
          sender: socket.user._id,
          content: message,
          type
        });

        await newMessage.populate('sender', 'name avatar');

        const roomName = `chat_${matchId}`;
        
        // Send message to all users in the chat room
        io.to(roomName).emit('new_message', {
          messageId: newMessage._id,
          matchId,
          sender: {
            _id: newMessage.sender._id,
            name: newMessage.sender.name,
            avatar: newMessage.sender.avatar
          },
          content: message,
          type,
          timestamp: newMessage.createdAt
        });

        // Send push notification to offline users
        const otherUserId = match.teacher.toString() === socket.user._id.toString() 
          ? match.learner 
          : match.teacher;
        
        const otherUserConnection = activeUsers.get(otherUserId.toString());
        if (!otherUserConnection) {
          // User is offline, send push notification
          const Notification = require('../models/Notification');
          await Notification.createNotification({
            recipient: otherUserId,
            sender: socket.user._id,
            type: 'message-received',
            title: `New message from ${socket.user.name}`,
            message: message.substring(0, 100),
            channels: { inApp: true, push: true },
            relatedMatch: matchId
          });
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { matchId } = data;
      const roomName = `chat_${matchId}`;
      socket.to(roomName).emit('user_typing', {
        userId: socket.user._id,
        name: socket.user.name
      });
    });

    socket.on('typing_stop', (data) => {
      const { matchId } = data;
      const roomName = `chat_${matchId}`;
      socket.to(roomName).emit('user_stopped_typing', {
        userId: socket.user._id
      });
    });

    // Handle video call signaling
    socket.on('join_session', async (data) => {
      try {
        const { sessionId } = data;
        
        // Verify user is part of this session
        const session = await Session.findById(sessionId);
        
        if (!session || (
          session.teacher.toString() !== socket.user._id.toString() && 
          session.learner.toString() !== socket.user._id.toString()
        )) {
          socket.emit('error', { message: 'Unauthorized to join this session' });
          return;
        }

        const roomName = `session_${sessionId}`;
        socket.join(roomName);
        
        // Track active session participants
        if (!activeSessions.has(sessionId)) {
          activeSessions.set(sessionId, new Set());
        }
        activeSessions.get(sessionId).add(socket.user._id.toString());

        // Mark user as joined in database
        session.markUserJoined(socket.user._id);
        await session.save();

        socket.emit('joined_session', { 
          sessionId, 
          roomName,
          session: {
            _id: session._id,
            title: session.title,
            scheduledAt: session.scheduledAt,
            duration: session.duration,
            status: session.status
          }
        });
        
        // Notify other participants
        socket.to(roomName).emit('user_joined_session', {
          userId: socket.user._id,
          name: socket.user.name,
          role: session.teacher.toString() === socket.user._id.toString() ? 'teacher' : 'learner'
        });

      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // WebRTC signaling
    socket.on('webrtc_offer', (data) => {
      const { sessionId, offer, targetUserId } = data;
      const roomName = `session_${sessionId}`;
      
      socket.to(roomName).emit('webrtc_offer', {
        offer,
        fromUserId: socket.user._id,
        fromUserName: socket.user.name
      });
    });

    socket.on('webrtc_answer', (data) => {
      const { sessionId, answer, targetUserId } = data;
      const roomName = `session_${sessionId}`;
      
      socket.to(roomName).emit('webrtc_answer', {
        answer,
        fromUserId: socket.user._id,
        fromUserName: socket.user.name
      });
    });

    socket.on('webrtc_ice_candidate', (data) => {
      const { sessionId, candidate, targetUserId } = data;
      const roomName = `session_${sessionId}`;
      
      socket.to(roomName).emit('webrtc_ice_candidate', {
        candidate,
        fromUserId: socket.user._id
      });
    });

    // Handle screen sharing
    socket.on('screen_share_start', (data) => {
      const { sessionId } = data;
      const roomName = `session_${sessionId}`;
      
      socket.to(roomName).emit('screen_share_started', {
        userId: socket.user._id,
        name: socket.user.name
      });
    });

    socket.on('screen_share_stop', (data) => {
      const { sessionId } = data;
      const roomName = `session_${sessionId}`;
      
      socket.to(roomName).emit('screen_share_stopped', {
        userId: socket.user._id
      });
    });

    // Handle session status updates
    socket.on('session_status_update', async (data) => {
      try {
        const { sessionId, status } = data;
        
        const session = await Session.findById(sessionId);
        if (!session || (
          session.teacher.toString() !== socket.user._id.toString() && 
          session.learner.toString() !== socket.user._id.toString()
        )) {
          socket.emit('error', { message: 'Unauthorized to update session' });
          return;
        }

        if (status === 'start' && session.status === 'scheduled') {
          session.startSession();
        } else if (status === 'end' && session.status === 'in-progress') {
          session.endSession();
        }

        await session.save();

        const roomName = `session_${sessionId}`;
        io.to(roomName).emit('session_status_changed', {
          sessionId,
          status: session.status,
          updatedBy: socket.user._id,
          updatedByName: socket.user.name
        });

      } catch (error) {
        console.error('Error updating session status:', error);
        socket.emit('error', { message: 'Failed to update session status' });
      }
    });

    // Handle leaving session
    socket.on('leave_session', async (data) => {
      try {
        const { sessionId } = data;
        const roomName = `session_${sessionId}`;
        
        socket.leave(roomName);
        
        // Remove from active sessions
        if (activeSessions.has(sessionId)) {
          activeSessions.get(sessionId).delete(socket.user._id.toString());
          if (activeSessions.get(sessionId).size === 0) {
            activeSessions.delete(sessionId);
          }
        }

        socket.to(roomName).emit('user_left_session', {
          userId: socket.user._id,
          name: socket.user.name
        });

      } catch (error) {
        console.error('Error leaving session:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);
      
      // Remove from active users
      activeUsers.delete(socket.user._id.toString());
      
      // Remove from all active sessions
      for (const [sessionId, participants] of activeSessions.entries()) {
        if (participants.has(socket.user._id.toString())) {
          participants.delete(socket.user._id.toString());
          
          // Notify other participants
          socket.to(`session_${sessionId}`).emit('user_left_session', {
            userId: socket.user._id,
            name: socket.user.name
          });
          
          if (participants.size === 0) {
            activeSessions.delete(sessionId);
          }
        }
      }

      // Emit user offline status
      socket.broadcast.emit('user_offline', {
        userId: socket.user._id
      });
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Utility function to send notification to user
  const sendNotificationToUser = (userId, notification) => {
    io.to(`user_${userId}`).emit('new_notification', notification);
  };

  // Utility function to get active users
  const getActiveUsers = () => {
    return Array.from(activeUsers.values()).map(user => ({
      userId: user.user._id,
      name: user.user.name,
      avatar: user.user.avatar,
      connectedAt: user.connectedAt
    }));
  };

  // Utility function to check if user is online
  const isUserOnline = (userId) => {
    return activeUsers.has(userId.toString());
  };

  // Export utility functions
  io.sendNotificationToUser = sendNotificationToUser;
  io.getActiveUsers = getActiveUsers;
  io.isUserOnline = isUserOnline;
};

module.exports = socketHandler;