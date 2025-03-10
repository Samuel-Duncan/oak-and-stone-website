const express = require('express');
const router = express.Router();

const Project = require('../models/project');

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    if (req.user) {
      // User is signed in
      const projectDetails = await Project.find({
        userId: req.user.id,
      }).lean();

      if (projectDetails.length > 0 && projectDetails.length === 1) {
        res.render('index', {
          title: 'Oak and Stone Client Portal',
          projectId: projectDetails[0]._id,
        });
      } else if (projectDetails.length > 1) {
        res.render('index', {
          title: 'Oak and Stone Client Portal',
          projectId: null,
          moreThanOneProject: true,
        });
      } else {
        res.render('index', {
          title: 'Oak and Stone Client Portal',
          message: 'Nothing to see here yet.',
        });
      }
    } else {
      // User is not signed in
      res.render('index', {
        title: 'Oak and Stone Client Portal',
        message: 'Please sign in to view your project details.',
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
