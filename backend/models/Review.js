const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.ObjectId,
    ref: 'Session',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: mongoose.Schema.ObjectId,
    ref: 'Skill',
    required: true
  },
  // Overall rating
  rating: {
    type: Number,
    required: [true, 'Please add a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  // Detailed ratings
  detailedRatings: {
    knowledge: {
      type: Number,
      min: [1, 'Knowledge rating must be at least 1'],
      max: [5, 'Knowledge rating cannot be more than 5']
    },
    communication: {
      type: Number,
      min: [1, 'Communication rating must be at least 1'],
      max: [5, 'Communication rating cannot be more than 5']
    },
    patience: {
      type: Number,
      min: [1, 'Patience rating must be at least 1'],
      max: [5, 'Patience rating cannot be more than 5']
    },
    preparation: {
      type: Number,
      min: [1, 'Preparation rating must be at least 1'],
      max: [5, 'Preparation rating cannot be more than 5']
    },
    punctuality: {
      type: Number,
      min: [1, 'Punctuality rating must be at least 1'],
      max: [5, 'Punctuality rating cannot be more than 5']
    }
  },
  // Written review
  comment: {
    type: String,
    maxlength: [500, 'Comment cannot be more than 500 characters'],
    default: ''
  },
  // Review type
  reviewType: {
    type: String,
    enum: ['teacher-review', 'learner-review'],
    required: true
  },
  // Helpful votes from other users
  helpfulVotes: {
    type: Number,
    default: 0
  },
  votedBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    helpful: {
      type: Boolean,
      required: true
    }
  }],
  // Review status
  status: {
    type: String,
    enum: ['active', 'flagged', 'hidden'],
    default: 'active'
  },
  // Moderation
  flaggedBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other'],
      required: true
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  moderatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  moderationNotes: {
    type: String,
    maxlength: [300, 'Moderation notes cannot be more than 300 characters']
  },
  // Response from reviewee
  response: {
    comment: {
      type: String,
      maxlength: [300, 'Response cannot be more than 300 characters']
    },
    respondedAt: Date
  },
  // Review metrics
  wasSessionCompleted: {
    type: Boolean,
    default: true
  },
  sessionDuration: {
    type: Number, // in minutes
    default: 0
  },
  // Tags for categorizing feedback
  tags: [{
    type: String,
    enum: [
      'excellent-teacher', 'patient', 'knowledgeable', 'well-prepared',
      'punctual', 'engaging', 'clear-explanations', 'helpful-resources',
      'encouraging', 'professional', 'flexible', 'responsive',
      'needs-improvement', 'late', 'unprepared', 'unclear',
      'impatient', 'technical-issues', 'cancelled-last-minute'
    ]
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ session: 1 });
reviewSchema.index({ skill: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ reviewType: 1 });

// Compound indexes for common queries
reviewSchema.index({ reviewee: 1, status: 1 });
reviewSchema.index({ reviewee: 1, rating: -1 });
reviewSchema.index({ skill: 1, rating: -1 });

// Ensure one review per user per session
reviewSchema.index({ session: 1, reviewer: 1 }, { unique: true });

// Virtual for average detailed rating
reviewSchema.virtual('averageDetailedRating').get(function() {
  if (!this.detailedRatings) return null;
  
  const ratings = Object.values(this.detailedRatings).filter(rating => rating > 0);
  if (ratings.length === 0) return null;
  
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
});

// Virtual for review age
reviewSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  if (this.votedBy.length === 0) return 0;
  const helpfulCount = this.votedBy.filter(vote => vote.helpful).length;
  return Math.round((helpfulCount / this.votedBy.length) * 100);
});

// Method to add helpful vote
reviewSchema.methods.addHelpfulVote = function(userId, isHelpful) {
  // Remove existing vote from this user
  this.votedBy = this.votedBy.filter(vote => vote.user.toString() !== userId.toString());
  
  // Add new vote
  this.votedBy.push({
    user: userId,
    helpful: isHelpful
  });
  
  // Update helpful votes count
  this.helpfulVotes = this.votedBy.filter(vote => vote.helpful).length;
};

// Method to flag review
reviewSchema.methods.flagReview = function(userId, reason) {
  // Check if user already flagged this review
  const existingFlag = this.flaggedBy.find(flag => flag.user.toString() === userId.toString());
  
  if (!existingFlag) {
    this.flaggedBy.push({
      user: userId,
      reason
    });
    
    // Auto-hide if flagged by multiple users
    if (this.flaggedBy.length >= 3) {
      this.status = 'flagged';
    }
  }
};

// Method to add response
reviewSchema.methods.addResponse = function(comment) {
  this.response = {
    comment,
    respondedAt: new Date()
  };
};

// Method to moderate review
reviewSchema.methods.moderate = function(moderatorId, action, notes = '') {
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationNotes = notes;
  
  if (action === 'approve') {
    this.status = 'active';
  } else if (action === 'hide') {
    this.status = 'hidden';
  }
};

// Static method to get reviews for a user
reviewSchema.statics.getUserReviews = function(userId, reviewType = null) {
  const query = { reviewee: userId, status: 'active' };
  
  if (reviewType) {
    query.reviewType = reviewType;
  }
  
  return this.find(query)
    .populate('reviewer', 'name avatar')
    .populate('skill', 'name category')
    .populate('session', 'scheduledAt duration')
    .sort({ createdAt: -1 });
};

// Static method to get review statistics for a user
reviewSchema.statics.getUserReviewStats = async function(userId, reviewType = null) {
  const matchQuery = { reviewee: mongoose.Types.ObjectId(userId), status: 'active' };
  
  if (reviewType) {
    matchQuery.reviewType = reviewType;
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        },
        averageKnowledge: { $avg: '$detailedRatings.knowledge' },
        averageCommunication: { $avg: '$detailedRatings.communication' },
        averagePatience: { $avg: '$detailedRatings.patience' },
        averagePreparation: { $avg: '$detailedRatings.preparation' },
        averagePunctuality: { $avg: '$detailedRatings.punctuality' }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      detailedAverages: {}
    };
  }
  
  const result = stats[0];
  
  // Calculate rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  result.ratingDistribution.forEach(rating => {
    distribution[rating] = (distribution[rating] || 0) + 1;
  });
  
  return {
    totalReviews: result.totalReviews,
    averageRating: Math.round(result.averageRating * 10) / 10,
    ratingDistribution: distribution,
    detailedAverages: {
      knowledge: Math.round((result.averageKnowledge || 0) * 10) / 10,
      communication: Math.round((result.averageCommunication || 0) * 10) / 10,
      patience: Math.round((result.averagePatience || 0) * 10) / 10,
      preparation: Math.round((result.averagePreparation || 0) * 10) / 10,
      punctuality: Math.round((result.averagePunctuality || 0) * 10) / 10
    }
  };
};

// Pre-save middleware to calculate overall rating from detailed ratings
reviewSchema.pre('save', function(next) {
  if (this.detailedRatings && !this.rating) {
    const ratings = Object.values(this.detailedRatings).filter(rating => rating > 0);
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, rating) => acc + rating, 0);
      this.rating = Math.round(sum / ratings.length);
    }
  }
  next();
});

module.exports = mongoose.model('Review', reviewSchema);