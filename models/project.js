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
  currentPhase: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
    default: 1,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Residential', 'Commercial'],
  },
  images: [imageSchema],
});

module.exports = mongoose.model('Project', projectSchema);
