const express = require('express');
const router = express.Router();

const projectController = require('../controllers/projectController');

// Create Project
router.get(
  '/:userId/project/create',
  projectController.projectCreateGET,
);
router.post('/:userId/project', projectController.projectCreatePOST);

// Read Project
router.get(
  '/:userId/project/:projectId',
  projectController.projectDetailGET,
);

// Read User Project
router.get(
  '/:userId/user-project/:projectId',
  projectController.userProjectDetailGET,
);

// Update Project
router.get(
  '/:userId/project/:projectId/update',
  projectController.projectUpdateGET,
);
router.patch(
  '/:userId/project/:projectId',
  projectController.projectUpdatePOST,
);

module.exports = router;
