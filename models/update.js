const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  week: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false,
  },
});

module.exports = mongoose.model('Update', updateSchema);
