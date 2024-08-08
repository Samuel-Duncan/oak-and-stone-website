const Update = require('../models/update');
const Project = require('../models/project');
const { body, validationResult } = require('express-validator');

exports.updateCreateGET = (req, res, next) => {
  res.render('updateForm', {
    title: 'Create Update',
    formAction: `/users/${req.params.userId}/project/${req.params.projectId}/update`,
  });
};

exports.updateCreatePOST = [
  body('week')
    .notEmpty()
    .withMessage('Week is required')
    .isInt({ min: 1 })
    .withMessage('Week must be a positive integer'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .escape(),
  body('description').optional().trim().escape(),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const project = await Project.findById(req.params.projectId);

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

      res.status(201).json(update);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error creating update' });
    }
  },
];

exports.updateUpdateGET = async (req, res) => {
  try {
    const update = await Update.findOne({
      projectId: req.params.projectId,
    }).exec();

    if (update === null) {
      const err = new Error('Update not found');
      err.status = 404;
      return next(err);
    }

    res.render('updateForm', {
      title: 'Edit Update',
      formAction: `/users/${req.params.userId}/project/${req.params.projectId}/update/${update._id}`,
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
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .escape(),
  body('description').optional().trim().escape(),

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
          formAction: `/users/${req.params.userId}/project/${req.params.projectId}/update/${req.params.updateId}`,
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
          `/users/${req.params.userId}/project/${req.params.projectId}`,
        );
      }
    } catch (err) {
      console.error(err);
      res.status(500).render('updateForm', {
        title: 'Edit Update',
        formAction: `/users/${req.params.userId}/project/${req.params.projectId}/update/${req.params.updateId}`,
        errors: [{ msg: 'Error editing update' }],
      });
    }
  },
];
