const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
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
  teachingSkill: {
    type: mongoose.Schema.ObjectId,
    ref: 'Skill',
    required: true
  },
  learningSkill: {
    type: mongoose.Schema.ObjectId,
    ref: 'Skill',
    required: true
  },
  matchScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  // Detailed scoring breakdown
  scoreBreakdown: {
    skillCompatibility: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    proficiencyMatch: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    timezoneCompatibility: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    availabilityOverlap: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    userRatingWeight: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    previousInteractions: {
      type: Number,
      default: 0,
      min: -50,
      max: 50
    }
  },
  // Match explanation for users
  explanation: {
    type: String,
    maxlength: [300, 'Explanation cannot be more than 300 characters']
  },
  // Mutual interest tracking
  teacherInterested: {
    type: Boolean,
    default: false
  },
  learnerInterested: {
    type: Boolean,
    default: false
  },
  // Response tracking
  teacherResponse: {
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    respondedAt: Date,
    message: {
      type: String,
      maxlength: [200, 'Response message cannot be more than 200 characters']
    }
  },
  learnerResponse: {
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    respondedAt: Date,
    message: {
      type: String,
      maxlength: [200, 'Response message cannot be more than 200 characters']
    }
  },
  // Match metadata
  matchedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  },
  // Session tracking
  sessionsCreated: {
    type: Number,
    default: 0
  },
  lastSessionAt: Date,
  // Matching algorithm version (for A/B testing)
  algorithmVersion: {
    type: String,
    default: '1.0'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
matchSchema.index({ teacher: 1 });
matchSchema.index({ learner: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ matchScore: -1 });
matchSchema.index({ expiresAt: 1 });
matchSchema.index({ matchedAt: -1 });

// Compound indexes for common queries
matchSchema.index({ teacher: 1, status: 1 });
matchSchema.index({ learner: 1, status: 1 });
matchSchema.index({ teacher: 1, learner: 1 });

// Virtual for mutual acceptance
matchSchema.virtual('isMutuallyAccepted').get(function() {
  return this.teacherResponse.status === 'accepted' && 
         this.learnerResponse.status === 'accepted';
});

// Virtual for match age in days
matchSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.matchedAt) / (1000 * 60 * 60 * 24));
});

// Virtual for time until expiration
matchSchema.virtual('timeUntilExpiration').get(function() {
  const now = new Date();
  const expiry = new Date(this.expiresAt);
  return Math.max(0, expiry - now);
});

// Method to check if match is expired
matchSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to accept match from teacher side
matchSchema.methods.acceptByTeacher = function(message = '') {
  this.teacherResponse.status = 'accepted';
  this.teacherResponse.respondedAt = new Date();
  this.teacherResponse.message = message;
  this.teacherInterested = true;
  
  // Update overall status if both accepted
  if (this.learnerResponse.status === 'accepted') {
    this.status = 'accepted';
  }
};

// Method to accept match from learner side
matchSchema.methods.acceptByLearner = function(message = '') {
  this.learnerResponse.status = 'accepted';
  this.learnerResponse.respondedAt = new Date();
  this.learnerResponse.message = message;
  this.learnerInterested = true;
  
  // Update overall status if both accepted
  if (this.teacherResponse.status === 'accepted') {
    this.status = 'accepted';
  }
};

// Method to reject match
matchSchema.methods.reject = function(userId, message = '') {
  if (userId.toString() === this.teacher.toString()) {
    this.teacherResponse.status = 'rejected';
    this.teacherResponse.respondedAt = new Date();
    this.teacherResponse.message = message;
  } else if (userId.toString() === this.learner.toString()) {
    this.learnerResponse.status = 'rejected';
    this.learnerResponse.respondedAt = new Date();
    this.learnerResponse.message = message;
  }
  
  this.status = 'rejected';
};

// Method to increment session count
matchSchema.methods.addSession = function() {
  this.sessionsCreated += 1;
  this.lastSessionAt = new Date();
};

// Static method to find matches for a user
matchSchema.statics.findUserMatches = function(userId, status = null) {
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
    .populate('teacher', 'name avatar rating timezone')
    .populate('learner', 'name avatar rating timezone')
    .populate('teachingSkill', 'name category proficiency')
    .populate('learningSkill', 'name category proficiency')
    .sort({ matchScore: -1, matchedAt: -1 });
};

// Static method to find mutual matches
matchSchema.statics.findMutualMatches = function(userId) {
  return this.find({
    $or: [
      { teacher: userId },
      { learner: userId }
    ],
    status: 'accepted'
  })
  .populate('teacher', 'name avatar rating timezone')
  .populate('learner', 'name avatar rating timezone')
  .populate('teachingSkill', 'name category proficiency')
  .populate('learningSkill', 'name category proficiency')
  .sort({ matchedAt: -1 });
};

// Pre-save middleware to update status based on responses
matchSchema.pre('save', function(next) {
  // Auto-expire if past expiration date
  if (this.isExpired() && this.status === 'pending') {
    this.status = 'expired';
  }
  
  // Update overall status based on individual responses
  if (this.teacherResponse.status === 'accepted' && this.learnerResponse.status === 'accepted') {
    this.status = 'accepted';
  } else if (this.teacherResponse.status === 'rejected' || this.learnerResponse.status === 'rejected') {
    this.status = 'rejected';
  }
  
  next();
});

module.exports = mongoose.model('Match', matchSchema);