const User = require('../models/user.js');
const { sendEmail } = require('../utils/nodemailer.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * Read list of users.
 * @route GET /users
 * @returns {array} An array of users if they exist
 * @throws {Error} If no users are found or if there is a server error
 */
exports.userList = async (req, res) => {
  try {
    const allUsers = await User.find({}, { name: 1 }).sort({
      createdAt: -1,
    });

    if (allUsers.length === 0) {
      return res.json({ message: 'No users found!' });
    }

    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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
    });

    if (user === null) {
      return res.json({ message: 'No user found!' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new user.
 * @route POST /users/sign-up
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {object} A success message if the user is created successfully.
 * @throws {Error} If the email already exists or an error occurs while saving the user.
 */
exports.signUp = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(409)
        .json({ error: 'The entered Email already exists!' });
    }

    const user = new User({ name, email, password, phoneNumber });
    await user.save();

    res
      .status(201)
      .json({ message: 'User has been created successfully!' });

    sendEmail(
      email,
      'Welcome to Oak and Stone!',
      'Welcome to Oak and Stone Client Portal!',
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
