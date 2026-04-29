import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    }
});

// Pass io to routes if needed
app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on('connection', (socket) => {
    console.log('Client connected to socket.io:', socket.id);

    // Join a room based on order ID
    socket.on('joinOrderRoom', (orderId) => {
        socket.join(orderId);
        console.log(`Socket ${socket.id} joined room: ${orderId}`);
    });

    // Handle driver location updates
    socket.on('updateLocation', (data) => {
        const { orderId, lat, lng } = data;
        // Broadcast the location to everyone in the order room
        io.to(orderId).emit('locationUpdated', { lat, lng });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});


// 1. Security Headers & Sanitization
app.use(helmet());

import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// Workaround for Express 5 where req.query is getter-only, breaking mongo-sanitize
app.use((req, res, next) => {
    Object.defineProperty(req, 'query', {
        value: req.query,
        writable: true,
        configurable: true,
        enumerable: true
    });
    next();
});

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());
// Data Sanitization against XSS
app.use(xss());

// 2. Global API Rate Limiting (Protects against DDoS / Brute Force)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests from this IP, please try again after 15 minutes" }
});
app.use('/api', limiter);

// 3. CORS & Body Parsing

app.use(cors({
    origin: true,
    credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'CraveBite Backend is running' });
});

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cravebite';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        console.log(`CraveBite API is live!`);
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));
