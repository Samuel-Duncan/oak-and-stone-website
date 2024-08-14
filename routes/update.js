const express = require('express');
const router = express.Router();
const updateController = require('../controllers/updateController');
const adminCheck = require('../utils/adminCheck');

// GET list of updates
router.get(
  '/:userId/project/:projectId/weekly-updates',
  updateController.updateListGET,
);

// Create Update
router.get(
  '/:userId/project/:projectId/weekly-update/create',
  adminCheck.adminCheck,
  updateController.updateCreateGET,
);

router.post(
  '/:userId/project/:projectId/weekly-update',
  adminCheck.adminCheck,
  updateController.updateCreatePOST,
);

// GET update detail
router.get(
  '/:userId/project/:projectId/weekly-update/:updateId',
  updateController.updateDetailGET,
);

// Edit Update
router.get(
  '/:userId/project/:projectId/weekly-update/:updateId/edit',
  adminCheck.adminCheck,
  updateController.updateUpdateGET,
);

router.post(
  '/:userId/project/:projectId/weekly-update/:updateId',
  adminCheck.adminCheck,
  updateController.updateUpdatePOST,
);
module.exports = router;

// Delete update
router.get(
  '/:userId/project/:projectId/weekly-update/:updateId/delete',
  adminCheck.adminCheck,
  updateController.updateDeleteGET,
);
router.post(
  '/:userId/project/:projectId/weekly-update/:updateId/delete',
  adminCheck.adminCheck,
  updateController.updateDeletePOST,
);
