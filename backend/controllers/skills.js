const Skill = require('../models/Skill');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get skills with filtering
// @route   GET /api/skills
// @access  Public
exports.getSkills = asyncHandler(async (req, res, next) => {
  const { userId, tag, minProficiency, maxProficiency, type, category, search } = req.query;
  const filter = { isActive: true };

  if (userId) filter.user = userId;
  if (tag) filter.tags = tag;
  if (type) filter.type = type;
  if (category) filter.category = category;
  
  if (minProficiency) {
    filter.proficiency = { ...filter.proficiency, $gte: minProficiency };
  }
  if (maxProficiency) {
    filter.proficiency = { ...filter.proficiency, $lte: maxProficiency };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const skills = await Skill.find(filter).populate('user', 'name avatar rating');

  res.status(200).json({
    success: true,
    count: skills.length,
    data: skills
  });
});

// @desc    Get single skill
// @route   GET /api/skills/:id
// @access  Public
exports.getSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findById(req.params.id).populate('user', 'name avatar rating');

  if (!skill || !skill.isActive) {
    return next(new ErrorResponse(`Skill not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: skill
  });
});

// @desc    Create new skill
// @route   POST /api/skills
// @access  Private
exports.createSkill = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  const existingSkill = await Skill.findOne({
    user: req.user.id,
    name: req.body.name,
    type: req.body.type
  });
  
  if (existingSkill && existingSkill.isActive) {
    return next(new ErrorResponse(`You already have an active skill named "${req.body.name}" for ${req.body.type}`, 400));
  }

  const skill = await Skill.create(req.body);

  // Recalculate profile completeness
  const user = await User.findById(req.user.id);
  if (user) {
    await user.calculateProfileCompleteness();
    await user.save();
  }

  res.status(201).json({
    success: true,
    data: skill
  });
});

// @desc    Update a skill
// @route   PUT /api/skills/:id
// @access  Private
exports.updateSkill = asyncHandler(async (req, res, next) => {
  let skill = await Skill.findById(req.params.id);

  if (!skill) {
    return next(new ErrorResponse(`Skill not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is skill owner (or an admin)
  if (skill.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this skill`, 401));
  }

  // Prevent user from changing critical fields like user or type
  delete req.body.user;
  delete req.body.type;

  skill = await Skill.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: skill
  });
});

// @desc    Delete a skill (soft delete)
// @route   DELETE /api/skills/:id
// @access  Private
exports.deleteSkill = asyncHandler(async (req, res, next) => {
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    return next(new ErrorResponse(`Skill not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is skill owner (or an admin)
  if (skill.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this skill`, 401));
  }

  // Soft delete by setting isActive to false
  skill.isActive = false;
  await skill.save();
  
  // Recalculate profile completeness
  const user = await User.findById(req.user.id);
  if (user) {
    await user.calculateProfileCompleteness();
    await user.save();
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});