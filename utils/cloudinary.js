const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Progress',
    allowedFormats: ['jpeg', 'png', 'jpg', 'pdf', 'doc', 'docx'],
    resource_type: 'auto',
  },
});

// Increase the file size limit (in bytes)
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function addTransformation(url, fileType) {
  // ... (keep this function as is)
}

// Create a multer instance with file size limit
const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.size > MAX_FILE_SIZE) {
      cb(
        new Error(
          `File size limit exceeded. Maximum allowed size is ${
            MAX_FILE_SIZE / (1024 * 1024)
          }MB`,
        ),
        false,
      );
    } else {
      cb(null, true);
    }
  },
});

module.exports = {
  cloudinary: cloudinary,
  upload: upload,
  addTransformation,
};
