import mongoose from 'mongoose';

const licenseSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  licenseKey: { type: String, required: true }, // encrypted later
  expiryDate: { type: Date, required: true },
  autoRenew: { type: Boolean, default: false },
  usageLimits: { type: String }, // optional
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Renewed'],
    default: 'Active',
  },
  notes: { type: String },
  clientProject: { type: String },
  monthlyCost: { type: Number, default: 0 },
  annualCost: { type: Number, default: 0 },

  // NEW: documents stored in S3
  documents: [
    {
      fileName: { type: String },  // original filename
      s3Key: { type: String },     // S3 object key
      url: { type: String },       // public or signed URL
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

const License = mongoose.model('License', licenseSchema);
export default License;
