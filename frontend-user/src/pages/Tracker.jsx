import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChefHat, Bike, MapPin, Phone } from 'lucide-react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001'');

// Create custom icons for Leaflet using Lucide React styles
const createIcon = (color, bg) => L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div class="relative flex items-center justify-center w-10 h-10">
             <div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${bg}; animation-duration: 2s;"></div>
             <div class="relative rounded-full flex items-center justify-center w-10 h-10 border-2 border-white shadow-md z-10" style="background-color: ${bg};">
               <div class="rounded-full w-4 h-4" style="background-color: ${color};"></div>
             </div>
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const storeIcon = createIcon('#FF4500', '#FFF3E0'); // Primary orange
const userIcon = createIcon('#3b82f6', '#EFF6FF'); // Blue
const driverIcon = createIcon('#10B981', '#D1FAE5'); // Green for Driver

const statuses = [
    { id: 'received', label: 'Order Received', icon: CheckCircle2, time: '10:45 AM' },
    { id: 'preparing', label: 'Preparing', icon: ChefHat, time: '10:50 AM' },
    { id: 'delivering', label: 'Out for Delivery', icon: Bike, time: '11:15 AM' },
    { id: 'delivered', label: 'Delivered', icon: MapPin, time: 'Est. 11:30 AM' },
];

