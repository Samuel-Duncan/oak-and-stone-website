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

  // Additional Email One
  body('additionalEmailOne')
    .trim()
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Invalid email format')
    .escape(), // Sanitize to lowercase

  // Additional Email Two
  body('additionalEmailTwo')
    .trim()
    .optional({ checkFalsy: true })
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
      additionalEmailOne: req.body.additionalEmailOne || null,
      additionalEmailTwo: req.body.additionalEmailTwo || null,
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

      const welcomeHtml = `
        <h1>Welcome to the Oak and Stone Client Portal, ${
          user.name.split(' ')[0]
        }!</h1>
        <p>We're excited to welcome you to our secure client portal. Now you can stay up to date with the progress of your project!</p>
        <h2>Login Credentials</h2>
        <p>You can access your account with the following credentials:</p>
        <p><strong>Username:</strong> ${user.email}</p>
        <p><strong>Password:</strong> ${req.body.password}</p>
        <p>As of now, there is nothing to see yet. Please look out for another email as soon as progress becomes available to view!</p>
        <p>Thank you for choosing Oak & Stone!</p>
      `;

      // Collect email addresses, including only non-null values
      const emailAddresses = [
        user.email,
        user.additionalEmailOne,
        user.additionalEmailTwo,
      ].filter((email) => email !== null);

      // Send the email to all provided addresses
      sendEmail(
        emailAddresses,
        'Oak and Stone Portal Login Info',
        welcomeHtml,
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
  const { email, password } = req.body; // Or however you get email/password
  // Temporarily store redirectTo if it exists, as req.logIn might regenerate the session
  const sessionRedirectTo = req.session.redirectTo;

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err); // Pass errors to next error handler
    }
    if (!user) {
      // Login failed - display error message
      // Preserve redirectTo in the session for the next attempt if it was there
      if (sessionRedirectTo) {
        req.session.redirectTo = sessionRedirectTo;
      }
      return res.render('signInForm', {
        title: 'Sign In',
        errorMessage: info.message || 'Invalid username or password', // Customize the message
      });
    } else {
      // Login successful
      req.logIn(user, async (loginErr) => {
        // Changed err to loginErr to avoid conflict
        if (loginErr) {
          // Changed err to loginErr
          return next(loginErr); // Changed err to loginErr
        }

        try {
          // Update lastLogin timestamp
          user.lastLogin = new Date();
          await user.save();
        } catch (error) {
          return next(error);
        }

        // Restore redirectTo from the temporary variable after login
        const finalRedirectTo = sessionRedirectTo || '/';
        // It's good practice to delete it from session if it was there,
        // though if sessionRedirectTo was populated, it means req.session.redirectTo
        // might have been cleared by req.logIn.
        // If sessionRedirectTo was originally from req.session.redirectTo, clear it.
        if (req.session.redirectTo) {
          delete req.session.redirectTo;
        }

        return res.redirect(finalRedirectTo);
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
    res.redirect('/auth/sign-in');
  });
};
