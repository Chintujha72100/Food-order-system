import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Package, MapPin, Calendar, CheckCircle, Clock, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewingOrder, setReviewingOrder] = useState(null);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        const fetchOrderHistory = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/orders/myorders`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                // Sort orders newest first
                setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            } catch (error) {
                console.error("Failed to fetch order history", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderHistory();
    }, [user, navigate]);

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/orders/${reviewingOrder._id}/review`, {
                rating,
                reviewText
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // Update local order list
            setOrders(orders.map(o => o._id === reviewingOrder._id ? data : o));
            setReviewModalOpen(false);
            setReviewingOrder(null);
        } catch (error) {
            console.error("Failed to submit review", error);
        }
    };

    if (!user) return null;

    return (
        <div className="pt-24 pb-20 bg-[#F9F9F9] min-h-screen">
            <div className="container mx-auto px-6 max-w-5xl">

                {/* Profile Header */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-orange-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary/20">
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-secondary">{user.name}</h1>
                            <p className="text-gray-500">{user.email}</p>
                            <span className="inline-block mt-2 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                Active Member
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-500 px-6 py-2.5 rounded-full font-medium transition-colors border border-gray-200"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-secondary">Order History</h2>
                    <span className="text-gray-500 font-medium">{orders.length} Orders</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Package size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No past orders</h3>
                        <p className="text-gray-500 mb-6">You haven't ordered anything yet. Let's fix that!</p>
                        <button onClick={() => navigate('/menu')} className="bg-primary text-white px-8 py-3 rounded-full hover:bg-orange-600 transition-colors shadow-lg shadow-primary/20 font-bold">
                            Explore Menu
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${order.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-primary/10 text-primary'}`}>
                                            {order.status === 'Completed' ? <CheckCircle size={24} /> : <Clock size={24} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 flex items-center gap-2">
                                                Order #{order._id.slice(-6).toUpperCase()}
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'Out for Delivery' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </p>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Total Amount</p>
                                            <p className="text-2xl font-black text-secondary">₹{order.totalAmount.toLocaleString()}</p>
                                        </div>
                                        {/* Review Rendering Section */}
                                        {order.status === 'Completed' && !order.rating && (
                                            <button
                                                onClick={() => { setReviewingOrder(order); setRating(5); setReviewText(''); setReviewModalOpen(true); }}
                                                className="text-sm font-bold text-primary hover:text-white hover:bg-primary border border-primary px-4 py-1.5 rounded-full transition-colors"
                                            >
                                                Rate Order
                                            </button>
                                        )}
                                        {order.rating && (
                                            <div className="flex flex-col items-end mt-1">
                                                <div className="flex items-center text-yellow-500 mb-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={14} fill={i < order.rating ? "currentColor" : "none"} />
                                                    ))}
                                                </div>
                                                {order.reviewText && <p className="text-xs text-gray-500 italic max-w-[200px] truncate">"{order.reviewText}"</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50/50 flex flex-col md:flex-row gap-8">
                                    <div className="flex-grow">
                                        <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Items Ordered</h4>
                                        <ul className="space-y-2">
                                            {order.items.map((item, idx) => (
                                                <li key={idx} className="flex justify-between text-sm">
                                                    <span className="text-gray-600"><span className="font-bold text-gray-400 mr-2">{item.quantity}x</span> {item.product?.name || 'Unknown Item'}</span>
                                                    <span className="text-gray-800 font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {order.deliveryAddress && (
                                        <div className="md:w-64">
                                            <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Delivered To</h4>
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                                <p>
                                                    <span className="block font-medium text-gray-800 mb-1">
                                                        {order.deliveryAddress.houseNumber ? `${order.deliveryAddress.houseNumber}, ` : ''}
                                                        {order.deliveryAddress.street}
                                                    </span>
                                                    {order.deliveryAddress.landmark && (
                                                        <span className="block text-xs italic text-gray-500 mb-0.5">Near {order.deliveryAddress.landmark}</span>
                                                    )}
                                                    {order.deliveryAddress.city}, {order.deliveryAddress.zipCode}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {reviewModalOpen && reviewingOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative">
                        <button onClick={() => setReviewModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Rate your Order</h2>
                        <p className="text-gray-500 mb-6 text-sm">Order #{reviewingOrder._id.slice(-6).toUpperCase()}</p>

                        <form onSubmit={submitReview} className="space-y-6">
                            <div className="flex justify-center gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`transition-colors p-1 ${rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                    >
                                        <Star size={40} fill={rating >= star ? "currentColor" : "none"} />
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Write a Review (Optional)</label>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-28"
                                    placeholder="How was the food and delivery?"
                                ></textarea>
                            </div>

                            <button type="submit" className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                                Submit Review
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
