const express = require('express');
const router = express.Router();
const adminCheck = require('../utils/adminCheck.js');
const { upload } = require('../utils/cloudinary.js');

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

// Read Project List
router.get('/:userId/projects', projectController.projectListGET);

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

// Delete project
router.get(
  '/:userId/project/:projectId/delete',
  adminCheck.adminCheck,
  projectController.projectDeleteGET,
);
router.post(
  '/:userId/project/:projectId/delete',
  adminCheck.adminCheck,
  projectController.projectDeletePOST,
);

//IMAGES
// add GET
router.get(
  '/:userId/project/:projectId/images',
  adminCheck.adminCheck,
  projectController.addImagesGET,
);
// add POST
router.post(
  '/:userId/project/:projectId/images',
  adminCheck.adminCheck,
  upload.array('images'),
  projectController.addImagesPOST,
);
// delete POST
router.post(
  '/:userId/project/:projectId/image/:imageId/delete',
  adminCheck.adminCheck,
  projectController.deleteImage,
);

module.exports = router;
