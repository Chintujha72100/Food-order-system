/**
 * Order API Tests
 * Tests: CRUD operations, input validation, status updates
 * Tools: Jest + Supertest + MongoDB Memory Server
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';

// ─── Mock the auth middleware BEFORE importing routes ─────────────────────────
// This prevents the real protect/admin from running in tests.
// We inject req.user manually in each test via buildAppWithUser().
let currentMockUser = null;

jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
    protect: (req, res, next) => {
        if (currentMockUser) req.user = currentMockUser;
        next();
    },
    admin: (req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(401).json({ message: 'Not authorized as an admin' });
        }
    }
}));

// Dynamic import AFTER mocking
const { default: Order } = await import('../models/Order.js');
const { default: User } = await import('../models/User.js');
const { default: Product } = await import('../models/Product.js');
const { default: orderRoutes } = await import('../routes/orderRoutes.js');

// ─── DB Fixtures ──────────────────────────────────────────────────────────────
let mongod;
let testUser;
let adminUser;
let testProduct;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    testUser = await User.create({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
        role: 'user'
    });

    adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
    });

    testProduct = await Product.create({
        name: 'Margherita Pizza',
        description: 'Classic tomato and mozzarella pizza',
        price: 299,
        category: 'Fast Food',
        imageUrl: 'https://example.com/pizza.jpg',
        inStock: true
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    await Order.deleteMany({});
    await User.findByIdAndUpdate(testUser._id, { walletBalance: 0, walletTransactions: [] });
    await User.findByIdAndUpdate(adminUser._id, { walletBalance: 0, walletTransactions: [] });
    currentMockUser = null;
});

// ─── Helper ───────────────────────────────────────────────────────────────────
function buildApp(user) {
    currentMockUser = user;
    const testApp = express();
    testApp.use(express.json());
    testApp.use('/api/orders', orderRoutes);
    return testApp;
}

// ─── POST /api/orders — Create Order ─────────────────────────────────────────
describe('POST /api/orders — Create Order', () => {

    it('should create a new order successfully with valid data', async () => {
        const res = await request(buildApp(testUser))
            .post('/api/orders')
            .send({
                items: [{ product: testProduct._id, quantity: 2, price: 299 }],
                totalAmount: 598,
                orderType: 'Delivery',
                deliveryAddress: { houseNumber: '12', street: 'MG Road', city: 'Bangalore', zipCode: '560001' },
                paymentMethod: 'Cash'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.status).toBe('New');
        expect(res.body.totalAmount).toBe(598);
        expect(res.body.paymentMethod).toBe('Cash');
    });

    it('should return 400 when items array is empty', async () => {
        const res = await request(buildApp(testUser))
            .post('/api/orders')
            .send({
                items: [],
                totalAmount: 0,
                orderType: 'Delivery',
                deliveryAddress: { houseNumber: '12', street: 'MG Road', city: 'Bangalore', zipCode: '560001' }
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('No order items');
    });

    it('should default orderType to Delivery if not provided', async () => {
        const res = await request(buildApp(testUser))
            .post('/api/orders')
            .send({
                items: [{ product: testProduct._id, quantity: 1, price: 299 }],
                totalAmount: 299,
                paymentMethod: 'Cash'
            });

        expect(res.status).toBe(201);
        expect(res.body.orderType).toBe('Delivery');
    });

    it('should set deliveryAddress to null/falsy for Pickup orders', async () => {
        const res = await request(buildApp(testUser))
            .post('/api/orders')
            .send({
                items: [{ product: testProduct._id, quantity: 1, price: 299 }],
                totalAmount: 299,
                orderType: 'Pickup',
                paymentMethod: 'Cash'
            });

        expect(res.status).toBe(201);
        expect(res.body.deliveryAddress).toBeFalsy();
    });

    it('should set paymentStatus to Pending for Cash orders', async () => {
        const res = await request(buildApp(testUser))
            .post('/api/orders')
            .send({
                items: [{ product: testProduct._id, quantity: 1, price: 299 }],
                totalAmount: 299,
                orderType: 'Pickup',
                paymentMethod: 'Cash'
            });

        expect(res.status).toBe(201);
        expect(res.body.paymentStatus).toBe('Pending');
    });
});

// ─── GET /api/orders/myorders — Get My Orders ────────────────────────────────
describe('GET /api/orders/myorders — Get My Orders', () => {

    it('should return only orders belonging to the authenticated user', async () => {
        await Order.create({ user: testUser._id, items: [{ product: testProduct._id, quantity: 1, price: 299 }], totalAmount: 299 });
        await Order.create({ user: adminUser._id, items: [{ product: testProduct._id, quantity: 2, price: 598 }], totalAmount: 598 });

        const res = await request(buildApp(testUser)).get('/api/orders/myorders');

        expect(res.status).toBe(200);
        expect(res.body.some(o => o.totalAmount === 299)).toBe(true);
        expect(res.body.some(o => o.totalAmount === 598)).toBe(false);
    });

    it('should return empty array when user has no orders', async () => {
        const res = await request(buildApp(testUser)).get('/api/orders/myorders');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('should return orders sorted by newest first', async () => {
        await Order.create({ user: testUser._id, items: [{ product: testProduct._id, quantity: 1, price: 100 }], totalAmount: 100 });
        await new Promise(r => setTimeout(r, 50));
        await Order.create({ user: testUser._id, items: [{ product: testProduct._id, quantity: 2, price: 200 }], totalAmount: 200 });

        const res = await request(buildApp(testUser)).get('/api/orders/myorders');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0].totalAmount).toBe(200);
        expect(res.body[1].totalAmount).toBe(100);
    });
});

// ─── GET /api/orders — Admin: Get All Orders ──────────────────────────────────
describe('GET /api/orders — Admin: Get All Orders', () => {

    it('should return all orders for admin user', async () => {
        await Order.create({ user: testUser._id, items: [{ product: testProduct._id, quantity: 1, price: 299 }], totalAmount: 299 });
        await Order.create({ user: adminUser._id, items: [{ product: testProduct._id, quantity: 2, price: 598 }], totalAmount: 598 });

        const res = await request(buildApp(adminUser)).get('/api/orders');

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
    });

    it('should return 401 for non-admin users accessing all orders', async () => {
        const res = await request(buildApp(testUser)).get('/api/orders');

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/not authorized as an admin/i);
    });
});

// ─── PATCH /api/orders/:id/status — Update Order Status ─────────────────────
describe('PATCH /api/orders/:id/status — Update Order Status', () => {

    it('should update order status successfully as admin', async () => {
        const order = await Order.create({
            user: testUser._id,
            items: [{ product: testProduct._id, quantity: 1, price: 299 }],
            totalAmount: 299,
            status: 'New'
        });

        const res = await request(buildApp(adminUser))
            .patch(`/api/orders/${order._id}/status`)
            .send({ status: 'Cooking' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Cooking');
    });

    it('should transition through all valid statuses', async () => {
        const order = await Order.create({
            user: testUser._id,
            items: [{ product: testProduct._id, quantity: 1, price: 299 }],
            totalAmount: 299,
            status: 'New'
        });

        const statuses = ['Cooking', 'Out for Delivery', 'Completed'];
        for (const status of statuses) {
            await User.findByIdAndUpdate(testUser._id, { walletBalance: 0 });
            const res = await request(buildApp(adminUser))
                .patch(`/api/orders/${order._id}/status`)
                .send({ status });
            expect(res.body.status).toBe(status);
        }
    });

    it('should return 404 for a non-existent order ID', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(buildApp(adminUser))
            .patch(`/api/orders/${fakeId}/status`)
            .send({ status: 'Cooking' });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Order not found');
    });

    it('should return 401 for non-admin attempting to update status', async () => {
        const order = await Order.create({
            user: testUser._id,
            items: [{ product: testProduct._id, quantity: 1, price: 299 }],
            totalAmount: 299,
            status: 'New'
        });

        const res = await request(buildApp(testUser))  // regular user
            .patch(`/api/orders/${order._id}/status`)
            .send({ status: 'Cooking' });

        expect(res.status).toBe(401);
    });

    it('should add 5% cashback to wallet on order Completion', async () => {
        const order = await Order.create({
            user: testUser._id,
            items: [{ product: testProduct._id, quantity: 1, price: 299 }],
            totalAmount: 500,
            status: 'Out for Delivery'
        });

        await User.findByIdAndUpdate(testUser._id, { walletBalance: 0, walletTransactions: [] });

        await request(buildApp(adminUser))
            .patch(`/api/orders/${order._id}/status`)
            .send({ status: 'Completed' });

        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.walletBalance).toBe(25); // 5% of 500
    });
});

// ─── Input Validation Tests ───────────────────────────────────────────────────
describe('Input Validation', () => {

    it('should reject order with missing totalAmount', async () => {
        const res = await request(buildApp(testUser))
            .post('/api/orders')
            .send({
                items: [{ product: testProduct._id, quantity: 1, price: 299 }]
                // totalAmount intentionally missing
            });

        expect(res.status).toBe(400);
    });

    it('should handle invalid order ID format gracefully', async () => {
        const res = await request(buildApp(adminUser))
            .patch('/api/orders/invalid-id/status')
            .send({ status: 'Cooking' });

        expect(res.status).toBe(500); // Mongoose cast error
    });
});
