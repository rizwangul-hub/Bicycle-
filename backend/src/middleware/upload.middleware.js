const multer = require('multer');
const path = require('path');
const { createError } = require('../utils/createError');

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 10;

// Whitelisted MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

// Whitelisted extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

// Blacklisted executable/dangerous extensions
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.bin', '.js', '.mjs', '.php',
  '.pl', '.py', '.rb', '.vbs', '.msi', '.com', '.scr', '.ps1',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Explicitly block executables
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return cb(
      createError(400, `Executable or script files are strictly prohibited (${ext})`),
      false
    );
  }

  // 2. Check extension whitelist
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      createError(400, `Unsupported file extension (${ext}). Allowed: JPG, PNG, WEBP, PDF`),
      false
    );
  }

  // 3. Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    return cb(
      createError(400, `Unsupported MIME type (${file.mimetype}). Allowed: JPG, PNG, WEBP, PDF`),
      false
    );
  }

  cb(null, true);
};

// Memory storage keeps file buffers in memory for direct stream to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_REQUEST,
  },
  fileFilter,
});

/**
 * Middleware wrapper handling multiple field names ('files' or 'images')
 * and transforming Multer errors into clean standard JSON responses.
 */
const handleUpload = (req, res, next) => {
  // Accepts either 'files' or 'images' array fields, or any
  const uploadHandler = upload.array('files', MAX_FILES_PER_REQUEST);

  uploadHandler(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            createError(400, `File size exceeds the configured limit of ${MAX_FILE_SIZE_MB}MB`)
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(
            createError(400, `Too many files. Maximum allowed per request is ${MAX_FILES_PER_REQUEST}`)
          );
        }
        return next(createError(400, `Upload error: ${err.message}`));
      }
      return next(err);
    }
    next();
  });
};

module.exports = {
  handleUpload,
  MAX_FILE_SIZE_MB,
  MAX_FILES_PER_REQUEST,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  BLOCKED_EXTENSIONS,
};
