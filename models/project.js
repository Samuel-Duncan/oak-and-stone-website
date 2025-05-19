// models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  description: String,
  phaseName: {
    type: String,
    required: true,
  },
  currentPhase: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 1,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  type: {
    type: String,
    required: true,
    enum: ['Residential', 'Commercial'],
  },
});

projectSchema.virtual('url').get(function () {
  return `/project/${this._id}`;
});

module.exports = mongoose.model('Project', projectSchema);
