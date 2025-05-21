const ImageComment = require('../models/imageComment.js');
const Image = require('../models/image.js');
const { body, validationResult } = require('express-validator');

// Create a new comment
exports.createComment = [
  // Validate comment text
  body('text')
    .notEmpty()
    .withMessage('Comment text is required')
    .trim()
    .escape(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if image exists
      const image = await Image.findById(req.params.imageId);
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Create new comment
      const comment = new ImageComment({
        imageId: req.params.imageId,
        userId: req.user._id, // Assuming user is authenticated and available in req.user
        text: req.body.text,
      });

      const savedComment = await comment.save();

      // Populate user details for the response
      await savedComment.populate('userId', 'name');

      res.status(201).json(savedComment);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: 'Error creating comment',
        error: err.message,
      });
    }
  },
];

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await ImageComment.findOne({
      _id: req.params.commentId,
      imageId: req.params.imageId,
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is authorized to delete (either comment owner or admin)
    if (
      comment.userId.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this comment' });
    }

    await ImageComment.findByIdAndDelete(req.params.commentId);
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Error deleting comment',
      error: err.message,
    });
  }
};

// Get all comments for an image
exports.getImageComments = async (req, res) => {
  try {
    const comments = await ImageComment.find({
      imageId: req.params.imageId,
    })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Error fetching comments',
      error: err.message,
    });
  }
};
