import express from 'express';
import multer from 'multer';
import  authMiddleware from '../middleware/authMiddleware.js';
import {
  createLicense,
  getLicenses,
  updateLicense,
  deleteLicense
} from '../controllers/licenseController.js';

const router = express.Router();

// Memory storage for multer (files go to memory before S3)
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// Add multer middleware to routes that handle file uploads
router.post('/', upload.single('document'), createLicense);
router.get('/', getLicenses);
router.put('/:id', upload.single('document'), updateLicense);
router.delete('/:id', deleteLicense);

export default router;
