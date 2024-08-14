const express = require('express');
const router = express.Router();

const Project = require('../models/project');

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    if (req.user) {
      // User is signed in
      const projectDetail = await Project.findOne({
        userId: req.user.id,
      }).lean();

      if (projectDetail) {
        res.render('index', {
          title: 'Oak and Stone Client Portal',
          projectId: projectDetail._id,
        });
      } else {
        res.render('index', {
          title: 'Oak and Stone Client Portal',
          message: 'No project found for this user.',
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
