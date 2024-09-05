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

function addTransformation(url, fileType) {
  if (fileType === 'pdf' || fileType === 'document') {
    return `${url}?fl_attachment=true`;
  }

  // For images, apply the existing transformation
  const transformation =
    'c_limit,w_1280,h_720,q_auto:eco,f_auto,fl_strip_profile';
  const parts = url.split('/upload/');

  if (parts.length !== 2) {
    console.error('Invalid Cloudinary URL structure');
    return url;
  }

  return `${parts[0]}/upload/${transformation}/${parts[1]}`;
}

module.exports = {
  cloudinary: cloudinary,
  upload: multer({ storage }),
  addTransformation,
};
