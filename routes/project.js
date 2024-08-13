const express = require('express');
const router = express.Router();
const adminCheck = require('../utils/adminCheck.js');

const projectController = require('../controllers/projectController');

// Create Project
router.get(
  '/:userId/project/create',
  adminCheck.adminCheck,
  projectController.projectCreateGET,
);
router.post(
  '/:userId/project',
  adminCheck.adminCheck,
  projectController.projectCreatePOST,
);

// Read Project
router.get(
  '/:userId/project/:projectId',
  projectController.projectDetailGET,
);

// Update Project
router.get(
  '/:userId/project/:projectId/update',
  adminCheck.adminCheck,
  projectController.projectUpdateGET,
);
router.post(
  '/:userId/project/:projectId',
  adminCheck.adminCheck,
  projectController.projectUpdatePOST,
);

// Read current user project
router.get(
  '/:userId/user-project/:projectId',
  projectController.userProjectDetailGET,
);

module.exports = router;
