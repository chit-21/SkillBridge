const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot be more than 100 characters'],
    default: ''
  },
  timezone: {
    type: String,
    enum: [
      'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
      'Asia/Kolkata', 'Australia/Sydney'
    ],
    default: 'UTC'
  },
  availability: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    }
  }],
  points: {
    type: Number,
    default: 100 // Starting points for new users
  },
  totalPointsEarned: {
    type: Number,
    default: 0
  },
  totalPointsSpent: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  profileCompleteness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      inApp: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
      },
      showEmail: {
        type: Boolean,
        default: false
      }
    }
  },
  fcmTokens: [String], // For push notifications
  socialLinks: {
    linkedin: String,
    github: String,
    website: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ 'rating.average': -1 });
userSchema.index({ points: -1 });
userSchema.index({ timezone: 1 });
userSchema.index({ isActive: 1 });

// Virtual for user's skills
userSchema.virtual('skills', {
  ref: 'Skill',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

// Calculate profile completeness
userSchema.methods.calculateProfileCompleteness = async function() {
  let completeness = 0;
  const MAX_POINTS = 100;
  const weights = {
    base: 50, // name, email, avatar
    details: 20, // bio, location, timezone
    availability: 10,
    social: 10,
    skills: 10,
  };

  // Base fields (50%) - Assuming email and name are always present for a registered user
  if (this.avatar && this.avatar.trim() !== '') completeness += weights.base;

  // Detail fields (20%)
  let detailPoints = 0;
  if (this.bio && this.bio.trim() !== '') detailPoints += weights.details / 3;
  if (this.location && this.location.trim() !== '') detailPoints += weights.details / 3;
  if (this.timezone && this.timezone !== 'UTC') detailPoints += weights.details / 3; // Give points for setting a non-default timezone
  completeness += Math.round(detailPoints);

  // Availability (10%)
  if (this.availability && this.availability.length > 0) {
    completeness += weights.availability;
  }

  // Social Links (10%)
  const socialFields = Object.values(this.socialLinks || {});
  if (socialFields.some(link => link && link.trim() !== '')) {
    completeness += weights.social;
  }

  // Skills (10%) - This requires a query to the skills collection
  const Skill = mongoose.model('Skill');
  const skillsCount = await Skill.countDocuments({ user: this._id, isActive: true });
  if (skillsCount > 0) {
    completeness += weights.skills;
  }

  this.profileCompleteness = Math.min(Math.round(completeness), MAX_POINTS);
  return this.profileCompleteness;
};

// Update rating
userSchema.methods.updateRating = function(newRating) {
  const currentTotal = this.rating.average * this.rating.count;
  this.rating.count += 1;
  this.rating.average = (currentTotal + newRating) / this.rating.count;
  this.rating.average = Math.round(this.rating.average * 10) / 10; // Round to 1 decimal
};

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Update profile completeness before saving
userSchema.pre('save', async function(next) {
  // Recalculate only if relevant fields are modified to avoid overhead
  if (this.isModified('bio') || this.isModified('avatar') || this.isModified('location') || this.isModified('timezone') || this.isModified('availability') || this.isModified('socialLinks')) {
    await this.calculateProfileCompleteness();
  }
  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Generate refresh token
userSchema.methods.getRefreshToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);