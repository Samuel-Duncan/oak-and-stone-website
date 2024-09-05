const {
  cloudinary,
  upload,
  addTransformation,
} = require('../utils/cloudinary');
const File = require('../models/file');

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
      if (req.file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (req.file.mimetype === 'application/pdf') {
        fileType = 'pdf';
      } else if (
        req.file.mimetype === 'application/msword' ||
        req.file.mimetype ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        fileType = 'document';
      } else {
        return res.render('error', {
          message: 'Unsupported file type',
        });
      }

      const newFile = new File({
        filename: req.file.originalname,
        cloudinaryUrl: req.file.path,
        cloudinaryPublicId: req.file.filename,
        fileType: fileType,
        projectId: req.params.projectId,
      });

      await newFile.save();

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
