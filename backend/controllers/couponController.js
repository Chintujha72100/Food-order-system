import Coupon from '../models/Coupon.js';

export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({});
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const validateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findOne({ code: req.body.code.toUpperCase() });
        if (coupon && coupon.active && new Date(coupon.expiryDate) > new Date()) {
            res.json({ discountPercentage: coupon.discountPercentage });
        } else {
            res.status(400).json({ message: 'Invalid or expired coupon' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createCoupon = async (req, res) => {
    const { code, discountPercentage, expiryDate } = req.body;
    try {
        const coupon = new Coupon({
            code: code.toUpperCase(), discountPercentage, expiryDate
        });
        const createdCoupon = await coupon.save();
        res.status(201).json(createdCoupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (coupon) {
            coupon.active = !coupon.active;
            const updatedCoupon = await coupon.save();
            res.json(updatedCoupon);
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
