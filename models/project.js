const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const projectSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
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
  images: [imageSchema],
});

projectSchema.virtual('url').get(function () {
  return `/project/${this._id}`;
});

module.exports = mongoose.model('Project', projectSchema);
