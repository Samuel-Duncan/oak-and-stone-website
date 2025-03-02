const {
  cloudinary,
  upload,
  processAndUploadImage,
  addTransformation,
} = require('../utils/cloudinary');
const File = require('../models/file');
const fs = require('fs');

exports.fileCreateGET = (req, res, next) => {
  res.render('fileForm', {
    title: 'Upload File',
    formAction: `/users/${req.params.userId}/project/${req.params.projectId}/file/create`,
  });
};

exports.fileCreatePOST = [
  upload.single('file'),

  async (req, res) => {
    try {
      if (!req.file) {
        return res.render('error', { message: 'No file uploaded' });
      }

      let fileType;
      let result;

      if (req.file.mimetype.startsWith('image/')) {
        // Image processing with Sharp
        fileType = 'image';
        result = await processAndUploadImage(req.file.path);

        if (!result) {
          return res.render('error', {
            message: 'Error processing image',
          });
        }
      } else if (req.file.mimetype === 'application/pdf') {
        // PDF file upload
        fileType = 'pdf';
        result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'Progress',
          resource_type: 'auto',
        });
      } else if (
        req.file.mimetype === 'application/msword' ||
        req.file.mimetype ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        // Word document upload
        fileType = 'document';
        result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'Progress',
          resource_type: 'auto',
        });
      } else {
        return res.render('error', {
          message: 'Unsupported file type',
        });
      }

      // Save the file to the database
      const newFile = new File({
        filename: req.file.originalname,
        cloudinaryUrl: addTransformation(result.secure_url, fileType), // Apply transformation to Cloudinary URL
        cloudinaryPublicId: result.public_id,
        fileType: fileType,
        projectId: req.params.projectId,
      });

      await newFile.save();
      // Clean up the temporary file after successful upload
      fs.unlinkSync(req.file.path);

      res.redirect(
        `/users/${req.params.userId}/project/${req.params.projectId}`,
      );
    } catch (error) {
      console.error('File upload error:', error);
      res.render('error', {
        message: 'Error uploading file',
        error: error.message,
      });
    }
  },
];

exports.fileDelete = async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(file.cloudinaryPublicId);

    // Delete from database
    await File.findByIdAndDelete(req.params.fileId);

    res.redirect(
      `/users/${req.params.userId}/project/${file.projectId}`,
    );
  } catch (error) {
    console.error('File deletion error:', error);
    res
      .status(500)
      .json({ message: 'Error deleting file', error: error.message });
  }
};
