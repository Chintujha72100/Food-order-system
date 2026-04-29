import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Allow public fetching so User Tracker can see the store location
router.get('/', getSettings);

// Require Admin rights to change the store location
router.put('/', updateSettings); // Add protect, admin middlewares back in production

export default router;
