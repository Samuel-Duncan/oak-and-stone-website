const ImageComment = require('../models/imageComment.js');
const Image = require('../models/image.js');
const Project = require('../models/project.js');
const User = require('../models/user.js');
const { sendEmail } = require('../utils/nodemailer');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

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

      // Send email notification if commenter is admin
      if (req.user.isAdmin) {
        const imageRecord = await Image.findById(
          req.params.imageId,
        ).populate('projectId');
        if (imageRecord && imageRecord.projectId) {
          const project = imageRecord.projectId;
          const projectOwner = await User.findById(project.userId);

          if (projectOwner) {
            const recipientEmails = [projectOwner.email];
            if (projectOwner.additionalEmailOne) {
              recipientEmails.push(projectOwner.additionalEmailOne);
            }
            if (projectOwner.additionalEmailTwo) {
              recipientEmails.push(projectOwner.additionalEmailTwo);
            }

            const rawLink = process.env.LINK;
            const anChorLink =
              rawLink &&
              (rawLink.startsWith('http://') ||
                rawLink.startsWith('https://'))
                ? rawLink
                : `http://${rawLink}`;

            const subject = 'New Comment on Your Project Image';
            const emailHtml = `
              <p>Hello ${projectOwner.name},</p>
              <p>A new comment has been added to one of your project images by an administrator.</p>
              <p>Comment: "${savedComment.text}"</p>
              <p>Please click the link below to view the comment:</p>
              <a href="${anChorLink}/users/${project.userId}/project/${project._id}#image-${imageRecord._id}">View Comment</a>
              <p>Thank you,</p>
              <p>The Oak & Stone Team</p>
            `;
            sendEmail(recipientEmails, subject, emailHtml);
          }
        }
      } else {
        // Send email notification to admin if commenter is not admin
        const imageRecord = await Image.findById(
          req.params.imageId,
        ).populate('projectId');
        if (imageRecord && imageRecord.projectId) {
          const project = imageRecord.projectId;
          // Assuming admin user details are stored in a way that can be queried, e.g., by a specific role or a known ID
          // For this example, let's assume there's a way to identify the admin.
          // This might need adjustment based on how admin users are actually identified in your system.
          // For instance, if admin has a specific known email or a flag in their user model:
          const adminUser = await User.findOne({ isAdmin: true }); // Example: find an admin user

          if (adminUser) {
            const recipientEmails = [adminUser.email];
            if (adminUser.additionalEmailOne) {
              recipientEmails.push(adminUser.additionalEmailOne);
            }
            if (adminUser.additionalEmailTwo) {
              recipientEmails.push(adminUser.additionalEmailTwo);
            }

            const rawLink = process.env.LINK;
            const anChorLink =
              rawLink &&
              (rawLink.startsWith('http://') ||
                rawLink.startsWith('https://'))
                ? rawLink
                : `http://${rawLink}`;

            const subject = 'New User Comment on Project Image';
            const emailHtml = `
              <p>Hello ${adminUser.name},</p>
              <p>A new comment has been made by ${savedComment.userId.name} on an image in the project at: ${project.address}.</p>
              <p>Comment: "${savedComment.text}"</p>
              <p>Please click the link below to view the comment:</p>
              <a href="${anChorLink}/users/${project.userId}/project/${project._id}#image-${imageRecord._id}">View Comment</a>
              <p>Thank you,</p>
              <p>The Oak & Stone Team</p>
            `;
            sendEmail(recipientEmails, subject, emailHtml);
          }
        }
      }

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
