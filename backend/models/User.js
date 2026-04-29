import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    addresses: [{
        street: String,
        city: String,
        zipCode: String
    }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Date },
    walletBalance: { type: Number, default: 0 },
    walletTransactions: [{
        type: { type: String, enum: ['credit', 'debit'] },
        amount: Number,
        description: String,
        date: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export default mongoose.model('User', userSchema);
