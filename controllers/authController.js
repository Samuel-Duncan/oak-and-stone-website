const User = require('../models/user.js');
const Project = require('../models/project.js');
const { body, validationResult } = require('express-validator');
const passport = require('../utils/passport');
const { sendEmail } = require('../utils/nodemailer.js');

/**
 * Create a new user.
 * @route POST /users/sign-up
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {object} A success message if the user is created successfully.
 * @throws {Error} If the email already exists or an error occurs while saving the user.
 */

exports.signUpGET = (req, res, next) => {
  res.render('signUpForm', { title: 'Create Client' });
};

exports.signUpPOST = [
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
    .escape(),

  // Sign Up Logic
  signUpLogic,
];

async function signUpLogic(req, res, next) {
  try {
    const errors = validationResult(req);

    const userExists = await User.findOne({ email: req.body.email });

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
    });

    if (!errors.isEmpty()) {
      res.render('signUpForm', {
        title: 'Create User',
        user,
        errors: errors.array(),
        isUpdate: false,
        formAction: '/auth/sign-up',
      });
    } else if (userExists) {
      // User already exists error handling
      res.render('signUpForm', {
        title: 'Create User',
        user,
        errors: [
          {
            msg: 'Email already in use. Please choose a different one.',
          },
        ],
        isUpdate: false,
        formAction: '/auth/sign-up',
      });
    } else {
      await user.save();
      res.redirect('/users/');
      sendEmail(
        user.email,
        'Welcome to Oak and Stone!',
        'Welcome to Oak and Stone Client Portal!',
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).render('signUpForm', {
      title: 'Create User',
      errors: [{ msg: 'Error creating user' }],
      isUpdate: false,
      formAction: '/auth/sign-up',
    });
  }
}

/**
 * Authenticate a user.
 * @route POST /users/sign-in
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {object} An access token and user information if authentication is successful.
 * @throws {Error} If the email or password is incorrect, or an error occurs during authentication.
 */

exports.signInGET = (req, res, next) => {
  res.render('signInForm', { title: 'Sign In' });
};

exports.signInPOST = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err); // Pass errors to next error handler
    }
    if (!user) {
      // Login failed - display error message
      return res.render('signInForm', {
        title: 'Sign In',
        errorMessage: info.message || 'Invalid username or password', // Customize the message
      });
    } else {
      // Login successful - redirect to home
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.redirect(`/auth/sign-in-success`); // Redirect instead of render
      });
    }
  })(req, res, next);
};

/**
 * Signs out current user.
 * @route DELETE /users/log-out
 * @param {string} userId - The ID of the user to update.
 * @returns {object} A success message and the updated user object.
 * @throws {Error} If the user is not found, an error occurs while updating them, or validation fails.
 */

exports.signOut = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
};

exports.signInSuccess = async (req, res) => {
  try {
    if (req.user.isAdmin) {
      return res.redirect('/users/');
    }

    // Find the most recent project for the user
    const projectDetail = await Project.findOne({
      userId: req.user.id,
    }).lean();

    // Render project details template if found
    if (projectDetail) {
      return res.render('signInSuccess', {
        projectId: projectDetail._id,
      });
    } else {
      // No project found, render the sign-in success template
      return res.render('signInSuccess');
    }
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.render('error', { message: 'Error fetching project' }); // Render error page
  }
};
