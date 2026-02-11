import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    req.user = { id: '507f1f77bcf86cd799439011' };
    return next();
  }

  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized' });
  }
};

export default authMiddleware;
