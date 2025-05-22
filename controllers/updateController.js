const Update = require('../models/update');
const Project = require('../models/project');
const User = require('../models/user.js');
const { body, validationResult } = require('express-validator');
const { sendEmail } = require('../utils/nodemailer.js');
require('dotenv').config();

exports.updateListGET = async (req, res) => {
  try {
    const allUpdates = await Update.find({
      projectId: req.params.projectId,
    })
      .sort({
        createdAt: 1,
      })
      .exec();

    // If no updates, render with error message
    if (allUpdates.length === 0) {
      return res.render('updateList', {
        title: 'Weekly Updates',
        errorMessage: 'No updates found!',
        updateList: [], // Pass an empty array
        userId: req.params.userId,
        projectId: req.params.projectId,
      });
    }

    // Render with updates
    res.render('updateList', {
      title: 'Weekly Updates',
      updateList: allUpdates,
      userId: req.params.userId,
      projectId: req.params.projectId,
    });
  } catch (err) {
    res.status(500).render('error', {
      message: 'An error occurred while fetching updates.',
    });
  }
};

exports.updateDetailGET = async (req, res) => {
  try {
    const update = await Update.findById(req.params.updateId).exec();

    if (update === null) {
      return res.render('updateDetail', {
        title: 'Update Details',
        errMsg: 'No update found!',
      });
    }

    // Split the description by line breaks and trim extra spaces
    const descriptionArray = update.description
      ? update.description.split(/\r?\n/).map((line) => line.trim())
      : [];

    // Pass the processed description (array of lines) to the view
    res.render('updateDetail', {
      title: 'Update Details',
      update: { ...update.toObject(), description: descriptionArray },
      userId: req.params.userId,
      projectId: req.params.projectId,
    });
  } catch (err) {
    res.status(500).render('error', {
      message: 'An error occurred while fetching this client.',
    });
  }
};

exports.updateCreateGET = (req, res, next) => {
  res.render('updateForm', {
    title: 'Create Update',
    formAction: `/users/${req.params.userId}/project/${req.params.projectId}/weekly-update`,
  });
};

exports.updateCreatePOST = [
  body('week')
    .notEmpty()
    .withMessage('Week is required')
    .isInt({ min: 1 })
    .withMessage('Week must be a positive integer'),
  body('title').notEmpty().withMessage('Title is required').trim(),
  body('description').optional().trim(),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const [project, user] = await Promise.all([
        Project.findById(req.params.projectId),
        User.findById(
          req.params.userId,
          'name email additionalEmailOne additionalEmailTwo',
        ),
      ]);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const update = new Update({
        week: req.body.week,
        title: req.body.title,
        description: req.body.description,
        projectId: req.params.projectId,
      });

      await update.save();
      res.redirect(
        `/users/${req.params.userId}/project/${req.params.projectId}/weekly-updates`,
      );

      try {
        const rawLink = process.env.LINK;
        const anChorLink =
          rawLink &&
          (rawLink.startsWith('http://') ||
            rawLink.startsWith('https://'))
            ? rawLink
            : `http://${rawLink}`;

        const userHtml = `
          <p>Dear, ${user.name.split(' ')[0]}</p>
          <p>We're excited to inform you that a new weekly update for the project at ${
            project.address
          } is available to view.</p>
          <p>To track the progress of your project, please click the link below:</p>
          <p><a href="${anChorLink}">Oak and Stone Client Portal</a></p>
          <p>Thank you for choosing Oak and Stone!</p>
        `;

        // Gather all email addresses into an array, filtering out `null` values
        const emailAddresses = [
          user.email,
          user.additionalEmailOne,
          user.additionalEmailTwo,
        ].filter((email) => email !== null);

        // Send the email to all collected addresses
        await sendEmail(
          emailAddresses,
          'Weekly Update from Oak and Stone',
          userHtml,
        );

        console.log(
          'Email sent successfully to:',
          emailAddresses.join(', '),
        );
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Optional: Add additional error handling logic if necessary
      }
    } catch (err) {
      res.status(500).render('updateForm', {
        title: 'Create Update',
        formAction: `/users/${req.params.userId}/project/${req.params.projectId}/weekly-update`,
        errors: [{ msg: 'Error creating update' }],
      });
    }
  },
];

exports.updateUpdateGET = async (req, res) => {
  try {
    const update = await Update.findOne({
      _id: req.params.updateId,
    }).exec();

    if (update === null) {
      const err = new Error('Update not found');
      err.status = 404;
      return next(err);
    }

    res.render('updateForm', {
      title: 'Edit Update',
      formAction: `/users/${req.params.userId}/project/${req.params.projectId}/weekly-update/${update._id}`,
      update,
    });
  } catch (err) {
    res.status(err.status || 500).render('error', {
      message: 'Error fetching update: ' + err.message,
    });
  }
};

exports.updateUpdatePOST = [
  body('week')
    .notEmpty()
    .withMessage('Week is required')
    .isInt({ min: 1 })
    .withMessage('Week must be a positive integer'),
  body('title').notEmpty().withMessage('Title is required').trim(),
  body('description').optional().trim(),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      const update = new Update({
        week: req.body.week,
        title: req.body.title,
        description: req.body.description,
        _id: req.params.updateId,
      });

      if (!errors.isEmpty()) {
        return res.render('updateForm', {
          title: 'Edit Update',
          formAction: `/users/${req.params.userId}/project/${req.params.projectId}/weekly-update/${req.params.updateId}`,
          update: {
            week: req.body.week,
            title: req.body.title,
            description: req.body.description
              ? req.body.description
              : null,
          },
          errors: errors.array(),
        });
      } else {
        const updatedUpdate = await Update.findByIdAndUpdate(
          req.params.updateId,
          update,
          {},
        );
        res.redirect(
          `/users/${req.params.userId}/project/${req.params.projectId}/weekly-updates`,
        );
      }
    } catch (err) {
      console.error(err);
      res.status(500).render('updateForm', {
        title: 'Edit Update',
        formAction: `/users/${req.params.userId}/project/${req.params.projectId}/weekly-update/${req.params.updateId}`,
        errors: [{ msg: 'Error editing update' }],
      });
    }
  },
];

exports.updateDeleteGET = async (req, res) => {
  try {
    const update = await Update.findById(req.params.updateId).exec();

    if (update === null) {
      return res.redirect(
        `/users/${req.params.userId}/project/${req.params.projectId}/weekly-updates`,
      );
    }

    res.render('updateDelete', {
      title: 'Delete Update',
      update,
      userId: req.params.userId,
      projectId: req.params.projectId,
    });
  } catch (err) {
    res.status(err.status || 500).render('error', {
      message: 'Error fetching update: ' + err.message,
    });
  }
};

exports.updateDeletePOST = async (req, res) => {
  try {
    await Update.findByIdAndDelete(req.params.updateId);
    res.redirect(
      `/users/${req.params.userId}/project/${req.params.projectId}/weekly-updates`,
    );
  } catch (err) {
    res.status(err.status || 500).render('updateDelete', {
      message: 'Error deleting client: ' + err.message,
    });
  }
};
