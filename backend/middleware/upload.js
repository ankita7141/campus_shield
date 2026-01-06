const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images and audio
  if (file.mimetype.startsWith('image/') || 
      file.mimetype.startsWith('audio/') ||
      file.mimetype === 'audio/webm' ||
      file.mimetype === 'audio/mpeg') {
    cb(null, true);
  } else {
    cb(new Error('Only image and audio files are allowed'), false);
  }
};

// Configure upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 6 // Max 6 files (5 images + 1 audio)
  },
  fileFilter: fileFilter
});

// Export middleware
exports.uploadReportFiles = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'audio', maxCount: 1 }
]);

// Single file upload for profile pictures
exports.uploadProfilePicture = upload.single('profilePicture');