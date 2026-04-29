import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountPercentage: { type: Number, required: true },
    active: { type: Boolean, default: true },
    expiryDate: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.model('Coupon', couponSchema);
