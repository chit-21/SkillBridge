const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken'); // Import the RefreshToken model
const Queue = require('bull');
const PointsTransaction = require('../models/PointsTransaction');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role = 'user' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  // Create welcome points transaction
  await PointsTransaction.createEarning(
    user._id,
    100,
    'signup-bonus',
    'Welcome bonus for joining SkillBridge!'
  );

  // Create welcome notification
  await Notification.createNotification({
    recipient: user._id,
    type: 'account-update',
    title: 'Welcome to SkillBridge!',
    message: 'Complete your profile to start matching with other users.',
    channels: { inApp: true, email: true },
    priority: 'normal'
  });

  // Generate email verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  await user.save();

  // Send verification email
  try {
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;

    // Add email sending job to the queue
    await emailQueue.add({
      template: 'verification',
      userEmail: user.email,
      subject: 'SkillBridge - Verify Your Email',
      verificationUrl: verificationUrl,
    });

    // await sendEmail({
    //   email: user.email,
    //   subject: 'SkillBridge - Verify Your Email',
    //   message: `Please verify your email by clicking: ${verificationUrl}`,
    //   html: htmlTemplate
    // });

  } catch (error) {
    console.error('Error sending verification email:', error);
    // Don't fail registration if email fails
  }

  sendTokenResponse(user, 201, res, 'User registered successfully. Please check your email for verification.');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new ErrorResponse('Account has been deactivated', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('skills', 'name category type proficiency')
    .select('-password');

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    bio: req.body.bio,
    location: req.body.location,
    timezone: req.body.timezone,
    availability: req.body.availability,
    socialLinks: req.body.socialLinks,
    preferences: req.body.preferences
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  // Check if profile completion improved
  const oldCompleteness = user.profileCompleteness;
  const newCompleteness = user.calculateProfileCompleteness();
  
  if (newCompleteness > oldCompleteness && newCompleteness >= 80) {
    // Award points for profile completion
    await PointsTransaction.createEarning(
      user._id,
      50,
      'profile-completion',
      'Bonus for completing your profile!'
    );

    await Notification.createNotification({
      recipient: user._id,
      type: 'points-earned',
      title: 'Profile Completion Bonus!',
      message: 'You earned 50 points for completing your profile.',
      channels: { inApp: true },
      priority: 'normal'
    });
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user,
    message: 'Profile updated successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

  try {

    // Add email sending job to the queue
    await emailQueue.add({
      template: 'resetPassword',
      userEmail: user.email,
      subject: 'SkillBridge - Password Reset',
      resetUrl: resetUrl,
    });

    // await sendEmail({
    //   email: user.email,
    //   subject: 'SkillBridge - Password Reset',
    //   message: `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`,
    // });

    res.status(200).json({
      success: true,
      message: 'Email sent'
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetPasswordToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful');
});

// Helper function to generate a new refresh token
const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex'); // Generate a longer, more secure token
  const refreshToken = await RefreshToken.create({
    user: userId,
    token,
  });
  return token;
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  console.log(`refreshToken ${refreshToken}`);

  if (!refreshToken) {
    return next(new ErrorResponse('Refresh token is required', 400));
  }

  try {
    // Verify the refresh token against the database
    const storedRefreshToken = await RefreshToken.findOne({ token: refreshToken }).populate('user');

    if (!storedRefreshToken) {
      return next(new ErrorResponse('Invalid refresh token', 401));
    }

    const user = storedRefreshToken.user;

    if (!user || !user.isActive) {
      return next(new ErrorResponse('Invalid refresh token', 401));
    }

    // Delete the used refresh token from the database
    await storedRefreshToken.deleteOne();

    // Generate a new refresh token
    const newRefreshToken = await generateRefreshToken(user._id);


    // Send the new tokens
    sendTokenResponse(user, 200, res, 'Token refreshed successfully');


  } catch (error) {
    console.log(`error ${error}`);
    return next(new ErrorResponse('Invalid refresh token', 401));
  }
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken
  });

  if (!user) {
    return next(new ErrorResponse('Invalid verification token', 400));
  }

  // Verify email
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  // Award points for email verification
  await PointsTransaction.createEarning(
    user._id,
    25,
    'profile-completion',
    'Bonus for verifying your email!'
  );

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.isEmailVerified) {
    return next(new ErrorResponse('Email is already verified', 400));
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  await user.save();

  // Send verification email
  try {
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;

    // Add email sending job to the queue
    await emailQueue.add({
      template: 'resendVerification',
      userEmail: user.email,
      subject: 'SkillBridge - Verify Your Email',
      verificationUrl: verificationUrl,
    });

    // await sendEmail({
    //   email: user.email,
    //   subject: 'SkillBridge - Verify Your Email',
    //   message: `Please verify your email by clicking: ${verificationUrl}`,
    // });

    res.status(200).json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, message, refreshToken) => {
  // Create token
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      refreshToken: refreshToken || user.getRefreshToken(),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        points: user.points,
        rating: user.rating,
        profileCompleteness: user.profileCompleteness,
        isEmailVerified: user.isEmailVerified
      }
    });
};

// Email queue processor
emailQueue.process(async (job, done) => {
  const { data } = job;
  try {
    let htmlTemplate;
    let message;

    if (data.template === 'verification') {
      message = `Please verify your email by clicking: ${data.verificationUrl}`;
      htmlTemplate = `<h2>Welcome to SkillBridge!</h2><p>Thank you for joining our community. Please verify your email address to complete your registration.</p><a href="${data.verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a><p>If the button doesn't work, copy and paste this link: ${data.verificationUrl}</p>`;
    } else if (data.template === 'resetPassword') {
      message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${data.resetUrl}`;
      htmlTemplate = `<h2>Password Reset Request</h2><p>You are receiving this email because you (or someone else) has requested the reset of a password.</p><a href="${data.resetUrl}" style="background-color: #f44336; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a><p>If you did not request this, please ignore this email and your password will remain unchanged.</p><p>This link will expire in 10 minutes.</p>`;
    } else if (data.template === 'resendVerification') {
      message = `Please verify your email by clicking: ${data.verificationUrl}`;
      htmlTemplate = `<h2>Email Verification</h2><p>Please verify your email address to complete your registration.</p><a href="${data.verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a><p>If the button doesn't work, copy and paste this link: ${data.verificationUrl}</p>`;
    }

    await sendEmail({
      email: data.userEmail,
      subject: data.subject,
      message: message,
      html: htmlTemplate
    });

    done(); // Signal successful completion
  } catch (error) {
    console.error('Error processing email queue job:', error);
    done(error); // Signal job failure
  }
});

// Handle queue errors
emailQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err);
});
module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  refreshToken,
  verifyEmail,
  resendVerification
};