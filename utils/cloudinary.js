const cloudinary = require('cloudinary');
const multer = require('multer');
const CloudinaryStorage =
  require('multer-storage-cloudinary').CloudinaryStorage;

require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'Progress',
    allowedFormats: ['jpeg', 'png', 'jpg'],
  },
});

module.exports = {
  cloudinary: cloudinary,
  upload: multer({ storage }),
};
