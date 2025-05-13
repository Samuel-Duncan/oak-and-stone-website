const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage for temporary local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/'; // Ensure this folder exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Function to compress and upload images to Cloudinary
async function processAndUploadImage(filePath) {
  try {
    const compressedPath = `${filePath}-compressed.jpg`;

    // Resize and compress the image using Sharp
    await sharp(filePath)
      .resize({ width: 1920, height: 1080, fit: 'inside' })
      .jpeg({ quality: 100 })
      .toFile(compressedPath);

    // Upload the optimized image to Cloudinary
    const result = await cloudinary.uploader.upload(compressedPath, {
      folder: 'Progress',
      resource_type: 'image',
    });

    // Clean up local temp files
    fs.unlinkSync(filePath);
    fs.unlinkSync(compressedPath);

    return result;
  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
}

// Function to modify Cloudinary URLs with transformations
function addTransformation(url, fileType) {
  if (fileType === 'pdf' || fileType === 'document') {
    return `${url}?fl_attachment=true`;
  }

  // Apply image transformations
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
  cloudinary,
  upload,
  processAndUploadImage,
  addTransformation,
};
