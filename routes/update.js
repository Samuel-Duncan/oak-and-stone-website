const express = require('express');
const router = express.Router();
const updateController = require('../controllers/updateController');
const adminCheck = require('../utils/adminCheck');

// Create Update
router.get('/:userId/project/:projectId/update/create');

router.post(
  '/:userId/project/:projectId/update',
  updateController.updateCreatePOST,
);

// Edit Update
router.get('/:userId/project/:projectId/update/:updateId/edit');

router.post(':/userId/project/:projectId/update/:updateId');
module.exports = router;
