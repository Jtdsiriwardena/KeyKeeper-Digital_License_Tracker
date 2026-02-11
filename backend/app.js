// app.js
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import licenseRoutes from './routes/licenses.js';
import notificationsRoutes from './routes/notifications.js';

dotenv.config({ path: './.env' });

// Verify env variables
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/notifications', notificationsRoutes);

export default app;
