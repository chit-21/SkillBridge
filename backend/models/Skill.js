const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a skill name'],
    trim: true,
    maxlength: [50, 'Skill name cannot be more than 50 characters']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    trim: true,
    maxlength: [30, 'Category cannot be more than 30 characters'],
    enum: [
      'Programming', 'Design', 'Marketing', 'Business', 'Language', 'Music',
      'Art', 'Writing', 'Photography', 'Cooking', 'Fitness', 'Academic',
      'Crafts', 'Technology', 'Other'
    ]
  },
  proficiency: {
    type: Number,
    required: [true, 'Please add proficiency level'],
    min: [1, 'Proficiency must be at least 1'],
    max: [5, 'Proficiency cannot be more than 5']
  },
  type: {
    type: String,
    required: [true, 'Please specify if teaching or learning'],
    enum: ['teaching', 'learning']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters'],
    default: ''
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot be more than 20 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // For teaching skills
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate cannot be negative'],
    default: 0 // 0 means free
  },
  // Experience and credentials
  experience: {
    years: {
      type: Number,
      min: [0, 'Years of experience cannot be negative'],
      default: 0
    },
    description: {
      type: String,
      maxlength: [300, 'Experience description cannot be more than 300 characters'],
      default: ''
    }
  },
  certifications: [{
    name: {
      type: String,
      required: true,
      maxlength: [100, 'Certification name cannot be more than 100 characters']
    },
    issuer: {
      type: String,
      maxlength: [100, 'Issuer name cannot be more than 100 characters']
    },
    dateObtained: Date,
    url: String
  }],
  // Statistics
  stats: {
    totalSessions: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  // Matching preferences
  preferences: {
    minProficiency: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    maxProficiency: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    preferredTimezones: [{
      type: String,
      enum: [
        'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
        'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
        'Asia/Kolkata', 'Australia/Sydney'
      ]
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
skillSchema.index({ user: 1 });
skillSchema.index({ name: 1 });
skillSchema.index({ category: 1 });
skillSchema.index({ type: 1 });
skillSchema.index({ proficiency: 1 });
skillSchema.index({ isActive: 1 });
skillSchema.index({ 'stats.averageRating': -1 });
skillSchema.index({ tags: 1 });

// Compound indexes for common queries
skillSchema.index({ category: 1, type: 1 });
skillSchema.index({ name: 1, type: 1 });
skillSchema.index({ user: 1, type: 1 });

// Virtual for populated user
skillSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Update skill statistics
skillSchema.methods.updateStats = function(sessionDuration, rating) {
  this.stats.totalSessions += 1;
  this.stats.totalHours += sessionDuration / 60; // Convert minutes to hours
  
  if (rating) {
    const currentTotal = this.stats.averageRating * this.stats.totalReviews;
    this.stats.totalReviews += 1;
    this.stats.averageRating = (currentTotal + rating) / this.stats.totalReviews;
    this.stats.averageRating = Math.round(this.stats.averageRating * 10) / 10; // Round to 1 decimal
  }
};

// Static method to get skills by category
skillSchema.statics.getSkillsByCategory = function(category, type = null) {
  const query = { category, isActive: true };
  if (type) {
    query.type = type;
  }
  return this.find(query).populate('user', 'name avatar rating location timezone');
};

// Static method to search skills
skillSchema.statics.searchSkills = function(searchTerm, filters = {}) {
  const query = {
    isActive: true,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  };

  // Apply filters
  if (filters.category) query.category = filters.category;
  if (filters.type) query.type = filters.type;
  if (filters.minProficiency) query.proficiency = { $gte: filters.minProficiency };
  if (filters.maxProficiency) {
    query.proficiency = query.proficiency || {};
    query.proficiency.$lte = filters.maxProficiency;
  }

  return this.find(query).populate('user', 'name avatar rating location timezone');
};

// Pre-save middleware to ensure proficiency constraints
skillSchema.pre('save', function(next) {
  if (this.preferences.minProficiency > this.preferences.maxProficiency) {
    this.preferences.maxProficiency = this.preferences.minProficiency;
  }
  next();
});

module.exports = mongoose.model('Skill', skillSchema);