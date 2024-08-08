const express = require('express');
const router = express.Router();
const updateController = require('../controllers/updateController');
const adminCheck = require('../utils/adminCheck');

// Create Update
router.get(
  '/:userId/project/:projectId/update/create',
  updateController.updateCreateGET,
);

router.post(
  '/:userId/project/:projectId/update',
  updateController.updateCreatePOST,
);

// Edit Update
router.get(
  '/:userId/project/:projectId/update/:updateId/edit',
  updateController.updateUpdateGET,
);

router.post(
  ':/userId/project/:projectId/update/:updateId',
  updateController.updateUpdatePOST,
);
module.exports = router;
