import Order from '../models/Order.js';
import User from '../models/User.js';

/**
 * Simulates real-time order status progression after an order is placed.
 * Stages:  New (0s) → Cooking (10s) → Out for Delivery (25s) → Completed (50s)
 * Each transition emits a socket event so the Tracker updates live.
 */
const simulateOrderProgress = (orderId, io) => {
    const stages = [
        { status: 'Cooking',          delay: 10000  }, // 10 seconds
        { status: 'Out for Delivery', delay: 25000  }, // 25 seconds
        { status: 'Completed',        delay: 50000  }, // 50 seconds
    ];

    stages.forEach(({ status, delay }) => {
        setTimeout(async () => {
            try {
                const order = await Order.findById(orderId);
                if (!order || order.status === 'Cancelled') return;

                order.status = status;
                await order.save();

                // Emit real-time update to everyone tracking this order
                if (io) {
                    io.to(orderId.toString()).emit('orderStatusUpdated', {
                        orderId: orderId.toString(),
                        status
                    });
                }

                // On completion: credit 5% cashback
                if (status === 'Completed') {
                    const user = await User.findById(order.user);
                    if (user) {
                        const cashback = Math.round(order.totalAmount * 0.05);
                        user.walletBalance += cashback;
                        user.walletTransactions.push({
                            type: 'credit',
                            amount: cashback,
                            description: 'Order Cashback (5%)'
                        });
                        await user.save();
                    }
                }
            } catch (err) {
                console.error(`[Simulation] Failed to update order ${orderId} to ${status}:`, err.message);
            }
        }, delay);
    });
};

export const createOrder = async (req, res) => {
    try {
        const { items, totalAmount, deliveryAddress, orderType, tipAmount, cookingInstructions, cutleryOptOut, paymentMethod } = req.body;

        if (items && items.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        const user = await User.findById(req.user._id);

        // Handle Wallet Payment
        if (paymentMethod === 'Wallet') {
            if (user.walletBalance < totalAmount) {
                return res.status(400).json({ message: 'Insufficient wallet balance' });
            }
            user.walletBalance -= totalAmount;
            user.walletTransactions.push({
                type: 'debit',
                amount: totalAmount,
                description: 'Order Payment'
            });
            await user.save();
        }

        const order = new Order({
            user: req.user._id,
            items,
            totalAmount,
            orderType: orderType || 'Delivery',
            deliveryAddress: orderType === 'Pickup' ? null : deliveryAddress,
            tipAmount: tipAmount || 0,
            cookingInstructions: cookingInstructions || '',
            cutleryOptOut: cutleryOptOut || false,
            paymentMethod: paymentMethod || 'Cash',
            paymentStatus: paymentMethod === 'Wallet' ? 'Completed' : 'Pending'
        });

        const createdOrder = await order.save();

        // 🔄 Auto-simulate order status progression (real-time backend simulation)
        simulateOrderProgress(createdOrder._id, req.io);

        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).populate('items.product').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name email').populate('items.product').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            const previousStatus = order.status;
            order.status = req.body.status || order.status;
            const updatedOrder = await order.save();

            // Reward 5% cashback on completion (only if not already completed to avoid duplicates)
            if (previousStatus !== 'Completed' && order.status === 'Completed') {
                const user = await User.findById(order.user);
                if (user) {
                    const cashback = Math.round(order.totalAmount * 0.05);
                    user.walletBalance += cashback;
                    user.walletTransactions.push({
                        type: 'credit',
                        amount: cashback,
                        description: 'Order Cashback (5%)'
                    });
                    await user.save();
                }
            }

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addOrderReview = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            // Check if the order belongs to the user
            if (order.user.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized to review this order' });
            }

            if (order.status !== 'Completed') {
                return res.status(400).json({ message: 'Order must be completed before reviewing' });
            }

            order.rating = req.body.rating;
            order.reviewText = req.body.reviewText || '';

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
