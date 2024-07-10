const User = require('../models/user.js');
const { body, validationResult } = require('express-validator');

/**
 * Read list of users.
 * @route GET /users
 * @returns {array} An array of users if they exist
 * @throws {Error} If no users are found or if there is a server error
 */
exports.userList = async (req, res) => {
  try {
    const allUsers = await User.find({}, { name: 1 })
      .sort({
        createdAt: -1,
      })
      .exec();

    if (allUsers.length === 0) {
      res.render('userList', {
        title: 'User List',
        errorMessage: 'No clients found!',
      });
    }

    res.render('userList', {
      title: 'User List',
      userList: allUsers,
    });
  } catch (err) {
    res.status(500).render('error', {
      message: 'An error occurred while fetching clients.',
    });
  }
};

/**
 * Read a single user.
 * @route GET /users/:userId
 * @returns {object} An object of user info
 * @throws {Error} If no user is found or if there is a server error
 */
exports.userDetail = async (req, res) => {
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

/**
 * Update a user by their ID.
 * @route PATCH /users/:userId
 * @param {string} userId - The ID of the user to update.
 * @returns {object} A success message and the updated user object.
 * @throws {Error} If the user is not found, an error occurs while updating them, or validation fails.
 */
exports.updateUserGET = async (req, res) => {
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

exports.updateUserPOST = [
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

  updateUserLogic,
];

async function updateUserLogic(req, res, next) {
  try {
    const errors = validationResult(req);

    const userExists = await User.findOne({ email });

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

/**
 * Delete a user by their ID.
 * @route DELETE /users/:userId
 * @param {string} userId - The ID of the user to delete.
 * @returns {object} A success message and the deleted user object.
 * @throws {Error} If the user is not found or an error occurs while deleting them.
 */
exports.deleteUserGET = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).exec();

    if (user === null) {
      res.redirect('/users');
    }

    res.render('userDelete', {
      title: 'Delete Client',
      user,
    });
  } catch (err) {
    res.status(err.status || 500).render('error', {
      message: 'Error fetching client: ' + err.message,
    });
  }
};

exports.deleteUserPOST = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.body.userId);
    res.redirect('/users');
  } catch {
    res.status(err.status || 500).render('userDelete', {
      message: 'Error deleting client: ' + err.message,
    });
  }
};
