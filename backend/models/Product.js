import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true }, // Price in INR
    category: { type: String, required: true },
    imageUrl: { type: String },
    prepTime: { type: String },
    inStock: { type: Boolean, default: true },
    gstRate: { type: Number, default: 5 }, // GST rate percentage
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema]
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
