const mongoose = require('mongoose');

const pointsTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earned', 'spent', 'bonus', 'refund', 'penalty'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add transaction amount'],
    min: [0, 'Amount cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Please add transaction description'],
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  // Related entities
  session: {
    type: mongoose.Schema.ObjectId,
    ref: 'Session'
  },
  skill: {
    type: mongoose.Schema.ObjectId,
    ref: 'Skill'
  },
  relatedUser: {
    type: mongoose.Schema.ObjectId,
    ref: 'User' // The other user involved in the transaction
  },
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  // Balance tracking
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  // Transaction metadata
  category: {
    type: String,
    enum: [
      'session-teaching', 'session-learning', 'signup-bonus', 'referral-bonus',
      'profile-completion', 'first-session', 'session-cancellation', 'refund',
      'penalty-no-show', 'penalty-late-cancel', 'admin-adjustment'
    ],
    required: true
  },
  // Admin fields
  processedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User' // Admin who processed manual transactions
  },
  notes: {
    type: String,
    maxlength: [300, 'Notes cannot be more than 300 characters']
  },
  // External reference (for payment integrations)
  externalTransactionId: String,
  // Expiration for pending transactions
  expiresAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
pointsTransactionSchema.index({ user: 1 });
pointsTransactionSchema.index({ type: 1 });
pointsTransactionSchema.index({ status: 1 });
pointsTransactionSchema.index({ category: 1 });
pointsTransactionSchema.index({ createdAt: -1 });
pointsTransactionSchema.index({ session: 1 });

// Compound indexes for common queries
pointsTransactionSchema.index({ user: 1, type: 1 });
pointsTransactionSchema.index({ user: 1, status: 1 });
pointsTransactionSchema.index({ user: 1, createdAt: -1 });

// Virtual for transaction age
pointsTransactionSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual to check if transaction is expired
pointsTransactionSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Method to complete pending transaction
pointsTransactionSchema.methods.complete = function() {
  this.status = 'completed';
  this.expiresAt = undefined;
};

// Method to fail transaction
pointsTransactionSchema.methods.fail = function(reason) {
  this.status = 'failed';
  this.notes = reason;
  this.expiresAt = undefined;
};

// Method to cancel transaction
pointsTransactionSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.notes = reason;
  this.expiresAt = undefined;
};

// Static method to create earning transaction
pointsTransactionSchema.statics.createEarning = async function(userId, amount, category, description, relatedData = {}) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const transaction = new this({
    user: userId,
    type: 'earned',
    amount,
    category,
    description,
    balanceBefore: user.points,
    balanceAfter: user.points + amount,
    ...relatedData
  });
  
  // Update user points
  user.points += amount;
  user.totalPointsEarned += amount;
  
  await Promise.all([transaction.save(), user.save()]);
  
  return transaction;
};

// Static method to create spending transaction
pointsTransactionSchema.statics.createSpending = async function(userId, amount, category, description, relatedData = {}) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.points < amount) {
    throw new Error('Insufficient points');
  }
  
  const transaction = new this({
    user: userId,
    type: 'spent',
    amount,
    category,
    description,
    balanceBefore: user.points,
    balanceAfter: user.points - amount,
    ...relatedData
  });
  
  // Update user points
  user.points -= amount;
  user.totalPointsSpent += amount;
  
  await Promise.all([transaction.save(), user.save()]);
  
  return transaction;
};

// Static method to create refund transaction
pointsTransactionSchema.statics.createRefund = async function(userId, amount, category, description, relatedData = {}) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const transaction = new this({
    user: userId,
    type: 'refund',
    amount,
    category,
    description,
    balanceBefore: user.points,
    balanceAfter: user.points + amount,
    ...relatedData
  });
  
  // Update user points
  user.points += amount;
  
  await Promise.all([transaction.save(), user.save()]);
  
  return transaction;
};

// Static method to get user transaction history
pointsTransactionSchema.statics.getUserTransactions = function(userId, options = {}) {
  const {
    type = null,
    category = null,
    limit = 50,
    page = 1,
    startDate = null,
    endDate = null
  } = options;
  
  const query = { user: userId };
  
  if (type) query.type = type;
  if (category) query.category = category;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('session', 'title scheduledAt')
    .populate('skill', 'name category')
    .populate('relatedUser', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

// Static method to get user points summary
pointsTransactionSchema.statics.getUserPointsSummary = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const summary = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        categories: {
          $push: {
            category: '$category',
            amount: '$amount'
          }
        }
      }
    }
  ]);
  
  const result = {
    earned: { total: 0, count: 0, categories: {} },
    spent: { total: 0, count: 0, categories: {} },
    refund: { total: 0, count: 0, categories: {} }
  };
  
  summary.forEach(item => {
    if (result[item._id]) {
      result[item._id].total = item.total;
      result[item._id].count = item.count;
      
      // Group by categories
      item.categories.forEach(cat => {
        if (!result[item._id].categories[cat.category]) {
          result[item._id].categories[cat.category] = 0;
        }
        result[item._id].categories[cat.category] += cat.amount;
      });
    }
  });
  
  return result;
};

// Pre-save middleware to set expiration for pending transactions
pointsTransactionSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'pending' && !this.expiresAt) {
    // Pending transactions expire after 24 hours
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('PointsTransaction', pointsTransactionSchema);