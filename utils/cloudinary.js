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

function addTransformation(url) {
  // Define the transformation string
  const transformation =
    'c_limit,w_1920,h_1080,q_auto:eco,f_auto,fl_strip_profile';

  // Split the URL at '/upload/'
  const parts = url.split('/upload/');

  if (parts.length !== 2) {
    console.error('Invalid Cloudinary URL structure');
    return url; // Return original URL if it doesn't match expected structure
  }

  // Reconstruct the URL with the transformation
  return `${parts[0]}/upload/${transformation}/${parts[1]}`;
}

module.exports = {
  cloudinary: cloudinary,
  upload: multer({ storage }),
  addTransformation,
};
