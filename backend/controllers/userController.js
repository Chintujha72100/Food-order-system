import User from '../models/User.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await User.deleteOne({ _id: user._id });
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle item in wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
export const toggleWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { productId } = req.params;

        if (user.wishlist.includes(productId)) {
            user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        } else {
            user.wishlist.push(productId);
        }

        await user.save();
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');
        res.json(user.wishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user wallet
// @route   GET /api/users/wallet
// @access  Private
export const getWallet = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('walletBalance walletTransactions');
        // Sort transactions by date descending
        if (user && user.walletTransactions) {
            user.walletTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        res.json({
            balance: user.walletBalance,
            transactions: user.walletTransactions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add funds to wallet (Mock endpoint)
// @route   POST /api/users/wallet/add
// @access  Private
export const addFunds = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const user = await User.findById(req.user._id);
        user.walletBalance += Number(amount);
        user.walletTransactions.push({
            type: 'credit',
            amount: Number(amount),
            description: 'Funds Added manually'
        });

        await user.save();
        res.json({
            balance: user.walletBalance,
            transactions: user.walletTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
