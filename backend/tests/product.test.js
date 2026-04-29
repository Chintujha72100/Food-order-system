/**
 * Product API Tests
 * Tests: Menu retrieval, filtering, product creation, reviews
 * Tools: Jest + Supertest + MongoDB Memory Server
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import Product from '../models/Product.js';
import User from '../models/User.js';
import productRoutes from '../routes/productRoutes.js';

// ─── Test App Setup ───────────────────────────────────────────────────────────
let mongod;
let adminUser;
let regularUser;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    adminUser = await User.create({
        name: 'Admin',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin'
    });

    regularUser = await User.create({
        name: 'User',
        email: 'user@test.com',
        password: 'user123',
        role: 'user'
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    await Product.deleteMany({});
});

function buildAppWithUser(user) {
    const testApp = express();
    testApp.use(express.json());
    testApp.use((req, res, next) => { req.user = user; next(); });
    testApp.use('/api/products', productRoutes);
    return testApp;
}

const sampleProduct = {
    name: 'Chicken Burger',
    description: 'Juicy grilled chicken burger',
    price: 199,
    category: 'Fast Food',
    imageUrl: 'https://example.com/burger.jpg',
    inStock: true,
    isVeg: false
};

// ─── GET /api/products ────────────────────────────────────────────────────────
describe('GET /api/products — Menu Retrieval', () => {

    it('should return all in-stock products', async () => {
        await Product.create(sampleProduct);
        await Product.create({ ...sampleProduct, name: 'Veg Burger', isVeg: true, inStock: false });

        const testApp = buildAppWithUser(regularUser);
        const res = await request(testApp).get('/api/products');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2); // returns both regardless of inStock (frontend filters)
    });

    it('should return empty array when no products exist', async () => {
        const testApp = buildAppWithUser(regularUser);
        const res = await request(testApp).get('/api/products');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('should filter products by keyword search', async () => {
        await Product.create(sampleProduct);
        await Product.create({ ...sampleProduct, name: 'Margherita Pizza', category: 'Italian' });

        const testApp = buildAppWithUser(regularUser);
        const res = await request(testApp).get('/api/products?keyword=pizza');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Margherita Pizza');
    });

    it('should filter products by category', async () => {
        await Product.create(sampleProduct); // Fast Food
        await Product.create({ ...sampleProduct, name: 'Caesar Salad', category: 'Healthy' });

        const testApp = buildAppWithUser(regularUser);
        const res = await request(testApp).get('/api/products?category=Healthy');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].category).toBe('Healthy');
    });

    it('should filter products within a price range', async () => {
        await Product.create(sampleProduct); // price: 199
        await Product.create({ ...sampleProduct, name: 'Luxury Burger', price: 799 });

        const testApp = buildAppWithUser(regularUser);
        const res = await request(testApp).get('/api/products?maxPrice=300');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].price).toBeLessThanOrEqual(300);
    });

    it('each product should have name, description, price, and imageUrl', async () => {
        await Product.create(sampleProduct);

        const testApp = buildAppWithUser(regularUser);
        const res = await request(testApp).get('/api/products');

        const product = res.body[0];
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('description');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('imageUrl');
    });
});

// ─── POST /api/products — Create Product (Admin only) ────────────────────────
describe('POST /api/products — Create Product', () => {

    it('should create a product as admin', async () => {
        const testApp = buildAppWithUser(adminUser);

        const res = await request(testApp)
            .post('/api/products')
            .send(sampleProduct);

        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Chicken Burger');
        expect(res.body.price).toBe(199);
    });

    it('should return 400 for missing required fields', async () => {
        const testApp = buildAppWithUser(adminUser);

        const res = await request(testApp)
            .post('/api/products')
            .send({ name: 'Incomplete Item' }); // missing price, etc.

        expect(res.status).toBe(400);
    });
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
describe('DELETE /api/products/:id — Delete Product', () => {

    it('should delete a product as admin', async () => {
        const product = await Product.create(sampleProduct);
        const testApp = buildAppWithUser(adminUser);

        const res = await request(testApp).delete(`/api/products/${product._id}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Product removed');

        const deleted = await Product.findById(product._id);
        expect(deleted).toBeNull();
    });

    it('should return 404 for a non-existent product', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const testApp = buildAppWithUser(adminUser);

        const res = await request(testApp).delete(`/api/products/${fakeId}`);
        expect(res.status).toBe(404);
    });
});

// ─── POST /api/products/:id/reviews ───────────────────────────────────────────
describe('POST /api/products/:id/reviews — Product Reviews', () => {

    it('should add a review for an existing product', async () => {
        const product = await Product.create(sampleProduct);
        const testApp = buildAppWithUser(regularUser);

        const res = await request(testApp)
            .post(`/api/products/${product._id}/reviews`)
            .send({ rating: 5, comment: 'Absolutely delicious!' });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Review added');

        const updated = await Product.findById(product._id);
        expect(updated.numReviews).toBe(1);
        expect(updated.rating).toBe(5);
    });

    it('should return 400 if user reviews the same product twice', async () => {
        const product = await Product.create(sampleProduct);
        const testApp = buildAppWithUser(regularUser);

        await request(testApp)
            .post(`/api/products/${product._id}/reviews`)
            .send({ rating: 5, comment: 'First review' });

        const res = await request(testApp)
            .post(`/api/products/${product._id}/reviews`)
            .send({ rating: 3, comment: 'Second attempt' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Product already reviewed');
    });
});
