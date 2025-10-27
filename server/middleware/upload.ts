import multer from 'multer';

// Configure multer with memory storage
// Files will be stored in buffer (req.file.buffer) for upload to Cloudinary
const storage = multer.memoryStorage();

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Multer upload middleware
 * Stores files in memory buffer for Cloudinary upload
 * Maximum file size: 10MB
 */
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types
    // Can add specific type filtering here if needed
    cb(null, true);
  },
});

/**
 * Error handler for multer errors
 */
export function handleMulterError(err: any, req: any, res: any, next: any): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large, max 10MB' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
}
