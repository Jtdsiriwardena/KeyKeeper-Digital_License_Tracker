import mongoose from 'mongoose';
import License from '../models/License.js';
import Product from '../models/Product.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { uploadFileToS3 } from '../utils/s3.js';


// Create license with optional document
export const createLicense = async (req, res) => {
  const {
    product,
    licenseKey,
    expiryDate,
    autoRenew,
    usageLimits,
    status,
    notes,
    clientProject,
    monthlyCost = 0,
    annualCost = 0,
  } = req.body;

  try {
    // Verify product belongs to user
    const productExists = await Product.findOne({
      _id: product,
      user: req.user.id
    });

    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const license = new License({
      product,
      licenseKey: encrypt(licenseKey),
      expiryDate,
      autoRenew,
      usageLimits,
      status,
      notes,
      clientProject,
      monthlyCost,
      annualCost,
      documents: []
    });

    // Handle uploaded file (if any)
    if (req.file) {
      const { fileName, url, fileKey } = await uploadFileToS3(req.file);
      license.documents.push({ fileName, url, s3Key: fileKey });
    }

    await license.save();

    const licenseObj = license.toObject();
    licenseObj.licenseKey = decrypt(license.licenseKey);

    return res.json(licenseObj);

  } catch (error) {
    console.error('Create license error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Get licenses (with filters)
export const getLicenses = async (req, res) => {
  try {
    const { tag, status, clientProject, search } = req.query;

    const products = await Product.find({ user: req.user.id });
    const productIds = products.map(p => p._id);

    let filter = { product: { $in: productIds } };

    if (status) filter.status = status;
    if (clientProject) filter.clientProject = clientProject;

    if (search) {
      filter.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { licenseKey: { $regex: search, $options: 'i' } }
      ];
    }

    let licenses = await License.find(filter).populate('product');

    // Filter by tag after populate
    if (tag) {
      licenses = licenses.filter(
        lic => lic.product?.tags?.includes(tag)
      );
    }

    const decryptedLicenses = licenses.map(lic => {
      const licObj = lic.toObject();
      licObj.licenseKey = decrypt(lic.licenseKey);
      return licObj;
    });

    return res.json(decryptedLicenses);

  } catch (error) {
    console.error('Filter error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update license with optional new document
export const updateLicense = async (req, res) => {
  const {
    licenseKey,
    expiryDate,
    autoRenew,
    usageLimits,
    status,
    notes,
    clientProject,
    monthlyCost,
    annualCost,
  } = req.body;

  try {
    const license = await License.findById(req.params.id).populate('product');
    if (!license) {
      return res.status(404).json({ message: 'License not found' });
    }

    if (license.product.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (licenseKey) license.licenseKey = encrypt(licenseKey);

    license.expiryDate = expiryDate || license.expiryDate;
    license.autoRenew = autoRenew ?? license.autoRenew;
    license.usageLimits = usageLimits || license.usageLimits;
    license.status = status || license.status;
    license.notes = notes || license.notes;
    license.clientProject = clientProject || license.clientProject;

    if (monthlyCost !== undefined) license.monthlyCost = monthlyCost;
    if (annualCost !== undefined) license.annualCost = annualCost;

    // Handle uploaded file (if any)
    if (req.file) {
      const { fileName, url, fileKey } = await uploadFileToS3(req.file);
      license.documents.push({ fileName, url, s3Key: fileKey });
    }

    await license.save();

    const licenseObj = license.toObject();
    licenseObj.licenseKey = decrypt(license.licenseKey);

    return res.json(licenseObj);

  } catch (error) {
    console.error('Update license error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Delete license
export const deleteLicense = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid license ID format'
      });
    }

    const license = await License.findById(req.params.id).populate({
      path: 'product',
      select: 'user'
    });

    if (!license) {
      return res.status(404).json({
        success: false,
        message: 'License not found'
      });
    }

    if (!license.product || license.product.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this license'
      });
    }

    await License.deleteOne({ _id: req.params.id });

    return res.json({
      success: true,
      message: 'License deleted successfully',
      deletedId: req.params.id
    });

  } catch (error) {
    console.error('Delete license error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete license',
      error: process.env.NODE_ENV === 'development'
        ? error.message
        : undefined
    });
  }
};
