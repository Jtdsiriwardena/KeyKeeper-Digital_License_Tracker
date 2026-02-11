import request from 'supertest';
import app from '../app.js';
import License from '../models/License.js';
import Product from '../models/Product.js';

// 🔹 Mock encryption utils
jest.mock('../utils/encryption.js', () => ({
  encrypt: (str) => `encrypted-${str}`,
  decrypt: (str) => str.replace('encrypted-', '')
}));

// 🔹 Mock S3 upload
jest.mock('../utils/s3.js', () => ({
  uploadFileToS3: async (file) => ({
    fileName: file.originalname,
    url: `https://fake-s3/${file.originalname}`,
    fileKey: `fake-key-${file.originalname}`
  })
}));

describe('License Controller', () => {
  let productId;

  beforeEach(async () => {
    // Create a product for the user
    const product = await Product.create({
      name: 'Test Product',
      tags: ['Dev'],
      user: '507f1f77bcf86cd799439011'
    });
    productId = product._id.toString();
  });

  afterEach(async () => {
    await License.deleteMany({});
    await Product.deleteMany({});
  });

  it('should create a license without file', async () => {
    const res = await request(app)
      .post('/api/licenses')
      .send({
        product: productId,
        licenseKey: 'ABC123',
        expiryDate: '2026-12-31',
        autoRenew: true,
        status: 'Active'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.licenseKey).toBe('ABC123'); // decrypted
    expect(res.body.documents).toHaveLength(0);
  });

  it('should create a license with file', async () => {
    const res = await request(app)
      .post('/api/licenses')
      .attach('document', Buffer.from('dummy'), 'test.pdf')
      .field('product', productId)
      .field('licenseKey', 'FILE123')
      .field('expiryDate', '2026-12-31')
      .field('status', 'Active');

    expect(res.statusCode).toBe(200);
    expect(res.body.licenseKey).toBe('FILE123');
    expect(res.body.documents).toHaveLength(1);
    expect(res.body.documents[0].fileName).toBe('test.pdf');
    expect(res.body.documents[0].url).toMatch(/https:\/\/fake-s3/);
  });

  it('should get licenses for user', async () => {
    // Create two licenses
    await License.create({
      product: productId,
      licenseKey: 'L1',
      expiryDate: new Date(),
      status: 'Active',
      user: '507f1f77bcf86cd799439011',
      documents: []
    });
    await License.create({
      product: productId,
      licenseKey: 'L2',
      expiryDate: new Date(),
      status: 'Renewed',
      user: '507f1f77bcf86cd799439011',
      documents: []
    });

    const res = await request(app).get('/api/licenses');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].licenseKey).toBe('L1');
    expect(res.body[1].licenseKey).toBe('L2');
  });

  it('should update a license', async () => {
    const license = await License.create({
      product: productId,
      licenseKey: 'UPDATE123',
      expiryDate: '2026-01-01',
      status: 'Active',
      documents: []
    });

    const res = await request(app)
      .put(`/api/licenses/${license._id}`)
      .send({ status: 'Expired', licenseKey: 'UPDATED' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('Expired');
    expect(res.body.licenseKey).toBe('UPDATED');
  });

  it('should delete a license', async () => {
    const license = await License.create({
      product: productId,
      licenseKey: 'DEL123',
      expiryDate: '2026-01-01',
      status: 'Active',
      documents: []
    });

    const res = await request(app)
      .delete(`/api/licenses/${license._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const found = await License.findById(license._id);
    expect(found).toBeNull();
  });
});
