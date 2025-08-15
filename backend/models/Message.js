const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.ObjectId,
    ref: 'Match',
    required: true
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Please add message content'],
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  // File/image metadata
  fileData: {
    originalName: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    url: String
  },
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message reactions
  reactions: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'Message'
  },
  // Message editing
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  originalContent: String,
  // Message deletion
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
messageSchema.index({ match: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ type: 1 });

// Compound indexes for common queries
messageSchema.index({ match: 1, createdAt: -1 });
messageSchema.index({ match: 1, deleted: 1 });

// Virtual for message age
messageSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

// Virtual to check if message is recent
messageSchema.virtual('isRecent').get(function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.createdAt > fiveMinutesAgo;
});

// Method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  // Check if user already read this message
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    
    // Update status if both users have read
    if (this.readBy.length >= 2) {
      this.status = 'read';
    }
  }
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(reaction => 
    reaction.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji,
    reactedAt: new Date()
  });
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => 
    reaction.user.toString() !== userId.toString()
  );
};

// Method to edit message
messageSchema.methods.editMessage = function(newContent) {
  if (!this.edited) {
    this.originalContent = this.content;
  }
  
  this.content = newContent;
  this.edited = true;
  this.editedAt = new Date();
};

// Method to soft delete message
messageSchema.methods.softDelete = function(userId) {
  this.deleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.content = 'This message has been deleted';
};

// Static method to get match messages
messageSchema.statics.getMatchMessages = function(matchId, options = {}) {
  const {
    limit = 50,
    page = 1,
    includeDeleted = false
  } = options;

  const query = { match: matchId };
  
  if (!includeDeleted) {
    query.deleted = { $ne: true };
  }

  return this.find(query)
    .populate('sender', 'name avatar')
    .populate('replyTo', 'content sender')
    .populate('readBy.user', 'name')
    .populate('reactions.user', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

// Static method to get unread message count for user
messageSchema.statics.getUnreadCount = async function(userId) {
  const Match = mongoose.model('Match');
  
  // Get all matches for the user
  const userMatches = await Match.find({
    $or: [
      { teacher: userId },
      { learner: userId }
    ],
    status: 'accepted'
  }).select('_id');

  const matchIds = userMatches.map(match => match._id);

  // Count unread messages in these matches
  return this.countDocuments({
    match: { $in: matchIds },
    sender: { $ne: userId },
    deleted: { $ne: true },
    'readBy.user': { $ne: userId }
  });
};

// Static method to mark all messages as read in a match
messageSchema.statics.markMatchMessagesAsRead = function(matchId, userId) {
  return this.updateMany(
    {
      match: matchId,
      sender: { $ne: userId },
      'readBy.user': { $ne: userId }
    },
    {
      $push: {
        readBy: {
          user: userId,
          readAt: new Date()
        }
      }
    }
  );
};

// Static method to get recent messages for user
messageSchema.statics.getRecentMessages = async function(userId, limit = 10) {
  const Match = mongoose.model('Match');
  
  // Get all matches for the user
  const userMatches = await Match.find({
    $or: [
      { teacher: userId },
      { learner: userId }
    ],
    status: 'accepted'
  }).select('_id teacher learner');

  const matchIds = userMatches.map(match => match._id);

  // Get latest message from each match
  const recentMessages = await this.aggregate([
    {
      $match: {
        match: { $in: matchIds },
        deleted: { $ne: true }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$match',
        latestMessage: { $first: '$$ROOT' }
      }
    },
    {
      $replaceRoot: { newRoot: '$latestMessage' }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $limit: limit
    }
  ]);

  // Populate the results
  return this.populate(recentMessages, [
    { path: 'sender', select: 'name avatar' },
    { path: 'match', select: 'teacher learner', populate: [
      { path: 'teacher', select: 'name avatar' },
      { path: 'learner', select: 'name avatar' }
    ]}
  ]);
};

// Pre-save middleware to update message status
messageSchema.pre('save', function(next) {
  // Update status based on read receipts
  if (this.readBy.length > 0 && this.status === 'sent') {
    this.status = 'delivered';
  }
  
  next();
});

module.exports = mongoose.model('Message', messageSchema);