import { useState, useEffect } from 'react';
import { Tag, Plus, Check, X } from 'lucide-react';
import axios from 'axios';

export default function Discounts() {
    const [coupons, setCoupons] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCoupon, setNewCoupon] = useState({ code: '', discountPercentage: 10, expiryDate: '' });

    const fetchCoupons = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001''}/api/coupons');
            setCoupons(data);
        } catch (error) {
            console.error('Error fetching coupons', error);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const toggleStatus = async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/coupons/${id}/toggle`, {}, {
                headers: { Authorization: `Bearer FAKE_TOKEN` }
            });
            fetchCoupons();
        } catch (error) {
            console.error('Error toggling coupon', error);
        }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001''}/api/coupons', newCoupon, {
                headers: { Authorization: `Bearer FAKE_TOKEN` }
            });
            setIsModalOpen(false);
            setNewCoupon({ code: '', discountPercentage: 10, expiryDate: '' });
            fetchCoupons();
        } catch (error) {
            console.error('Error creating coupon', error);
            alert('Failed to create coupon');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Discount Engine</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                    <Plus size={20} /> Generate Code
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {coupons.map(coupon => (
                    <div key={coupon._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full ${coupon.active ? 'bg-green-500' : 'bg-gray-300'} transition-colors`} />

                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-orange-50 text-primary rounded-xl">
                                <Tag size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-800 tracking-wider bg-gray-100 border border-gray-200 px-3 py-1 rounded inline-block">{coupon.code}</h3>
                                <p className="text-sm text-gray-500 mt-2 font-medium">Valid until {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm text-gray-500 mb-1 font-medium">Discount Amount</p>
                                <p className="text-3xl font-bold text-gray-800">{coupon.discountPercentage}% <span className="text-sm font-normal text-gray-500">OFF</span></p>
                            </div>

                            <button
                                onClick={() => toggleStatus(coupon._id)}
                                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors border ${coupon.active ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'
                                    }`}
                            >
                                {coupon.active ? <><X size={16} /> Deactivate</> : <><Check size={16} /> Activate</>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add New Coupon Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Generate New Coupon</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateCoupon} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                                <input required type="text" placeholder="e.g. SUMMER50" value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none uppercase" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                                    <input required type="number" min="1" max="100" value={newCoupon.discountPercentage} onChange={e => setNewCoupon({ ...newCoupon, discountPercentage: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                    <input required type="date" value={newCoupon.expiryDate} onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary hover:bg-orange-600 text-white py-3 rounded-xl font-medium mt-6 transition-colors shadow-lg">
                                Create Coupon
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
