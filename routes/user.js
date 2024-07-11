const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

// Read list of users
router.get('/', userController.userListGET);

// Read user
router.get('/:userId', userController.userDetailGET);

// Update user
router.get('/:userId', userController.userUpdateGET);
router.patch('/:userId', userController.userUpdatePOST);

// Delete user
router.get('/:userId', userController.userDeleteGET);
router.delete('/:userId', userController.userDeletePOST);

module.exports = router;
