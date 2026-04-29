import express from 'express';
import { getUsers, deleteUser, toggleWishlist, getWishlist, getWallet, addFunds } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, admin, getUsers);

router.route('/wishlist')
    .get(protect, getWishlist);

router.route('/wishlist/:productId')
    .post(protect, toggleWishlist);

router.route('/wallet')
    .get(protect, getWallet);

router.route('/wallet/add')
    .post(protect, addFunds);

router.route('/:id')
    .delete(protect, admin, deleteUser);

export default router;
