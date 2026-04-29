import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    totalAmount: { type: Number, required: true },
    orderType: { type: String, enum: ['Delivery', 'Pickup'], default: 'Delivery' },
    deliveryAddress: {
        houseNumber: String,
        street: String,
        landmark: String,
        city: String,
        zipCode: String,
        lat: String,
        lng: String
    },
    driverLocation: {
        lat: String,
        lng: String
    },
    tipAmount: { type: Number, default: 0 },
    cookingInstructions: { type: String, default: '' },
    cutleryOptOut: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5 },
    reviewText: { type: String },
    status: {
        type: String,
        enum: ['New', 'Cooking', 'Out for Delivery', 'Completed', 'Cancelled'],
        default: 'New'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Card', 'Wallet'],
        default: 'Cash'
    }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
