import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getCostSummary } from '../controllers/costController.js';

const router = express.Router();

router.get('/cost-summary', authMiddleware, getCostSummary);

export default router;
