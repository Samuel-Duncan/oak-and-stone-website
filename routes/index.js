const express = require('express');
const router = express.Router();

const Project = require('../models/project');
require('dotenv').config();

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
          title: `${process.env.COMPANY_NAME} Client Portal`,
          companyName: process.env.COMPANY_NAME,
          projectId: projectDetails[0]._id,
        });
      } else if (projectDetails.length > 1) {
        res.render('index', {
          title: `${process.env.COMPANY_NAME} Client Portal`,
          companyName: process.env.COMPANY_NAME,
          projectId: null,
          moreThanOneProject: true,
        });
      } else {
        res.render('index', {
          title: `${process.env.COMPANY_NAME} Client Portal`,
          companyName: process.env.COMPANY_NAME,
          message:
            "There's nothing to see here yet. When your project becomes available to view, you'll be able to view it here.",
        });
      }
    } else {
      // User is not signed in
      res.render('index', {
        title: `${process.env.COMPANY_NAME} Client Portal`,
        companyName: process.env.COMPANY_NAME,
        message: 'Please sign in to view your project details.',
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
