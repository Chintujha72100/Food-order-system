import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowRight, CreditCard, CheckCircle } from 'lucide-react';
import useCartStore from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
export default function Cart() {
    const { cart, removeFromCart, clearCart, updateQuantity } = useCartStore();
    const { user, setIsAuthModalOpen } = useAuth();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [coupon, setCoupon] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });
    const [deliveryAddress, setDeliveryAddress] = useState({ houseNumber: '', street: '', landmark: '', city: '', zipCode: '', lat: '', lng: '' });
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLocating, setIsLocating] = useState(false);

    // New Swiggy/Zomato features
    const [orderType, setOrderType] = useState('Delivery');
    const [tipAmount, setTipAmount] = useState(0);
    const [cookingInstructions, setCookingInstructions] = useState('');
    const [cutleryOptOut, setCutleryOptOut] = useState(false);
    const [customTip, setCustomTip] = useState('');

    const navigate = useNavigate();

    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const discountAmount = subtotal * discount;
    const discountedSubtotal = subtotal - discountAmount;

    // Calculate dynamic tax sum based on individual product GST rates, defaulting to 5% for old products
    const tax = cart.reduce((acc, item) => {
        const itemEffectivePrice = item.product.price * item.quantity * (1 - discount);
        const itemGst = itemEffectivePrice * ((item.product.gstRate ?? 5) / 100);
        return acc + itemGst;
    }, 0);

    const deliveryFee = discountedSubtotal > 0 && orderType === 'Delivery' ? 40 : 0; // ₹40 delivery, FREE for Pickup
    const total = discountedSubtotal + tax + deliveryFee + tipAmount;

    const applyCoupon = async () => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001''}/api/coupons/validate', { code: coupon });
            setDiscount(data.discountPercentage / 100);
            setCouponMessage({ text: `Coupon applied successfully! ${data.discountPercentage}% off.`, type: 'success' });
        } catch (error) {
            setDiscount(0);
            setCouponMessage({ text: error.response?.data?.message || 'Invalid or expired coupon.', type: 'error' });
        }
    };

    const handleCheckout = async () => {
        if (!user) {
            alert("Please log in to complete your checkout.");
            setIsAuthModalOpen(true);
            return;
        }

        setIsCheckingOut(true);

        try {
            // Basic validation for Delivery
            if (orderType === 'Delivery') {
                if (!deliveryAddress.houseNumber || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.zipCode) {
                    alert('Please complete all required fields for the delivery address.');
                    setIsCheckingOut(false);
                    return;
                }
                if (!phoneNumber.trim()) {
                    alert('Please enter your phone number.');
                    setIsCheckingOut(false);
                    return;
                }
            }

            await axios.post(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001''}/api/orders', {
                items: cart.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    price: item.product.price
                })),
                totalAmount: total,
                orderType,
                deliveryAddress: orderType === 'Pickup' ? null : {
                    houseNumber: deliveryAddress.houseNumber,
                    street: deliveryAddress.street,
                    landmark: deliveryAddress.landmark || "",
                    city: deliveryAddress.city,
                    zipCode: deliveryAddress.zipCode,
                    lat: deliveryAddress.lat || null,
                    lng: deliveryAddress.lng || null,
                    phone: phoneNumber
                },
                tipAmount,
                cookingInstructions,
                cutleryOptOut
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // Mock Stripe processing delay
            setTimeout(() => {
                setPaymentSuccess(true);
                setTimeout(() => {
                    clearCart();
                    navigate('/tracker');
                }, 2000);
            }, 1500);

        } catch (error) {
            console.error("Order failed", error);
            setIsCheckingOut(false);
            alert("Failed to place order. Please try again.");
        }
    };

    const fetchCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                // Use OpenStreetMap Nominatim for free Reverse Geocoding
                const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);

                if (data && data.address) {
                    setDeliveryAddress(prev => ({
                        ...prev,
                        city: data.address.city || data.address.town || data.address.village || data.address.county || '',
                        zipCode: data.address.postcode || '',
                        street: data.address.road || data.address.suburb || data.address.neighbourhood || prev.street, // Auto-fill street/area if available
                        lat: latitude.toString(),
                        lng: longitude.toString()
                        // notice we DO NOT touch prev.houseNumber or prev.landmark.
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch address", error);
                alert("Could not fetch address details automatically.");
            } finally {
                setIsLocating(false);
            }
        }, () => {
            alert("Unable to retrieve your location. Please ensure location permissions are granted.");
            setIsLocating(false);
        });
    };

    if (cart.length === 0 && !paymentSuccess) {
        return (
            <div className="pt-32 pb-20 min-h-[80vh] flex flex-col items-center justify-center bg-[#F9F9F9]">
                <img src="/assets/cravebite_logo.png" alt="Empty Cart" className="w-32 h-32 opacity-20 mb-6 grayscale" />
                <h2 className="text-2xl font-bold text-secondary mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-8">Looks like you haven't made your choice yet.</p>
                <button onClick={() => navigate('/menu')} className="bg-primary text-white px-8 py-3 rounded-full hover:bg-orange-600 transition-colors">
                    Browse Menu
                </button>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-20 bg-[#F9F9F9] min-h-screen">
            <div className="container mx-auto px-6">
                <h1 className="text-4xl font-bold text-secondary mb-10">Your Cart</h1>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Cart Items */}
                    <div className="flex-grow space-y-6">
                        <AnimatePresence>
                            {cart.map((item) => (
                                <motion.div
                                    key={item.product._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20, height: 0 }}
                                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 relative"
                                >
                                    <img src={item.product.imageUrl} alt={item.product.name} className="w-24 h-24 object-cover rounded-2xl" />
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`flex-shrink-0 w-4 h-4 border-2 flex items-center justify-center rounded-sm ${item.product.isVeg !== false ? 'border-green-600' : 'border-red-600'}`}>
                                                <div className={`w-2 h-2 rounded-full ${item.product.isVeg !== false ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                            </div>
                                            <h3 className="font-bold text-xl text-secondary leading-tight">{item.product.name}</h3>
                                        </div>
                                        <p className="text-gray-500">{item.product.category}</p>
                                        <div className="text-lg font-bold mt-2">₹{item.product.price}</div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                        <div className="flex items-center bg-gray-50 rounded-full shadow-inner overflow-hidden border border-gray-100">
                                            <button
                                                onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                                className="px-4 py-2 text-gray-500 hover:text-secondary hover:bg-gray-100 font-bold transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-bold text-gray-800">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                                                className="px-4 py-2 text-primary hover:text-white hover:bg-primary font-bold transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.product._id)}
                                            className="text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors p-3 rounded-full"
                                        >
                                            <Trash2 size={24} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Cooking Instructions & Cutlery */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mt-6 space-y-6">
                            <div>
                                <h3 className="font-bold text-gray-800 mb-2">Any cooking instructions?</h3>
                                <textarea
                                    placeholder="E.g., Make it spicy, no onions..."
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-20"
                                    value={cookingInstructions}
                                    onChange={(e) => setCookingInstructions(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="flex items-center justify-between bg-green-50/50 p-4 rounded-xl border border-green-100">
                                <div className="flex flex-col">
                                    <span className="font-bold text-green-800 text-sm">Opt-out of Cutlery</span>
                                    <span className="text-xs text-green-600">Help protect the environment by reducing plastic waste.</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" value="" className="sr-only peer" checked={cutleryOptOut} onChange={() => setCutleryOptOut(!cutleryOptOut)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        </div>

                    </div>

                    {/* Order Summary & Checkout */}
                    <div className="lg:w-[400px]">
                        <div className="bg-white rounded-t-3xl shadow-xl border-x border-t border-gray-100 sticky top-32 relative pb-8">

                            {/* Zig-Zag bottom edge for receipt look */}
                            <div className="absolute -bottom-3 left-0 right-0 h-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiI+PHBvbHlnb24gcG9pbnRzPSIwLDAgNiLDEyIDEyLDAgMTIsMTIgMCwxMiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] bg-repeat-x drop-shadow-md rotate-180 z-[-1]" />

                            <div className="p-8">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-black text-secondary tracking-tight">RECEIPT</h2>
                                    <p className="text-xs text-gray-400 font-mono tracking-widest mt-1">CRAVEBITE ONLINE ORDER</p>
                                </div>

                                <div className="border-b-2 border-dashed border-gray-200 mb-6" />

                                {/* Order Type Toggle */}
                                <div className="flex bg-gray-50 p-1 rounded-xl mb-6 border border-gray-100">
                                    <button
                                        onClick={() => setOrderType('Delivery')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${orderType === 'Delivery' ? 'bg-white shadow-sm text-primary border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Delivery
                                    </button>
                                    <button
                                        onClick={() => setOrderType('Pickup')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${orderType === 'Pickup' ? 'bg-white shadow-sm text-primary border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Pickup
                                    </button>
                                </div>

                                <div className="space-y-3 text-gray-600 mb-6 font-mono text-sm">
                                    <div className="flex justify-between">
                                        <span>SUBTOTAL</span>
                                        <span className="font-medium text-secondary">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>DISCOUNT ({(discount * 100).toFixed(0)}%)</span>
                                            <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>TAX (GST)</span>
                                        <span className="font-medium text-secondary">₹{tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>DELIVERY FEE</span>
                                        <span className="font-medium text-secondary">₹{deliveryFee.toFixed(2)}</span>
                                    </div>
                                    {tipAmount > 0 && (
                                        <div className="flex justify-between text-orange-600">
                                            <span>DRIVER TIP</span>
                                            <span className="font-medium text-orange-600">₹{tipAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-b-2 border-dashed border-gray-200 mb-6" />

                                {/* Tip Section */}
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">Tip your delivery partner</label>
                                    <div className="flex gap-2 mb-2">
                                        {[10, 20, 30].map(amt => (
                                            <button
                                                key={amt}
                                                onClick={() => { setTipAmount(amt); setCustomTip(''); }}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tipAmount === amt && customTip === '' ? 'border border-primary bg-primary/10 text-primary scale-105 shadow-sm' : 'border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 bg-gray-50'}`}
                                            >
                                                ₹{amt}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number" min="0" placeholder="Custom Tip Amount"
                                            value={customTip}
                                            onChange={(e) => { setCustomTip(e.target.value); setTipAmount(Number(e.target.value)); }}
                                            className="flex-grow border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-50 transition-all font-mono"
                                        />
                                        {tipAmount > 0 && (
                                            <button onClick={() => { setTipAmount(0); setCustomTip(''); }} className="text-xs text-red-500 font-bold px-3 py-2.5 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                                                CLEAR
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="border-b border-gray-100 mb-6" />

                                {/* Coupon Section */}
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">Promo Code</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter code (e.g. SAVE20)"
                                            value={coupon}
                                            onChange={(e) => setCoupon(e.target.value)}
                                            className="flex-grow border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-50 uppercase font-mono tracking-wider"
                                        />
                                        <button
                                            onClick={applyCoupon}
                                            className="bg-gray-800 hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm">
                                            Apply
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {couponMessage.text && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className={`text-xs mt-2 font-bold ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}
                                            >
                                                {couponMessage.text}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Delivery Address Section (Hidden if Pickup) */}
                                {orderType === 'Delivery' && (
                                    <div className="mb-6 bg-blue-50/50 border border-blue-100 p-5 rounded-2xl relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-400" />
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="block text-xs font-black text-blue-900 uppercase tracking-wide">Delivery Address</label>
                                            <button
                                                onClick={fetchCurrentLocation}
                                                disabled={isLocating}
                                                className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-all px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm"
                                            >
                                                <svg className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                {isLocating ? 'LOCATING...' : 'GPS AUTO-FILL'}
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="House / Flat No."
                                                    value={deliveryAddress.houseNumber}
                                                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, houseNumber: e.target.value })}
                                                    className="w-1/3 border border-blue-200/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none bg-white shadow-inner"
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Street or Area"
                                                    value={deliveryAddress.street}
                                                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                                                    className="w-2/3 border border-blue-200/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none bg-white shadow-inner"
                                                    required
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Nearby Landmark (Optional)"
                                                value={deliveryAddress.landmark}
                                                onChange={(e) => setDeliveryAddress({ ...deliveryAddress, landmark: e.target.value })}
                                                className="w-full border border-blue-200/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none bg-white shadow-inner"
                                            />
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="City"
                                                    value={deliveryAddress.city}
                                                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                                                    className="w-1/2 border border-blue-200/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none bg-white shadow-inner"
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Zip Code"
                                                    value={deliveryAddress.zipCode}
                                                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zipCode: e.target.value })}
                                                    className="w-1/2 border border-blue-200/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none bg-white shadow-inner"
                                                    required
                                                />
                                            </div>
                                            <input
                                                type="tel"
                                                placeholder="Phone Number (e.g. +91 9876543210)"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                className="w-full border border-blue-200/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 outline-none bg-white shadow-inner"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="border-b-2 border-dashed border-gray-400 mt-8 mb-6" />

                                <div className="flex justify-between items-end mb-8">
                                    <span className="text-sm font-black text-secondary tracking-widest">TOTAL</span>
                                    <span className="text-4xl font-black text-primary font-mono tracking-tighter">₹{total.toFixed(2)}</span>
                                </div>

                                {!isCheckingOut && !paymentSuccess ? (
                                    <button
                                        onClick={handleCheckout}
                                        className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 group shadow-xl shadow-black/20 hover:shadow-black/40 hover:-translate-y-1"
                                    >
                                        <span>Place Order</span>
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ) : paymentSuccess ? (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="bg-green-50 text-green-600 p-6 rounded-xl flex flex-col items-center text-center border border-green-200 shadow-sm"
                                    >
                                        <CheckCircle size={48} className="mb-2" />
                                        <h3 className="text-xl font-bold">Payment Successful!</h3>
                                        <p className="text-sm mt-1">Redirecting to tracker...</p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="bg-gray-50 border border-gray-200 p-6 rounded-xl relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                                        <div className="flex flex-col items-center text-center relative z-10">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                                <CreditCard className="text-blue-500 animate-bounce" size={24} />
                                            </div>
                                            <h3 className="font-bold text-secondary">Processing Securely</h3>
                                            <p className="text-sm text-gray-500 mt-1">Please do not close this window...</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
