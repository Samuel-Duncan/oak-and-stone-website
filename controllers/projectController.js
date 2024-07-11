const Project = require('../models/project.js');
const User = require('../models/user.js');
const { body, validationResult } = require('express-validator');
const { cloudinary, upload } = require('../utils/cloudinary.js');
const { sendEmail } = require('../utils/nodemailer.js');

exports.projectCreateGET = (req, res, next) => {
  res.render('projectForm', { title: 'Create Project' });
};

exports.projectCreatePOST = [
  upload.array('images', 20), // UPLOAD IMAGES
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

    const uploadedImages = [];

    if (req.files) {
      // eslint-disable-next-line no-restricted-syntax
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path);
          uploadedImages.push({ url: result.secure_url });
        } catch (error) {
          console.error('Error uploading image:', error);
          errors.array().push({
            msg: 'Error uploading image(s). Please try again.',
          });
        }
      }
    }

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
        errors: errors.array(),
      });
    } else {
      await project.save();
      sendEmail(
        userEmail,
        'A new project has been created for you!',
        'Click the link below to keep track of the progress!',
      );
      res.redirect(req.params.userId);
    }
  } catch (err) {
    console.error(err);
    res.status(500).render('projectForm', {
      title: 'Create Project',
      errors: [{ msg: 'Error creating project' }],
    });
  }
}

exports.projectDetailGET = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId, {
      name: 1,
      email: 1,
      phoneNumber: 1,
    }).exec();

    if (user === null) {
      res.render('userDetail', {
        title: 'Client Details',
        errMsg: 'No client found!',
      });
    }

    res.render('userDetail', {
      title: 'Client Details',
      clientDetail: user,
    });
  } catch (err) {
    res.status(500).render('error', {
      message: 'An error occurred while fetching this client.',
    });
  }
};

exports.projectUpdateGET = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).exec();

    if (user === null) {
      const err = new Error('Client not found');
      err.status = 404;
      return next(err);
    }

    res.render('signUpForm', {
      title: 'Update User',
      user,
    });
  } catch (err) {
    res.status(err.status || 500).render('error', {
      message: 'Error fetching client: ' + err.message,
    });
  }
};

exports.projectUpdatePOST = [
  // Name
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .escape(), // Sanitize to prevent XSS attacks

  // Email
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .escape(), // Sanitize to lowercase

  // Password
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .escape(),

  // Phone number
  body('phoneNumber')
    .optional() // Allow empty phone number
    .isMobilePhone('en-US', { strict: true }) // Validate for US/Canada format (strict mode)
    .withMessage('Invalid phone number format')
    .escape(),

  updateProjectLogic,
];

async function updateProjectLogic(req, res, next) {
  try {
    const errors = validationResult(req);

    const userExists = await User.findOne({ email: req.body.email });

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
      _id: req.params.userId,
    });

    if (!errors.isEmpty()) {
      res.render('signUpForm', {
        title: 'Update User',
        user,
        errors: errors.array(),
      });
    } else if (userExists) {
      // User already exists error handling
      res.render('signUpForm', {
        title: 'Update User',
        user,
        errors: [
          {
            msg: 'Email already in use. Please choose a different one.',
          },
        ],
      });
    } else {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.userId,
        user,
        {},
      );
      res.redirect(updatedUser.url);
    }
  } catch (err) {
    console.error(err);
    res.status(500).render('signUpForm', {
      title: 'Update User',
      errors: [{ msg: 'Error updating user' }],
    });
  }
}
