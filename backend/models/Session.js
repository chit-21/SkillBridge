const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.ObjectId,
    ref: 'Match',
    required: true
  },
  teacher: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  learner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: mongoose.Schema.ObjectId,
    ref: 'Skill',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a session title'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    default: ''
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Please add a scheduled date and time']
  },
  duration: {
    type: Number,
    required: [true, 'Please add session duration in minutes'],
    min: [15, 'Session must be at least 15 minutes'],
    max: [180, 'Session cannot be more than 180 minutes']
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  // Session logistics
  meetingLink: {
    type: String,
    default: ''
  },
  roomId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Points transaction
  pointsCost: {
    type: Number,
    required: true,
    min: [0, 'Points cost cannot be negative']
  },
  pointsTransactionId: {
    type: mongoose.Schema.ObjectId,
    ref: 'PointsTransaction'
  },
  // Session tracking
  actualStartTime: Date,
  actualEndTime: Date,
  actualDuration: {
    type: Number,
    default: 0 // in minutes
  },
  // Attendance tracking
  teacherJoined: {
    type: Boolean,
    default: false
  },
  learnerJoined: {
    type: Boolean,
    default: false
  },
  teacherJoinedAt: Date,
  learnerJoinedAt: Date,
  // Session content
  agenda: [{
    item: {
      type: String,
      required: true,
      maxlength: [200, 'Agenda item cannot be more than 200 characters']
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  resources: [{
    name: {
      type: String,
      required: true,
      maxlength: [100, 'Resource name cannot be more than 100 characters']
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['document', 'video', 'website', 'other'],
      default: 'other'
    }
  }],
  // Session notes
  teacherNotes: {
    type: String,
    maxlength: [1000, 'Teacher notes cannot be more than 1000 characters'],
    default: ''
  },
  learnerNotes: {
    type: String,
    maxlength: [1000, 'Learner notes cannot be more than 1000 characters'],
    default: ''
  },
  // Cancellation details
  cancelledBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String,
    maxlength: [300, 'Cancellation reason cannot be more than 300 characters']
  },
  cancelledAt: Date,
  // Rescheduling
  rescheduledFrom: Date,
  rescheduledBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  rescheduledAt: Date,
  // Reminders sent
  remindersSent: {
    oneDayBefore: {
      type: Boolean,
      default: false
    },
    oneHourBefore: {
      type: Boolean,
      default: false
    },
    fifteenMinutesBefore: {
      type: Boolean,
      default: false
    }
  },
  // Session quality metrics
  connectionQuality: {
    teacher: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    learner: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    }
  },
  // Technical issues
  technicalIssues: [{
    reportedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    issue: {
      type: String,
      required: true,
      maxlength: [200, 'Issue description cannot be more than 200 characters']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
sessionSchema.index({ teacher: 1 });
sessionSchema.index({ learner: 1 });
sessionSchema.index({ scheduledAt: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ match: 1 });
sessionSchema.index({ skill: 1 });

// Compound indexes for common queries
sessionSchema.index({ teacher: 1, status: 1 });
sessionSchema.index({ learner: 1, status: 1 });
sessionSchema.index({ scheduledAt: 1, status: 1 });

// Virtual for session participants
sessionSchema.virtual('participants', {
  ref: 'User',
  localField: 'teacher learner',
  foreignField: '_id',
  justOne: false
});

// Virtual to check if session is upcoming
sessionSchema.virtual('isUpcoming').get(function() {
  return this.scheduledAt > new Date() && this.status === 'scheduled';
});

// Virtual to check if session is overdue
sessionSchema.virtual('isOverdue').get(function() {
  const now = new Date();
  const sessionEnd = new Date(this.scheduledAt.getTime() + (this.duration * 60000));
  return now > sessionEnd && this.status === 'scheduled';
});

// Virtual for time until session
sessionSchema.virtual('timeUntilSession').get(function() {
  const now = new Date();
  return Math.max(0, this.scheduledAt - now);
});

// Method to start session
sessionSchema.methods.startSession = function() {
  this.status = 'in-progress';
  this.actualStartTime = new Date();
};

// Method to end session
sessionSchema.methods.endSession = function() {
  this.status = 'completed';
  this.actualEndTime = new Date();
  
  if (this.actualStartTime) {
    this.actualDuration = Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60));
  }
};

// Method to cancel session
sessionSchema.methods.cancelSession = function(userId, reason) {
  this.status = 'cancelled';
  this.cancelledBy = userId;
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
};

// Method to reschedule session
sessionSchema.methods.rescheduleSession = function(newDateTime, userId) {
  this.rescheduledFrom = this.scheduledAt;
  this.scheduledAt = newDateTime;
  this.rescheduledBy = userId;
  this.rescheduledAt = new Date();
  
  // Reset reminder flags
  this.remindersSent = {
    oneDayBefore: false,
    oneHourBefore: false,
    fifteenMinutesBefore: false
  };
};

// Method to mark user as joined
sessionSchema.methods.markUserJoined = function(userId) {
  if (userId.toString() === this.teacher.toString()) {
    this.teacherJoined = true;
    this.teacherJoinedAt = new Date();
  } else if (userId.toString() === this.learner.toString()) {
    this.learnerJoined = true;
    this.learnerJoinedAt = new Date();
  }
  
  // Start session if both users have joined
  if (this.teacherJoined && this.learnerJoined && this.status === 'scheduled') {
    this.startSession();
  }
};

// Method to add agenda item
sessionSchema.methods.addAgendaItem = function(item) {
  this.agenda.push({ item });
};

// Method to mark agenda item as completed
sessionSchema.methods.completeAgendaItem = function(index) {
  if (this.agenda[index]) {
    this.agenda[index].completed = true;
  }
};

// Method to add resource
sessionSchema.methods.addResource = function(name, url, type = 'other') {
  this.resources.push({ name, url, type });
};

// Method to report technical issue
sessionSchema.methods.reportTechnicalIssue = function(userId, issue) {
  this.technicalIssues.push({
    reportedBy: userId,
    issue
  });
};

// Static method to find user sessions
sessionSchema.statics.findUserSessions = function(userId, status = null) {
  const query = {
    $or: [
      { teacher: userId },
      { learner: userId }
    ]
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('teacher', 'name avatar timezone')
    .populate('learner', 'name avatar timezone')
    .populate('skill', 'name category')
    .sort({ scheduledAt: -1 });
};

// Static method to find upcoming sessions
sessionSchema.statics.findUpcomingSessions = function(userId) {
  return this.find({
    $or: [
      { teacher: userId },
      { learner: userId }
    ],
    scheduledAt: { $gte: new Date() },
    status: 'scheduled'
  })
  .populate('teacher', 'name avatar timezone')
  .populate('learner', 'name avatar timezone')
  .populate('skill', 'name category')
  .sort({ scheduledAt: 1 });
};

// Pre-save middleware to generate room ID
sessionSchema.pre('save', function(next) {
  if (this.isNew && !this.roomId) {
    this.roomId = `session_${this._id}_${Date.now()}`;
  }
  next();
});

// Pre-save middleware to handle overdue sessions
sessionSchema.pre('save', function(next) {
  if (this.isOverdue && this.status === 'scheduled') {
    this.status = 'no-show';
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);