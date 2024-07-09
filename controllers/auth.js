const User = require('../models/user.js');
const { body, validationResult } = require('express-validator');
const passport = require('../utils/passport.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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
  res.render('signUpForm', { title: 'Sign Up' });
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

  // Sign Up Logic
  signUpLogic,
];

async function signUpLogic(req, res, next) {
  try {
    const errors = validationResult(req);

    const userExists = await User.findOne({ email });

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
    });

    if (!errors.isEmpty()) {
      res.render('signUpForm', {
        title: 'Sign Up',
        user,
        errors: errors.array(),
      });
    } else if (userExists) {
      // User already exists error handling
      res.render('signUpForm', {
        title: 'Sign Up',
        user,
        errors: [
          {
            msg: 'Email already in use. Please choose a different one.',
          },
        ],
      });
    } else {
      await user.save();
      sendEmail(
        user.email,
        'Welcome to Oak and Stone!',
        'Welcome to Oak and Stone Client Portal!',
      );
      res.redirect(`/users/${user._id}`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).render('signUpForm', {
      title: 'Sign Up',
      errors: [{ msg: 'Error creating user' }],
    });
  }
}

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
      res.render('signInForm', {
        title: 'Sign In',
        errorMessage: 'Invalid username or password', // Customize the message
      });
    } else {
      // Login successful - redirect to home
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.redirect('/');
      });
    }
  })(req, res, next);
};

/**
 * Authenticate a user.
 * @route POST /users/sign-in
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {object} An access token and user information if authentication is successful.
 * @throws {Error} If the email or password is incorrect, or an error occurs during authentication.
 */
exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ message: 'Username or Password Incorrect' });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: 'Username or Password Incorrect' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(202).json({
      accessToken: token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * Signs out current user.
 * @route DELETE /users/log-out
 * @param {string} userId - The ID of the user to update.
 * @returns {object} A success message and the updated user object.
 * @throws {Error} If the user is not found, an error occurs while updating them, or validation fails.
 */
exports.signOut = async (req, res, next) => {
  try {
    req.logout((err) => {
      // Call logout from Passport (if using sessions)
      if (err) {
        return next(err);
      }
      // Invalidate JWT token on client-side (example)
      res.cookie('jwt', '', { maxAge: 0, httpOnly: true }); // Clear the cookie
      res.status(200).json({ message: 'Logged Out' }); // Success response
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};
