const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

// Read list of users
router.get('/', userController.userList);

// Read user
router.get('/:userId', userController.userDetail);

// Update user
router.get('/:userId', userController.updateUserGET);
router.patch('/:userId', userController.updateUserPOST);

// Delete user
router.get('/:userId', userController.deleteUserGET);
router.delete('/:userId', userController.deleteUserPOST);

module.exports = router;
