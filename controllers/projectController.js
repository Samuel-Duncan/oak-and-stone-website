const Project = require('../models/project.js');
const User = require('../models/user.js');
const Update = require('../models/update.js');
const { body, validationResult } = require('express-validator');
const { cloudinary, upload } = require('../utils/cloudinary.js');
const { sendEmail } = require('../utils/nodemailer.js');

exports.projectCreateGET = (req, res, next) => {
  res.render('projectForm', {
    title: 'Create Project',
    formAction: `/users/${req.params.userId}/project`,
  });
};

exports.projectCreatePOST = [
  upload.array('images', 10), // UPLOAD IMAGES
  // Address
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .trim()
    .escape(),

  // Description (optional)
  body('description').optional().trim().escape(),

  // Current Phase
  body('currentPhase')
    .notEmpty()
    .withMessage('Current Phase is required')
    .isInt({ min: 1, max: 4 })
    .withMessage('Current Phase must be between 1 and 4'),

  // Type
  body('type')
    .notEmpty()
    .withMessage('Project type is required')
    .isIn(['Residential', 'Commercial'])
    .withMessage('Invalid project type'),

  // Images (optional)
  body('images')
    .optional() // Allow the field to be empty
    .isArray() // Ensure it's an array
    .withMessage('Images must be provided as an array.')
    .isLength({ max: 10 })
    .withMessage('You can upload a maximum of 10 images.')
    .custom((value) => {
      if (!value || !value.length) return; // Skip if empty

      for (const image of value) {
        if (typeof image !== 'string' || !image.trim()) {
          return Promise.reject('Invalid image URL in images array.');
        }
      }
      return true; // All URLs are valid
    }),

  // Project Create Logic
  projectCreateLogic,
];

