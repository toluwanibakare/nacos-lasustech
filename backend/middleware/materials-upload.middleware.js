import multer from 'multer';

/**
 * Upload of a free library file (notes, PDF, past questions). Kept in memory and passed straight on
 * to the central server, which stores it and checks the file's real type again.
 */
export const MATERIAL_MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_EXT = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'webp']);

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MATERIAL_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = String(file.originalname).split('.').pop().toLowerCase();
    if (ALLOWED_EXT.has(ext)) cb(null, true);
    else cb(new Error('That file type is not allowed. Use PDF, Word, PowerPoint, Excel, text or an image.'));
  },
});

/** Express middleware that reads one optional `file` field and answers upload problems with a clear message. */
const materialUpload = (req, res, next) => {
  uploader.single('file')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'That file is too large. The limit is 15MB.' : error.message || 'Upload failed.';
    res.status(400).json({ message });
  });
};

export default materialUpload;
