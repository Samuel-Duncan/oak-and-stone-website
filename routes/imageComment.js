const express = require('express');
const router = express.Router();
const adminCheck = require('../utils/adminCheck.js');
const imageCommentController = require('../controllers/imageCommentController');

// Create comment
router.post(
  '/:userId/project/:projectId/image/:imageId/comment',
  imageCommentController.createComment,
);

// Delete comment
router.delete(
  '/:userId/project/:projectId/image/:imageId/comment/:commentId',
  imageCommentController.deleteComment,
);

// Get all comments for an image
router.get(
  '/:userId/project/:projectId/image/:imageId/comments',
  imageCommentController.getImageComments,
);

module.exports = router;