async function projectCreateLogic(req, res, next) {
  try {
    const errors = validationResult(req);

    const uploadedImagesPromises = req.files.map(async (file) => {
      try {
        const result = await cloudinary.uploader.upload(file.path);
        return { url: result.secure_url };
      } catch (error) {
        console.error('Error uploading image:', error);
        errors.array().push({
          msg: 'Error uploading image(s). Please try again.',
        });
        return null; // Or handle errors differently
      }
    });

    const uploadedImages = await Promise.all(uploadedImagesPromises);

    const userEmail = await User.findOne(
      { _id: req.params.userId },
      'email',
    );

    const project = new Project({
      address: req.body.address,
      description: req.body.description ? req.body.description : '',
      currentPhase: req.body.currentPhase,
      userId: req.params.userId,
      type: req.body.type,
      images: uploadedImages,
    });

    if (!errors.isEmpty()) {
      res.render('projectForm', {
        title: 'Create Project',
        project,
        formAction: `/users/${req.params.userId}/project`,
        errors: errors.array(),
      });
    } else {
      await project.save();
      res.redirect(`/users/${project.userId}${project.url}`);
      sendEmail(
        userEmail,
        'A new project has been created for you!',
        'Click the link below to keep track of the progress!',
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).render('projectForm', {
      title: 'Create Project',
      formAction: `/users/${req.params.userId}/project`,
      errors: [{ msg: 'Error creating project' }],
    });
  }
}

exports.projectDetailGET = async (req, res) => {
  try {
    const project = await Project.findOne({
      userId: req.params.userId,
    }).exec();

    if (project === null) {
      res.render('projectDetail', {
        title: 'Project Details',
        errMsg: 'No Project found!',
      });
    }

    const update = await Update.findOne({
      projectId: project._id,
    })
      .sort({ createdAt: -1 })
      .exec();

    if (project.images && project.images.length > 0) {
      project.images.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.render('projectDetail', {
      title: 'Project',
      projectDetail: project,
      update: update ? update : null,
    });
  } catch (err) {
    res.status(500).render('error', {
      message: 'An error occurred while fetching this project.',
    });
  }
};

exports.userProjectDetailGET = async (req, res, next) => {
  try {
    const userProject = await Project.findOne({
      _id: req.params.projectId,
      userId: req.params.userId,
    })
      .populate('update') // Assuming 'update' is a populated field
      .lean();

    if (!userProject) {
      return res.render('projectDetail', {
        title: 'Project Details',
        errMsg: 'No Project found!',
      });
    }

    if (userProject.images && userProject.images.length > 0) {
      userProject.images.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.render('projectDetail', {
      title: 'Project',
      projectDetail: userProject,
    });
  } catch (err) {
    res.status(500).render('error', {
      message: 'An error occurred while fetching this project.',
    });
  }
};

exports.projectUpdateGET = async (req, res) => {
  try {
    const project = await Project.findOne({
      userId: req.params.userId,
    }).exec();

    if (project === null) {
      const err = new Error('Project not found');
      err.status = 404;
      return next(err);
    }

    res.render('projectForm', {
      title: 'Update Project',
      formAction: `/users/${req.params.userId}/project/${project._id}`,
      project,
      images: project.images.length > 0 ? project.images : [],
    });
  } catch (err) {
    res.status(err.status || 500).render('error', {
      message: 'Error fetching project: ' + err.message,
    });
  }
};

exports.projectUpdatePOST = [
  upload.array('images', 10), // UPLOAD IMAGES
  // Name
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .trim()
    .escape(),

  // Description (optional)
  body('description').optional().trim().escape(),

  // Current Phase
  body('currentPhase')
    .notEmpty()
    .withMessage('Current Phase is required')
    .isInt({ min: 1, max: 4 })
    .withMessage('Current Phase must be between 1 and 4'),

  // Type
  body('type')
    .notEmpty()
    .withMessage('Project type is required')
    .isIn(['Residential', 'Commercial'])
    .withMessage('Invalid project type'),

  // Images (optional)
  body('images')
    .optional() // Allow the field to be empty
    .isArray() // Ensure it's an array
    .withMessage('Images must be provided as an array.')
    .custom((value) => {
      if (!value || !value.length) return; // Skip if empty

      for (const image of value) {
        if (typeof image !== 'string' || !image.trim()) {
          return Promise.reject('Invalid image URL in images array.');
        }
      }
      return true; // All URLs are valid
    }),

  updateProjectLogic,
];

async function updateProjectLogic(req, res, next) {
  try {
    const errors = validationResult(req);

    let existingImages = await Project.findOne({
      userId: req.params.userId,
    }).select('images');

    if (!existingImages) {
      existingImages = []; // Set to empty array if item not found
    } else {
      existingImages = existingImages.images; // Extract the actual image URLs
    }

    const uploadedImagesPromises = req.files.map(async (file) => {
      try {
        const result = await cloudinary.uploader.upload(file.path);
        return { url: result.secure_url };
      } catch (error) {
        console.error('Error uploading image:', error);
        errors.array().push({
          msg: 'Error uploading image(s). Please try again.',
        });
        return null; // Or handle errors differently
      }
    });

    const uploadedImages = await Promise.all(uploadedImagesPromises);

    const imagesToKeep = existingImages.filter(
      (image) =>
        !req.body.image ||
        !req.body.image.includes(image._id.toString()),
    );

    // Combine remaining existing and uploaded images
    const combinedImages = [...imagesToKeep, ...uploadedImages];

    const project = new Project({
      address: req.body.address,
      description: req.body.description ? req.body.description : '',
      currentPhase: req.body.currentPhase,
      userId: req.params.userId,
      type: req.body.type,
      images: combinedImages,
      _id: req.params.projectId,
    });

    if (!errors.isEmpty()) {
      res.render('projectForm', {
        title: 'Update Project',
        formAction: `/users/${req.params.userId}/project/${project._id}`,
        project,
        errors: errors.array(),
      });
    } else {
      const updatedProject = await Project.findByIdAndUpdate(
        req.params.projectId,
        project,
        {},
      );
      res.redirect(`/users/${project.userId}${updatedProject.url}`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).render('projectForm', {
      title: 'Update Project',
      formAction: `/users/${req.params.userId}/project/${project._id}`,
      errors: [{ msg: 'Error updating project' }],
    });
  }
}
