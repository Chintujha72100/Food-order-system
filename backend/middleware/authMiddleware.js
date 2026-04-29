import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        let user;

        // 1. First check for proper JWT Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                if (token !== 'FAKE_TOKEN') {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
                    user = await User.findById(decoded.id).select('-password');
                }
            } catch (err) {
                console.error('JWT Verification Failed', err);
            }
        }

        // 2. Try passing User ID explicitly for demo ordering
        if (!user && req.headers['x-user-id']) {
            user = await User.findById(req.headers['x-user-id']);
        }

        // 3. Fallback to Admin User for Admin pages (Mock auth)
        if (!user) {
            user = await User.findOne({ role: 'admin' });
        }

        if (user) {
            req.user = user;
        }
        next();
    } catch (error) {
        next();
    }
};

export const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};
