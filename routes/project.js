const express = require('express');
const router = express.Router();
const adminCheck = require('../utils/adminCheck.js');
const authCheck = require('../utils/authCheck.js'); // Assuming you have this middleware

const projectController = require('../controllers/projectController');

// Apply adminCheck to all routes in this router
router.use(adminCheck);

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

// Update Project
router.get(
  '/:userId/project/:projectId/update',
  projectController.projectUpdateGET,
);
router.post(
  '/:userId/project/:projectId',
  projectController.projectUpdatePOST,
);

// Override adminCheck for this specific route
router.get(
  '/:userId/user-project/:projectId',
  router.use((req, res, next) => {
    // Remove adminCheck for this route
    req.adminCheckSkipped = true;
    next();
  }),
  authCheck,
  projectController.userProjectDetailGET,
);

module.exports = router;
