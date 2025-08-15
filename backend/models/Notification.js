const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'match-found', 'match-accepted', 'match-rejected',
      'session-scheduled', 'session-reminder', 'session-cancelled', 'session-rescheduled',
      'review-received', 'review-request',
      'points-earned', 'points-spent',
      'message-received',
      'system-announcement', 'account-update',
      'skill-approved', 'skill-rejected'
    ],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add notification title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Please add notification message'],
    maxlength: [300, 'Message cannot be more than 300 characters']
  },
  // Related entities
  relatedMatch: {
    type: mongoose.Schema.ObjectId,
    ref: 'Match'
  },
  relatedSession: {
    type: mongoose.Schema.ObjectId,
    ref: 'Session'
  },
  relatedSkill: {
    type: mongoose.Schema.ObjectId,
    ref: 'Skill'
  },
  relatedReview: {
    type: mongoose.Schema.ObjectId,
    ref: 'Review'
  },
  relatedTransaction: {
    type: mongoose.Schema.ObjectId,
    ref: 'PointsTransaction'
  },
  // Notification status
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  // Delivery channels
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  // Delivery status
  deliveryStatus: {
    inApp: {
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date
    },
    email: {
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      error: String
    },
    push: {
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      error: String
    }
  },
  // Action buttons
  actions: [{
    label: {
      type: String,
      required: true,
      maxlength: [30, 'Action label cannot be more than 30 characters']
    },
    action: {
      type: String,
      required: true,
      enum: ['navigate', 'api-call', 'external-link']
    },
    data: {
      type: mongoose.Schema.Types.Mixed // Flexible data for action
    }
  }],
  // Scheduling
  scheduledFor: Date, // For delayed notifications
  expiresAt: Date, // When notification becomes irrelevant
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Read tracking
  readAt: Date,
  archivedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });

// Compound indexes for common queries
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });

// Virtual for notification age
notificationSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

// Virtual to check if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual to check if notification is scheduled
notificationSchema.virtual('isScheduled').get(function() {
  return this.scheduledFor && new Date() < this.scheduledFor;
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
};

// Method to archive notification
notificationSchema.methods.archive = function() {
  this.status = 'archived';
  this.archivedAt = new Date();
};

// Method to mark delivery status
notificationSchema.methods.markDelivered = function(channel, error = null) {
  if (this.deliveryStatus[channel]) {
    this.deliveryStatus[channel].delivered = !error;
    this.deliveryStatus[channel].deliveredAt = new Date();
    if (error) {
      this.deliveryStatus[channel].error = error;
    }
  }
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const {
    recipient,
    sender = null,
    type,
    title,
    message,
    relatedEntities = {},
    channels = { inApp: true, email: false, push: false },
    priority = 'normal',
    actions = [],
    scheduledFor = null,
    expiresAt = null,
    metadata = {}
  } = data;

  const notification = new this({
    recipient,
    sender,
    type,
    title,
    message,
    channels,
    priority,
    actions,
    scheduledFor,
    expiresAt,
    metadata,
    ...relatedEntities
  });

  await notification.save();
  
  // Mark in-app delivery immediately
  if (channels.inApp) {
    notification.markDelivered('inApp');
    await notification.save();
  }

  return notification;
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    status = null,
    type = null,
    limit = 50,
    page = 1,
    includeExpired = false
  } = options;

  const query = { recipient: userId };
  
  if (status) query.status = status;
  if (type) query.type = type;
  
  if (!includeExpired) {
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ];
  }

  return this.find(query)
    .populate('sender', 'name avatar')
    .populate('relatedMatch', 'matchScore status')
    .populate('relatedSession', 'title scheduledAt status')
    .populate('relatedSkill', 'name category')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    status: 'unread',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, status: 'unread' },
    { 
      status: 'read',
      readAt: new Date()
    }
  );
};

// Static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
    status: { $ne: 'unread' } // Keep unread notifications even if expired
  });
};

// Static method to get notifications ready for delivery
notificationSchema.statics.getScheduledNotifications = function() {
  return this.find({
    scheduledFor: { $lte: new Date() },
    status: 'unread'
  });
};

// Pre-save middleware to set default expiration
notificationSchema.pre('save', function(next) {
  // Set default expiration for certain notification types
  if (this.isNew && !this.expiresAt) {
    const expirationDays = {
      'session-reminder': 1,
      'match-found': 7,
      'system-announcement': 30
    };
    
    const days = expirationDays[this.type];
    if (days) {
      this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
  }
  
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);