import Settings from '../models/Settings.js';

// @desc    Get store settings
// @route   GET /api/settings
export const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne({ storeId: 'cravebite_main' });

        // Auto-initialize if it doesn't exist
        if (!settings) {
            settings = await Settings.create({ storeId: 'cravebite_main' });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update store settings
// @route   PUT /api/settings
export const updateSettings = async (req, res) => {
    try {
        const { storeLocation } = req.body;

        const settings = await Settings.findOneAndUpdate(
            { storeId: 'cravebite_main' },
            { $set: { storeLocation } },
            { new: true, upsert: true }
        );

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
