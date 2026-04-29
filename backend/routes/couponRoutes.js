import express from 'express';
const router = express.Router();
import {
    getCoupons,
    validateCoupon,
    createCoupon,
    toggleCoupon
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .get(getCoupons)
    .post(protect, admin, createCoupon);

router.post('/validate', validateCoupon);
router.put('/:id/toggle', protect, admin, toggleCoupon);

export default router;
