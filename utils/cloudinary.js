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
    // Balanced resolution and quality settings
    await sharp(filePath)
      .resize({
        width: 1920,
        height: 1080,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(compressedPath);

    // Upload the optimized image to Cloudinary with balanced quality settings
    const result = await cloudinary.uploader.upload(compressedPath, {
      folder: 'Progress',
      resource_type: 'image',
      quality: 80,
      fetch_format: 'auto',
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

  // Apply optimized image transformations
  // Balanced transformation for quality and performance
  const transformation = 'c_limit,w_1920,h_1080,q_80,f_auto,dpr_auto';
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
