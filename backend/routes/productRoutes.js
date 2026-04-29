import express from 'express';
import { getProducts, createProduct, deleteProduct, updateProduct, createProductReview, deleteProductReview } from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getProducts)
    .post(protect, admin, createProduct);

router.route('/:id/reviews')
    .post(protect, createProductReview);

router.route('/:id/reviews/:reviewId')
    .delete(protect, admin, deleteProductReview);

router.route('/:id')
    .put(protect, admin, updateProduct)
    .delete(protect, admin, deleteProduct);

export default router;
