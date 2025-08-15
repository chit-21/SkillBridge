const express = require('express');
const {
  getSkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill
} = require('../controllers/skills');

const router = express.Router();

const { protect } = require('../middleware/auth');

router
  .route('/')
  .get(getSkills)
  .post(protect, createSkill);

router
  .route('/:id')
  .get(getSkill)
  .put(protect, updateSkill)
  .delete(protect, deleteSkill);

module.exports = router;