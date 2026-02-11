import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getNotifications,
  markNotificationAsRead
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/:id/read', markNotificationAsRead);

export default router;
