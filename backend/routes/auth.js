import express from 'express';
import {
  register,
  login,
  getMe,
  validateAuthInput
} from '../controllers/authController.js';

const router = express.Router();

// Auth routes
router.post('/register', validateAuthInput, register);
router.post('/login', validateAuthInput, login);
router.get('/me', getMe); // assumes auth middleware runs before this

export default router;
