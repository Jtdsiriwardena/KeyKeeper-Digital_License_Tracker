import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createProduct);
router.get('/', getProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);



export default router;
