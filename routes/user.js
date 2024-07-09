const express = require('express');
const router = express.Router();

const userController = require('../controllers/user');

// Read list of users
router.get('/', userController.userList);

// Read user
router.get('/:userId', userController.userDetail);

// Update user
router.patch('/:userId', userController.updateUser);

// Delete user
router.delete('/:userId', userController.deleteUser);

module.exports = router;
