const Project = require('../models/project.js');
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
      await project.save();
      res.redirect(`/users/${project.userId}${project.url}`);

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
    const [project, projectCount, update, user, file] =
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
      ]);

    if (!project) {
      return res.render('projectDetail', {
        title: 'Project Details',
        errMsg: 'No Project found!',
      });
    }

    if (project.images && project.images.length > 0) {
      project.images.sort((a, b) => b.createdAt - a.createdAt);
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
    const [userProject, projectCount] = await Promise.all([
      Project.findOne({
        _id: req.params.projectId,
        userId: req.params.userId,
      })
        .populate('update')
        .lean(),
      Project.countDocuments({ userId: req.params.userId }),
    ]);

    if (!userProject) {
      return res.render('projectDetail', {
        title: 'Project Details',
        errMsg: 'No Project found!',
      });
    }

    if (userProject.images && userProject.images.length > 0) {
      userProject.images.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.render('projectDetail', {
      title: 'Project',
      projectDetail: userProject,
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
    const project = await Project.findById(
      req.params.projectId,
    ).exec();

    if (project === null) {
      const err = new Error('Project not found');
      err.status = 404;
      return next(err);
    }

    if (project.images && project.images.length > 0) {
      project.images.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.render('projectForm', {
      title: 'Update Project',
      formAction: `/users/${req.params.userId}/project/${project._id}`,
      project,
      images: project.images.length > 0 ? project.images : [],
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
      return res.render('projectForm', {
        title: 'Update Project',
        formAction: `/users/${req.params.userId}/project/${req.params.projectId}`,
        project: {
          ...existingProject.toObject(),
          ...updatedProjectData,
        },
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
    await Project.findByIdAndDelete(req.params.projectId);
    res.redirect(`/users/${req.params.userId}`);
  } catch {
    res.status(err.status || 500).render('projectDelete', {
      message: 'Error deleting project: ' + err.message,
    });
  }
};

exports.addImagesGET = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res
        .status(404)
        .render('error', { message: 'Project not found' });
    }

    res.render('imageForm', {
      title: 'Upload Images',
      formAction: `/users/${req.params.userId}/project/${req.params.projectId}/images`,
      project: project,
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
      return res.render('imageForm', {
        title: 'Upload Images',
        formAction: `/users/${req.params.userId}/project/${req.params.projectId}/images`,
        project: project,
        errors: errors.array(),
      });
    }

    // Handle existing images
    let imagesToKeep = project.images;
    if (req.body.imagesToRemove) {
      imagesToKeep = project.images.filter(
        (image) =>
          !req.body.imagesToRemove.includes(image._id.toString()),
      );
    }

    // Process new images with Sharp
    const compressedImages = await Promise.all(
      (req.files || []).map(async (file) => {
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

        return {
          url: addTransformation(result.secure_url, 'image'),
          publicId: result.public_id,
        };
      }),
    );

    // Combine images
    project.images = [...imagesToKeep, ...compressedImages];

    await project.save();

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

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the index of the image to remove
    const imageIndex = project.images.findIndex(
      (img) => img._id.toString() === imageId,
    );

    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Remove the image from the array
    project.images.splice(imageIndex, 1);

    // Save the updated project
    await project.save();

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