export default function Tracker() {
    const [currentStep, setCurrentStep] = useState(0);
    const [orderId, setOrderId] = useState('');
    const [orderDetails, setOrderDetails] = useState(null);
    const [storeSettings, setStoreSettings] = useState(null);
    const [hasOrders, setHasOrders] = useState(true);
    const [driverLocation, setDriverLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dynamicEta, setDynamicEta] = useState(15);

    // Dynamic ETA tick down simulation for 'Out for Delivery'
    useEffect(() => {
        if (currentStep === 2 && dynamicEta > 0) {
            const timer = setInterval(() => {
                setDynamicEta(prev => Math.max(0, prev - 1));
            }, 60000); // decrement every minute
            return () => clearInterval(timer);
        }
    }, [currentStep, dynamicEta]);

    useEffect(() => {
        const fetchOrderStatus = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('cravebite_user'));
                if (!user?.token) return;

                const { data } = await axios.get(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001''}/api/orders/myorders', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });

                if (data && data.length > 0) {
                    setHasOrders(true);
                    // Get the most recent order placing it at the end of the array
                    const latestOrder = data[data.length - 1];
                    setOrderId(latestOrder._id.slice(-6).toUpperCase());
                    setOrderDetails(latestOrder);

                    if (latestOrder.driverLocation) {
                        setDriverLocation(latestOrder.driverLocation);
                    }

                    // Join socket room for this order
                    if (latestOrder._id) {
                        socket.emit('joinOrderRoom', latestOrder._id);
                    }

                    switch (latestOrder.status) {
                        case 'New': setCurrentStep(0); break;
                        case 'Cooking': setCurrentStep(1); break;
                        case 'Out for Delivery': setCurrentStep(2); break;
                        case 'Completed': setCurrentStep(3); break;
                        default: setCurrentStep(0);
                    }
                } else {
                    setHasOrders(false);
                }
            } catch (error) {
                console.error('Failed to fetch real-time order status', error);
                setHasOrders(false);
            } finally {
                setIsLoading(false);
            }

            try {
                // Fetch the Global Store Location Settings continuously
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001''}/api/settings');
                if (data && data.storeLocation) {
                    setStoreSettings(data);
                }
            } catch (error) {
                console.error("Failed to fetch store settings", error);
            }
        };

        // Fetch immediately and poll every 3 seconds
        fetchOrderStatus();
        const interval = setInterval(fetchOrderStatus, 3000);

        // Socket listener for driver location
        socket.on('locationUpdated', (data) => {
            console.log("Driver Moved to", data);
            setDriverLocation({ lat: parseFloat(data.lat), lng: parseFloat(data.lng) });
        });

        // Socket listener for real-time status updates from backend simulation
        socket.on('orderStatusUpdated', (data) => {
            console.log("Order status updated:", data.status);
            switch (data.status) {
                case 'New': setCurrentStep(0); break;
                case 'Cooking': setCurrentStep(1); break;
                case 'Out for Delivery': setCurrentStep(2); break;
                case 'Completed': setCurrentStep(3); break;
                default: break;
            }
        });

        return () => {
            clearInterval(interval);
            socket.off('locationUpdated');
            socket.off('orderStatusUpdated');
        };
    }, []);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9] pt-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
    }

    if (!hasOrders) {
        return (
            <div className="pt-32 pb-20 min-h-[80vh] flex flex-col items-center justify-center bg-[#F9F9F9]">
                <div className="bg-white p-6 rounded-full shadow-sm mb-6 border border-gray-100">
                    <Bike size={64} className="text-gray-300" />
                </div>
                <h2 className="text-2xl font-bold text-secondary mb-2">No Active Orders</h2>
                <p className="text-gray-500 mb-8 max-w-sm text-center">You haven't placed any orders recently. When you do, you can track their journey right here.</p>
                <a href="/menu" className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-primary/20">
                    Browse Menu
                </a>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-20 bg-[#F9F9F9] min-h-screen">
            <div className="container mx-auto px-6 max-w-5xl">
                <h1 className="text-3xl font-bold text-secondary mb-8">Order Tracking</h1>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    {/* Live Map View */}
                    <div className="h-[400px] w-full relative z-0">
                        {storeSettings?.storeLocation?.lat || orderDetails?.deliveryAddress?.lat ? (
                            <MapContainer
                                center={[
                                    driverLocation?.lat || storeSettings?.storeLocation?.lat || orderDetails?.deliveryAddress?.lat,
                                    driverLocation?.lng || storeSettings?.storeLocation?.lng || orderDetails?.deliveryAddress?.lng
                                ]}
                                zoom={14}
                                scrollWheelZoom={false}
                                className="w-full h-full z-0"
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {storeSettings?.storeLocation?.lat && storeSettings?.storeLocation?.lng && (
                                    <Marker
                                        position={[storeSettings.storeLocation.lat, storeSettings.storeLocation.lng]}
                                        icon={storeIcon}
                                    >
                                        <Popup>
                                            <strong>{storeSettings?.storeLocation?.name || 'Restaurant'}</strong><br />
                                            Preparing your order.
                                        </Popup>
                                    </Marker>
                                )}
                                {orderDetails?.deliveryAddress?.lat && orderDetails?.deliveryAddress?.lng && (
                                    <Marker
                                        position={[orderDetails.deliveryAddress.lat, orderDetails.deliveryAddress.lng]}
                                        icon={userIcon}
                                    >
                                        <Popup>
                                            <strong>Delivery Location</strong><br />
                                            {orderDetails.deliveryAddress.street}
                                        </Popup>
                                    </Marker>
                                )}
                                {driverLocation?.lat && driverLocation?.lng && (
                                    <Marker
                                        position={[driverLocation.lat, driverLocation.lng]}
                                        icon={driverIcon}
                                    >
                                        <Popup>
                                            <strong>Alex Driver</strong><br />
                                            Current Location
                                        </Popup>
                                    </Marker>
                                )}
                            </MapContainer>
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <p className="text-gray-500 font-medium">GPS Location Data Unavailable</p>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none z-[1000]" />
                    </div>

                    <div className="p-8 md:p-12 relative z-20 bg-white">
                        <div className="flex flex-col md:flex-row justify-between gap-12">

                            {/* Timeline */}
                            <div className="flex-grow">
                                <h3 className="font-bold text-xl mb-8">Order Status</h3>
                                <div className="relative">
                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100" />

                                    <div className="space-y-8">
                                        {statuses.map((step, idx) => {
                                            const isActive = idx === currentStep;
                                            const isPast = idx < currentStep;
                                            const Icon = step.icon;

                                            return (
                                                <div key={step.id} className="flex gap-6 relative z-10">
                                                    <motion.div
                                                        initial={{ scale: 0.8 }}
                                                        animate={{ scale: isActive || isPast ? 1 : 0.8 }}
                                                        className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors ${isPast ? 'bg-primary text-white' :
                                                            isActive ? 'bg-primary text-white animate-pulse' :
                                                                'bg-gray-100 text-gray-400'
                                                            }`}
                                                    >
                                                        <Icon size={20} />
                                                    </motion.div>
                                                    <div className={`pt-2 transition-colors ${isActive ? 'text-secondary' : isPast ? 'text-gray-700' : 'text-gray-400'}`}>
                                                        <h4 className="font-bold text-lg">{step.label}</h4>
                                                        <p className="text-sm">{step.time}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Order Items Summary */}
                            {orderDetails?.items && orderDetails.items.length > 0 && (
                                <div className="mt-12 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <h3 className="font-bold text-xl mb-6">Order Summary</h3>
                                    <div className="space-y-4">
                                        {orderDetails.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex-shrink-0 w-4 h-4 border-2 flex items-center justify-center rounded-sm ${item.product?.isVeg !== false ? 'border-green-600' : 'border-red-600'}`}>
                                                        <div className={`w-2 h-2 rounded-full ${item.product?.isVeg !== false ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                                    </div>
                                                    <span className="font-bold text-gray-800">{item.product?.name || 'Unknown Item'}</span>
                                                    <span className="text-gray-500 text-sm font-medium bg-gray-100 px-2 py-0.5 rounded-lg">x{item.quantity}</span>
                                                </div>
                                                <span className="font-bold text-secondary">₹{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}

                                        <div className="h-[1px] bg-gray-200 w-full my-4" />
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-600 text-sm">Total Paid</span>
                                            <span className="font-extrabold text-xl text-primary">₹{orderDetails.totalAmount?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Delivery Info */}
                            <div className="w-full md:w-80 bg-[#F9F9F9] p-6 rounded-2xl h-fit border border-gray-100">
                                <h3 className="font-bold text-lg mb-4">Delivery Details</h3>
                                <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-secondary">Alex Driver</h4>
                                        <p className="text-sm text-gray-500">4.9 ★ (1,240 deliveries)</p>
                                    </div>
                                    <button className="ml-auto bg-green-100 text-green-600 p-3 rounded-full hover:bg-green-200 transition-colors">
                                        <Phone size={20} />
                                    </button>
                                </div>
                                <div className="space-y-3 text-sm text-gray-600 bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                                    {/* Pulse Animation Background for Delivery */}
                                    {currentStep === 2 && (
                                        <div className="absolute inset-0 bg-primary/5 animate-pulse z-0"></div>
                                    )}
                                    <div className="relative z-10">
                                        <p><span className="font-medium text-secondary">Order ID:</span> #CRV-{orderId || 'PENDING'}</p>
                                        <p><span className="font-medium text-secondary">Status:</span> {currentStep === 0 ? 'Waiting for restaurant' : currentStep === 1 ? 'Under preparation' : currentStep === 2 ? 'Out for Delivery' : 'Delivered'}</p>
                                        <p><span className="font-medium text-secondary">ETA:</span> {currentStep < 3 ? <span className="font-bold text-primary">{dynamicEta} mins</span> : 'Completed'}</p>
                                    </div>

                                    <div className="h-[1px] bg-gray-100 w-full my-1" />

                                    <div>
                                        <span className="font-medium text-secondary text-xs uppercase tracking-wider block mb-1">Store Location</span>
                                        <p className="text-gray-800 font-medium">{storeSettings?.storeLocation?.name || 'CraveBite Kitchen'}</p>
                                        <p className="text-gray-500">
                                            {storeSettings?.storeLocation?.street ? `${storeSettings.storeLocation.street}, ` : ''}
                                            {storeSettings?.storeLocation?.area ? `${storeSettings.storeLocation.area}, ` : ''}
                                            {storeSettings?.storeLocation?.city ? `${storeSettings.storeLocation.city}, ` : ''}
                                            {storeSettings?.storeLocation?.state ? `${storeSettings.storeLocation.state} ` : ''}
                                            {storeSettings?.storeLocation?.zipCode ? storeSettings.storeLocation.zipCode : ''}
                                        </p>
                                    </div>

                                    <div className="h-[1px] bg-gray-100 w-full my-1" />

                                    <div>
                                        <span className="font-medium text-secondary text-xs uppercase tracking-wider block mb-1">Delivery Address</span>
                                        <p className="text-gray-800 font-medium">
                                            {orderDetails?.deliveryAddress?.houseNumber ? `${orderDetails.deliveryAddress.houseNumber}, ` : ''}
                                            {orderDetails?.deliveryAddress?.street || 'Fetching address...'}
                                        </p>
                                        {orderDetails?.deliveryAddress?.landmark && (
                                            <p className="text-gray-500 text-xs italic mb-1">Near {orderDetails.deliveryAddress.landmark}</p>
                                        )}
                                        <p className="text-gray-500">
                                            {orderDetails?.deliveryAddress?.city} {orderDetails?.deliveryAddress?.zipCode}
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
