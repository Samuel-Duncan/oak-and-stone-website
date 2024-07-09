const User = require('../models/user.js');

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
exports.updateUser = async (req, res) => {
  try {
    const updateUser = await User.findByIdAndUpdate(
      { _id: req.params.userId },
      req.body,
      { new: true },
    );
    res
      .status(200)
      .json({ msg: 'User updated successfully', updateUser });
  } catch (err) {
    res.status(500).json({ err: `Something went wrong: ${err}` });
  }
};

/**
 * Delete a user by their ID.
 * @route DELETE /users/:userId
 * @param {string} userId - The ID of the user to delete.
 * @returns {object} A success message and the deleted user object.
 * @throws {Error} If the user is not found or an error occurs while deleting them.
 */
exports.deleteUser = async (req, res) => {
  try {
    const deleteUser = await User.findByIdAndDelete(
      req.params.userId,
    );
    res
      .status(200)
      .json({ msg: 'User deleted successfully', deleteUser });
  } catch (err) {
    res.status(500).json({ err: `Something went wrong: ${err}` });
  }
};
