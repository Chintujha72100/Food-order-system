import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

export const getDashboardAnalytics = async (req, res) => {
    try {
        // 1. Total Revenue (Completed Orders only for accuracy, or all non-cancelled)
        const revenueAggregation = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueAggregation[0]?.total || 0;

        // 2. Active Orders
        const activeOrders = await Order.countDocuments({ status: { $in: ['New', 'Cooking', 'Out for Delivery'] } });

        // 3. Total Customers (Users with role 'user')
        const totalCustomers = await User.countDocuments({ role: 'user' });

        // 4. Products Count (for growth/inventory metrics)
        const totalProducts = await Product.countDocuments();

        // 5. Weekly Trend Data (Last 7 Days)
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const dailyData = await Order.aggregate([
            { $match: { createdAt: { $gte: last7Days } } },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" }, // 1 (Sun) to 7 (Sat)
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Map MongoDB Day of Week (1-7) to Names
        const daysMap = { 1: 'Sun', 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat' };

        // Initialize an empty 7-day array
        let chartData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i)); // Go back 6 days up to today
            const dayNum = d.getDay() + 1; // getDay is 0-6, Mongo is 1-7

            const existingDay = dailyData.find(dt => dt._id === dayNum);
            chartData.push({
                name: daysMap[dayNum],
                revenue: existingDay ? existingDay.revenue : 0,
                orders: existingDay ? existingDay.orders : 0
            });
        }

        res.json({
            stats: {
                totalRevenue,
                activeOrders,
                totalCustomers,
                growth: '+12.5%' // Mocked for now, requires complex previous-period calculation
            },
            chartData
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
