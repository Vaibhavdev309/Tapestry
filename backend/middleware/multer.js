import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'uploads/');
  },
  filename: function (req, file, callback) {
    // Generate unique filename to prevent conflicts and path traversal
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

// File filter for security
const fileFilter = (req, file, callback) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return callback(null, true);
  } else {
    callback(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!'));
  }
};

// Configure multer with security settings
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 4 // Maximum 4 files
  },
  fileFilter: fileFilter
});

export default upload;
