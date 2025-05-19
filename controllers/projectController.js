const Project = require('../models/project.js');
const Image = require('../models/image.js'); // Import the new Image model
const User = require('../models/user.js');
const Update = require('../models/update.js');
const File = require('../models/file.js');
const { body, validationResult } = require('express-validator');
const {
  cloudinary,
  upload,
  addTransformation,
} = require('../utils/cloudinary.js');
const { sendEmail } = require('../utils/nodemailer.js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
require('dotenv').config();

exports.projectCreateGET = (req, res, next) => {
  res.render('projectForm', {
    title: 'Create Project',
    formAction: `/users/${req.params.userId}/project`,
  });
};

exports.projectCreatePOST = [
  upload.array('images', 20), // UPLOAD IMAGES
  // Address
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .trim()
    .escape(),

  // Description (optional)
  body('description').optional().trim().escape(),

  // Phase Name
  body('phaseName')
    .notEmpty()
    .withMessage('Phase Name is required')
    .trim(),

  // Current Phase
  body('currentPhase')
    .notEmpty()
    .withMessage('Current Phase is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Current Phase must be between 1 and 100'),

  // Type
  body('type')
    .notEmpty()
    .withMessage('Project type is required')
    .isIn(['Residential', 'Commercial'])
    .withMessage('Invalid project type'),

  // Images (optional)
  body('images')
    .optional() // Allow the field to be empty
    .isArray() // Ensure it's an array
    .withMessage('Images must be provided as an array.')
    .isLength({ max: 20 })
    .withMessage('You can upload a maximum of 20 images.')
    .custom((value) => {
      if (!value || !value.length) return; // Skip if empty

      for (const image of value) {
        if (typeof image !== 'string' || !image.trim()) {
          return Promise.reject('Invalid image URL in images array.');
        }
      }
      return true; // All URLs are valid
    }),

  // Project Create Logic
  projectCreateLogic,
];

async function projectCreateLogic(req, res, next) {
  try {
    const errors = validationResult(req);

    const user = await User.findOne(
      { _id: req.params.userId },
      'name email',
    );

    const project = new Project({
      address: req.body.address,
      description: req.body.description ? req.body.description : '',
      phaseName: req.body.phaseName,
      currentPhase: req.body.currentPhase,
      userId: req.params.userId,
      type: req.body.type,
    });

    if (!errors.isEmpty()) {
      res.render('projectForm', {
        title: 'Create Project',
        project,
        formAction: `/users/${req.params.userId}/project`,
        errors: errors.array(),
      });
    } else {
      // First save the project to get an ID
      const savedProject = await project.save();

      // Process and upload images if any
      if (req.files && req.files.length > 0) {
        await processAndSaveImages(req.files, savedProject._id);
      }

      res.redirect(
        `/users/${savedProject.userId}${savedProject.url}`,
      );

      // Email sending logic remains the same...
    }
  } catch (err) {
    console.error(err);
    res.status(500).render('projectForm', {
      title: 'Projects',
      formAction: `/users/${req.params.userId}/project`,
      errors: [{ msg: 'Error creating project' }],
    });
  }
}

// Helper function to process and save images
async function processAndSaveImages(files, projectId) {
  // Process new images with Sharp
  const compressedImages = await Promise.all(
    (files || []).map(async (file) => {
      const compressedPath = path.join(
        'uploads',
        `compressed-${file.filename}.jpg`,
      );

      await sharp(file.path)
        .resize({ width: 1920, height: 1080, fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(compressedPath);

      // Upload the compressed image to Cloudinary
      const result = await cloudinary.uploader.upload(
        compressedPath,
        {
          folder: 'Progress',
          resource_type: 'image',
        },
      );

      // Clean up local temp files
      fs.unlinkSync(file.path);
      fs.unlinkSync(compressedPath);

      // Create and save a new Image document
      const image = new Image({
        url: addTransformation(result.secure_url, 'image'),
        projectId: projectId,
      });

      return image.save();
    }),
  );

  return compressedImages;
}

exports.projectListGET = async (req, res) => {
  try {
    const allProjects = await Project.find({
      userId: req.params.userId,
    })
      .sort({
        createdAt: 1,
      })
      .exec();

    if (allProjects.length === 0) {
      res.render('projectList', {
        title: 'Projects',
        errorMessage: 'No projects found!',
      });
    }

    res.render('projectList', {
      title: 'Projects',
      projectList: allProjects,
      userId: req.params.userId,
    });
  } catch (err) {
    res.status(500).render('error', {
      message: 'An error occurred while fetching projects.',
    });
  }
};

exports.projectDetailGET = async (req, res) => {
  try {
    const [project, projectCount, update, user, file, images] =
      await Promise.all([
        Project.findById(req.params.projectId).exec(),
        Project.countDocuments({ userId: req.user._id }).exec(),
        Update.findOne({ projectId: req.params.projectId })
          .sort({ createdAt: -1 })
          .exec(),
        User.findById(req.params.userId)
          .select('name lastLogin')
          .lean()
          .exec(), // Fetch name and lastLogin
        File.find({ projectId: req.params.projectId })
          .sort({ createdAt: -1 })
          .exec(),
        // Get images associated with this project
        Image.find({ projectId: req.params.projectId })
          .sort({ createdAt: -1 })
          .exec(),
      ]);

    if (!project) {
      return res.render('projectDetail', {
        title: 'Project Details',
        errMsg: 'No Project found!',
      });
    }

    // Process the update description if it exists
    const processedUpdate = update
      ? {
          ...update.toObject(),
          description: update.description
            ? update.description
                .split(/\r?\n/)
                .map((line) => line.trim())
            : [],
        }
      : null;

    res.render('projectDetail', {
      title: 'Project',
      projectDetail: project,
      images: images, // Pass the images separately
      update: processedUpdate,
      moreThanOneProject: projectCount > 1,
      userName: user ? user.name : 'Unknown User',
      lastLogin: user ? user.lastLogin : null, // Send lastLogin to Pug
      files: file ? file : null,
    });
  } catch (err) {
    res.status(500).render('error', {
      message: 'An error occurred while fetching this project.',
    });
  }
};

exports.userProjectDetailGET = async (req, res, next) => {
  try {
    const [userProject, projectCount, images] = await Promise.all([
      Project.findOne({
        _id: req.params.projectId,
        userId: req.params.userId,
      })
        .populate('update')
        .lean(),
      Project.countDocuments({ userId: req.params.userId }),
      // Get images associated with this project
      Image.find({ projectId: req.params.projectId })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!userProject) {
      return res.render('projectDetail', {
        title: 'Project Details',
        errMsg: 'No Project found!',
      });
    }

    res.render('projectDetail', {
      title: 'Project',
      projectDetail: userProject,
      images: images, // Pass the images separately
      moreThanOneProject: projectCount > 1,
    });
  } catch (err) {
    res.status(500).render('error', {
      message: 'An error occurred while fetching this project.',
    });
  }
};

exports.projectUpdateGET = async (req, res) => {
  try {
    const [project, images] = await Promise.all([
      Project.findById(req.params.projectId).exec(),
      Image.find({ projectId: req.params.projectId })
        .sort({ createdAt: -1 })
        .exec(),
    ]);

    if (project === null) {
      const err = new Error('Project not found');
      err.status = 404;
      return next(err);
    }

    res.render('projectForm', {
      title: 'Update Project',
      formAction: `/users/${req.params.userId}/project/${project._id}`,
      project,
      images: images || [],
    });
  } catch (err) {
    res.status(err.status || 500).render('error', {
      message: 'Error fetching project: ' + err.message,
    });
  }
};

exports.projectUpdatePOST = [
  upload.array('images', 20), // UPLOAD IMAGES
  // Name
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .trim()
    .escape(),

  // Description (optional)
  body('description').optional().trim().escape(),

  // Phase Name
  body('phaseName')
    .notEmpty()
    .withMessage('Phase Name is required')
    .trim(),

  // Current Phase
  body('currentPhase')
    .notEmpty()
    .withMessage('Current Phase is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Current Phase must be between 1 and 100'),

  // Type
  body('type')
    .notEmpty()
    .withMessage('Project type is required')
    .isIn(['Residential', 'Commercial'])
    .withMessage('Invalid project type'),

  // Images (optional)
  body('images')
    .optional() // Allow the field to be empty
    .isArray() // Ensure it's an array
    .withMessage('Images must be provided as an array.')
    .custom((value) => {
      if (!value || !value.length) return; // Skip if empty

      for (const image of value) {
        if (typeof image !== 'string' || !image.trim()) {
          return Promise.reject('Invalid image URL in images array.');
        }
      }
      return true; // All URLs are valid
    }),

  updateProjectLogic,
];

async function updateProjectLogic(req, res, next) {
  try {
    const errors = validationResult(req);

    // Fetch existing project
    let existingProject = await Project.findById(
      req.params.projectId,
    );

    if (!existingProject) {
      return res
        .status(404)
        .render('error', { message: 'Project not found' });
    }

    // Prepare updated project data
    const updatedProjectData = {
      address: req.body.address,
      description: req.body.description || '',
      phaseName: req.body.phaseName,
      currentPhase: req.body.currentPhase,
      userId: req.params.userId, // Ensure we keep the userId
      type: req.body.type,
    };

    if (!errors.isEmpty()) {
      // Fetch images for this project to pass to the view
      const images = await Image.find({
        projectId: req.params.projectId,
      })
        .sort({ createdAt: -1 })
        .exec();

      return res.render('projectForm', {
        title: 'Update Project',
        formAction: `/users/${req.params.userId}/project/${req.params.projectId}`,
        project: {
          ...existingProject.toObject(),
          ...updatedProjectData,
        },
        images: images,
        errors: errors.array(),
      });
    }

    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.projectId,
      updatedProjectData,
      { new: true, runValidators: true },
    );

    if (!updatedProject) {
      return res.status(404).render('error', {
        message: 'Project not found during update',
      });
    }

    // Process and upload new images if any
    if (req.files && req.files.length > 0) {
      await processAndSaveImages(req.files, updatedProject._id);
    }

    res.redirect(
      `/users/${updatedProject.userId}${updatedProject.url}`,
    );
  } catch (err) {
    console.error(err);
    res.status(500).render('projectForm', {
      title: 'Update Project',
      formAction: `/users/${req.params.userId}/project/${req.params.projectId}`,
      project: req.body, // To preserve form data in case of error
      errors: [{ msg: 'Error updating project: ' + err.message }],
    });
  }
}

exports.projectDeleteGET = async (req, res) => {
  try {
    const project = await Project.findById(
      req.params.projectId,
    ).exec();

    if (project === null) {
      res.redirect(`/users/${req.params.userId}`);
    }

    res.render('projectDelete', {
      title: 'Delete Project',
      project,
      userId: req.params.userId,
      projectId: req.params.projectId,
    });
  } catch (err) {
    res.status(err.status || 500).render('error', {
      message: 'Error fetching project: ' + err.message,
    });
  }
};

exports.projectDeletePOST = async (req, res) => {
  try {
    // Delete all images associated with this project
    await Image.deleteMany({ projectId: req.params.projectId });

    // Then delete the project
    await Project.findByIdAndDelete(req.params.projectId);

    res.redirect(`/users/${req.params.userId}`);
  } catch (err) {
    res.status(err.status || 500).render('projectDelete', {
      message: 'Error deleting project: ' + err.message,
    });
  }
};

exports.addImagesGET = async (req, res) => {
  try {
    const [project, images] = await Promise.all([
      Project.findById(req.params.projectId),
      Image.find({ projectId: req.params.projectId })
        .sort({ createdAt: -1 })
        .exec(),
    ]);

    if (!project) {
      return res
        .status(404)
        .render('error', { message: 'Project not found' });
    }

    res.render('imageForm', {
      title: 'Upload Images',
      formAction: `/users/${req.params.userId}/project/${req.params.projectId}/images`,
      project: project,
      images: images,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      message: 'Error loading image management form: ' + err.message,
    });
  }
};

exports.addImagesPOST = async (req, res) => {
  try {
    const errors = validationResult(req);
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res
        .status(404)
        .render('error', { message: 'Project not found' });
    }

    if (!errors.isEmpty()) {
      const images = await Image.find({
        projectId: req.params.projectId,
      })
        .sort({ createdAt: -1 })
        .exec();

      return res.render('imageForm', {
        title: 'Upload Images',
        formAction: `/users/${req.params.userId}/project/${req.params.projectId}/images`,
        project: project,
        images: images,
        errors: errors.array(),
      });
    }

    // Handle image deletion if requested
    if (
      req.body.imagesToRemove &&
      req.body.imagesToRemove.length > 0
    ) {
      await Image.deleteMany({
        _id: { $in: req.body.imagesToRemove },
        projectId: req.params.projectId,
      });
    }

    // Process and upload new images if any
    if (req.files && req.files.length > 0) {
      await processAndSaveImages(req.files, project._id);
    }

    res.redirect(
      `/users/${req.params.userId}/project/${req.params.projectId}`,
    );
  } catch (err) {
    console.error(err);
    res.status(500).render('imageForm', {
      title: 'Manage Images',
      formAction: `/users/${req.params.userId}/project/${req.params.projectId}/images`,
      project: req.body,
      error: 'Error managing images: ' + err.message,
    });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { projectId, imageId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete the image directly from the Image collection
    const result = await Image.findOneAndDelete({
      _id: imageId,
      projectId: projectId,
    });

    if (!result) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Send a success response
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      message: 'An error occurred while deleting the image',
      error: error.message,
    });
  }
};
