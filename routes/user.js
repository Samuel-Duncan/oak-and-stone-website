const express = require('express');
const router = express.Router();
const adminCheck = require('../utils/adminCheck');

const userController = require('../controllers/userController');

// Apply adminCheck to all routes in this router
router.use(adminCheck);

// Read list of users
router.get('/', userController.userListGET);

// Read user
router.get('/:userId', userController.userDetailGET);

// Update user
router.get('/:userId/update', userController.userUpdateGET);
router.post('/:userId/update', userController.userUpdatePOST);

// Delete user
router.get('/:userId/delete', userController.userDeleteGET);
router.post('/:userId/delete', userController.userDeletePOST);

module.exports = router;
