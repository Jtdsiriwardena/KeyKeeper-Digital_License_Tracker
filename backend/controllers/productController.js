import Product from '../models/Product.js';
import Joi from 'joi';

// ----------------------
// Validation schemas
// ----------------------
const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  tags: Joi.array().items(Joi.string().max(50)).default([])
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  tags: Joi.array().items(Joi.string().max(50))
});

// ----------------------
// Controllers
// ----------------------

// Create product
export const createProduct = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const product = await Product.create({
      user: req.user.id,
      ...value
    });

    return res.status(201).json(product);

  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all products for user
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user.id });
    return res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const product = await Product.findOne({ _id: req.params.id, user: req.user.id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update fields
    if (value.name) product.name = value.name;
    if (value.tags) product.tags = value.tags;

    await product.save();
    return res.json(product);

  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json({ message: 'Product deleted' });

  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
