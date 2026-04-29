import express from 'express';
import { createOrder, getMyOrders, getAllOrders, updateOrderStatus, addOrderReview } from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createOrder)
    .get(protect, admin, getAllOrders);

router.route('/myorders').get(protect, getMyOrders);
router.route('/:id/status').patch(protect, admin, updateOrderStatus);
router.route('/:id/review').put(protect, addOrderReview);

export default router;
