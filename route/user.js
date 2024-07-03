const express = require('express');
const router = express.Router();

const userController = require('../controller/user');

// Update user
router.patch('/:userId', userController.updateUser);

// Delete user
router.delete('/:userId', userController.deleteUser);

module.exports = router;
