import request from 'supertest';
import app from '../app.js';
import Product from '../models/Product.js';

describe('Product Controller', () => {

  it('should create a new product', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Test Product', tags: ['Dev', 'SaaS'] });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test Product');
    expect(res.body.tags).toContain('Dev');
  });

  it('should get all products for the user', async () => {
    await Product.create({
      name: 'Existing Product',
      tags: ['Design'],
      user: '507f1f77bcf86cd799439011'
    });

    const res = await request(app).get('/api/products');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('should return 400 if name is missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ tags: ['Dev'] });

    expect(res.statusCode).toBe(400);
  });

});
