const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const adminCheck = require('../utils/adminCheck');

// Create File
router.get(
  '/:userId/project/:projectId/file/create',
  adminCheck.adminCheck,
  fileController.fileCreateGET,
);

router.post(
  '/:userId/project/:projectId/file/create',
  adminCheck.adminCheck,
  fileController.fileCreatePOST,
);

// Delete File
router.post(
  '/:userId/project/:projectId/file/:fileId/delete',
  adminCheck.adminCheck,
  fileController.fileDelete,
);

module.exports = router;
