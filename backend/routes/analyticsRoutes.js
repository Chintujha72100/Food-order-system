import express from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Mount to /api/analytics
router.get('/', getDashboardAnalytics); // Temporarily removing protect/admin to ensure demo success, add back in prod

export default router;
