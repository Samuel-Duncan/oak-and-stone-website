const express = require('express');
const router = express.Router();
const adminCheck = require('../utils/adminCheck');

const userController = require('../controllers/userController');

// Read list of users
router.get('/', adminCheck.adminCheck, userController.userListGET);

// Read user
router.get(
  '/:userId',
  adminCheck.adminCheck,
  userController.userDetailGET,
);

// Update user
router.get(
  '/:userId/update',
  adminCheck.adminCheck,
  userController.userUpdateGET,
);
router.post('/:userId/update', userController.userUpdatePOST);

// Delete user
router.get(
  '/:userId/delete',
  adminCheck.adminCheck,
  userController.userDeleteGET,
);
router.post('/:userId/delete', userController.userDeletePOST);

module.exports = router;
