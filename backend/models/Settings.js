import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    storeId: {
        type: String,
        required: true,
        unique: true,
        default: 'cravebite_main'
    },
    storeLocation: {
        name: { type: String, default: 'CraveBite Central Kitchen' },
        street: { type: String, default: '' },
        area: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zipCode: { type: String, default: '' },
        lat: { type: String, default: '' },
        lng: { type: String, default: '' }
    }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
