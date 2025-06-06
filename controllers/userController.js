const User = require('../models/user.js');
const Project = require('../models/project.js');
const Update = require('../models/update.js');
const File = require('../models/file.js');
const { body, validationResult } = require('express-validator');

/**
 * Read list of users.
 * @route GET /users
 * @returns {array} An array of users if they exist
 * @throws {Error} If no users are found or if there is a server error
 */
exports.userListGET = async (req, res) => {
  try {
    const allUsers = await User.find({}, { name: 1 })
      .sort({
        name: 1,
      })
      .exec();

    res.render('userList', {
      title: 'Clients',
      userList: allUsers,
      errorMessage:
        allUsers.length === 0 ? 'No clients found!' : null,
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
exports.userDetailGET = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId, {
      name: 1,
      email: 1,
      additionalEmailOne: 1,
      additionalEmailTwo: 1,
      phoneNumber: 1,
    }).exec();

    const project = await Project.find(
      { userId: user._id },
      { _id: 1 },
    )
      .lean()
      .exec();

    const projectExists = project.length !== 0;
    const moreThanOneProject = project.length > 1;

    if (user === null) {
      res.render('userDetail', {
        title: 'Client Details',
        errMsg: 'No client found!',
      });
    }

    res.render('userDetail', {
      title: 'Client Details',
      user,
      projectExists,
      moreThanOneProject,
      projectId: project.length === 1 ? project[0]._id : null,
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
exports.userUpdateGET = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res
        .status(404)
        .render('error', { message: 'User not found' });
    }
    res.render('signUpForm', {
      title: 'Update Client',
      user: user,
      isUpdate: true,
      formAction: `/users/${user._id}/update`,
    });
  } catch (err) {
    res
      .status(500)
      .render('error', { message: 'Error fetching user data' });
  }
};

exports.userUpdatePOST = [
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

  // Phone number
  body('phoneNumber')
    .trim()
    .optional() // Allow empty phone number
    .isMobilePhone('en-US', { strict: true }) // Validate for US/Canada format (strict mode)
    .withMessage('Invalid phone number format')
    .escape(),

  userUpdateLogic,
];

async function userUpdateLogic(req, res, next) {
  try {
    const errors = validationResult(req);

    const existingUser = await User.findById(req.params.userId);
    if (!existingUser) {
      return res
        .status(404)
        .render('error', { message: 'User not found' });
    }

    const updatedUserData = {
      name: req.body.name,
      email: req.body.email,
      additionalEmailOne: req.body.additionalEmailOne || null,
      additionalEmailTwo: req.body.additionalEmailTwo || null,
      phoneNumber: req.body.phoneNumber,
    };

    if (!errors.isEmpty()) {
      return res.render('signUpForm', {
        title: 'Update User',
        user: { ...existingUser.toObject(), ...updatedUserData },
        errors: errors.array(),
        isUpdate: true,
        formAction: `/users/${req.params.userId}/update`,
      });
    }

    // Check if email is being changed and if it's already in use
    if (existingUser.email !== updatedUserData.email) {
      const userWithNewEmail = await User.findOne({
        email: updatedUserData.email,
      });
      if (userWithNewEmail) {
        return res.render('signUpForm', {
          title: 'Update User',
          user: { ...existingUser.toObject(), ...updatedUserData },
          errors: [
            {
              msg: 'Email already in use. Please choose a different one.',
            },
          ],
          isUpdate: true,
          formAction: `/users/${req.params.userId}/update`,
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      updatedUserData,
      { new: true, runValidators: true },
    );

    res.redirect(updatedUser.url);
  } catch (err) {
    console.error(err);
    res.status(500).render('signUpForm', {
      title: 'Update User',
      errors: [{ msg: 'Error updating user' }],
      isUpdate: true,
      formAction: `/users/${req.params.userId}/update`,
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
exports.userDeleteGET = async (req, res) => {
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

exports.userDeletePOST = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).render('userDelete', {
        message: 'User not found',
      });
    }

    // Find all projects associated with the user
    const projects = await Project.find({ userId: user._id });

    // If there are projects, delete them and their associated updates and files
    if (projects.length > 0) {
      const projectIds = projects.map((project) => project._id);

      // Delete all updates associated with the projects
      await Update.deleteMany({ projectId: { $in: projectIds } });

      // Delete all files associated with the projects
      await File.deleteMany({ projectId: { $in: projectIds } });

      // Delete all projects
      await Project.deleteMany({ userId: user._id });
    }

    // Finally, delete the user
    await User.findByIdAndDelete(req.params.userId);

    res.redirect('/users');
  } catch (err) {
    res.status(err.status || 500).render('userDelete', {
      message: 'Error deleting user: ' + err.message,
    });
  }
};
