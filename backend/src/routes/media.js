import { Router } from 'express';
import multer from 'multer';
import { Media } from '../models/Media.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { uploadToCloudinary, promoteToS3 } from '../services/storageProvider.js';

const router = Router();

// In-memory is fine here: files go straight to Cloudinary/S3, never touch disk.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', requireAuth, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'No file provided (expected multipart field "file")');

  const { publicId, url } = await uploadToCloudinary(req.file);
  const media = await Media.create({
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user.id,
    cloudinary: { publicId, url },
  });

  res.status(201).json({ media });
}));

router.post('/:id/promote', requireAuth, asyncHandler(async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw new HttpError(404, 'Media not found');
  if (media.status === 'PROMOTED') throw new HttpError(409, 'Already promoted to S3');

  const { key, url } = await promoteToS3({ publicId: media.cloudinary.publicId, filename: media.filename });
  media.s3 = { key, url };
  media.status = 'PROMOTED';
  await media.save();

  res.json({ media });
}));

export default router;
