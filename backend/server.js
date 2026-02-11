
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config({ path: './.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected');

    // Only start the server if NOT in test environment
    if (process.env.NODE_ENV !== 'test') {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));;
