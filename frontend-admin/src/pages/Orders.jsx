import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import axios from 'axios';
import { Star, MapPin } from 'lucide-react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001'');

// Initial Empty Shape
const emptyColumns = {
    New: [],
    Cooking: [],
    'Out for Delivery': [],
    Completed: []
};

// Sortable Item Component
const SortableOrderCard = ({ id, order, onSimulateLocation }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative z-10">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-sm">#{id.slice(-6).toUpperCase()}</span>
                    {(order.orderType === 'Pickup') ? (
                        <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Pickup</span>
                    ) : (
                        <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-100">Delivery</span>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'Out for Delivery' ? 'bg-purple-100 text-purple-700' :
                            order.status === 'Cooking' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                        }`}>
                        {order.status || 'New'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    
                    {order.status === 'Out for Delivery' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSimulateLocation(order); }}
                            className="mt-1 flex items-center gap-1 text-[9px] bg-red-50 text-red-600 hover:bg-red-100 px-1.5 py-0.5 rounded border border-red-200 transition-colors pointer-events-auto"
                        >
                            <MapPin size={10} /> Simulate GPS
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col mb-2 border-b border-gray-50 pb-2">
                <h4 className="font-bold text-gray-900 leading-tight block truncate w-full" title={order.user?.name || 'Guest User'}>
                    {order.user?.name || 'Guest User'}
                </h4>
                {order.user?.email && (
                    <span className="text-xs text-primary font-medium truncate w-full" title={order.user.email}>
                        {order.user.email}
                    </span>
                )}
            </div>

            {order.deliveryAddress && (
                <div className="bg-orange-50/50 border border-orange-100 p-2.5 rounded-lg mb-3 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <div className="flex flex-col text-xs text-gray-600">
                            <span className="font-medium text-gray-800 line-clamp-1" title={`${order.deliveryAddress.houseNumber ? order.deliveryAddress.houseNumber + ', ' : ''}${order.deliveryAddress.street || 'No address'}${order.deliveryAddress.landmark ? ` (Near ${order.deliveryAddress.landmark})` : ''}`}>
                                {order.deliveryAddress.houseNumber ? `${order.deliveryAddress.houseNumber}, ` : ''}{order.deliveryAddress.street || 'No Address Provided'}
                            </span>
                            {order.deliveryAddress.landmark && <span className="text-[10px] text-gray-500 italic block leading-tight mb-0.5">Near {order.deliveryAddress.landmark}</span>}
                            <span>{(order.deliveryAddress.city || '')} {(order.deliveryAddress.zipCode || '')}</span>
                        </div>
                    </div>
                    {order.deliveryAddress.lat && order.deliveryAddress.lng && (
                        <a
                            href={`https://www.google.com/maps?q=${order.deliveryAddress.lat},${order.deliveryAddress.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white border border-gray-200 hover:border-orange-300 text-orange-600 text-[10px] font-bold py-1 px-2 rounded flex items-center justify-center gap-1 transition-colors w-full"
                        >
                            Open in Google Maps
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                    )}
                </div>
            )}

            {order.orderType === 'Pickup' && (
                <div className="bg-purple-50/50 border border-purple-100 p-2.5 rounded-lg mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    <span className="text-xs font-bold text-purple-800">Customer will pick this up</span>
                </div>
            )}

            {order.rating && (
                <div className="bg-yellow-50/50 border border-yellow-100 p-2.5 rounded-lg mb-3">
                    <div className="flex items-center text-yellow-500 mb-1 gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} fill={i < order.rating ? "currentColor" : "none"} />
                        ))}
                        <span className="text-[10px] text-gray-500 ml-1 font-medium">Customer Review</span>
                    </div>
                    {order.reviewText && (
                        <p className="text-xs text-gray-700 italic line-clamp-2 mt-1">"{order.reviewText}"</p>
                    )}
                </div>
            )}

            {order.items && order.items.map && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {order.items.map(i => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ')}
                </p>
            )}
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                <span className="text-xs text-gray-500 font-medium">Total</span>
                <span className="font-bold text-primary">₹{order.totalAmount}</span>
            </div>
        </div>
    );
};

const DroppableColumn = ({ id, items, title, onSimulateLocation }) => {
    const { setNodeRef } = useDroppable({ id });
    const getColColor = (name) => {
        switch (name) {
            case 'New': return 'border-blue-500 bg-blue-50/50';
            case 'Cooking': return 'border-orange-500 bg-orange-50/50';
            case 'Out for Delivery': return 'border-purple-500 bg-purple-50/50';
            default: return 'border-green-500 bg-green-50/50';
        }
    };

    return (
        <div className={`min-w-[320px] max-w-[320px] rounded-2xl flex flex-col border-t-4 border-gray-100 bg-gray-50/80 ${getColColor(id)} shadow-sm`}>
            <div className="p-4 flex justify-between items-center bg-white/50 rounded-t-xl mb-2 backdrop-blur-sm">
                <h3 className="font-bold text-gray-800 tracking-wide">{title}</h3>
                <span className="bg-white shadow-sm text-gray-600 text-xs font-bold px-2 py-1 rounded-lg border border-gray-100">{items.length}</span>
            </div>

            <div ref={setNodeRef} className="flex-grow p-3 overflow-y-auto">
                <SortableContext id={id} items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map(order => (
                        <SortableOrderCard key={order.id} id={order.id} order={order} onSimulateLocation={onSimulateLocation} />
                    ))}
                    {items.length === 0 && <div className="h-20 w-full border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-sm text-gray-400">Drop orders here</div>}
                </SortableContext>
            </div>
        </div>
    );
};

export default function Orders() {
    const [columns, setColumns] = useState(emptyColumns);
    const [loading, setLoading] = useState(true);
    const [simulatingOrder, setSimulatingOrder] = useState(null);

    // Map Click Handler for Simulation
    const LocationSelector = () => {
        useMapEvents({
            click(e) {
                if (simulatingOrder) {
                    const newLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
                    setSimulatingOrder(prev => ({ ...prev, driverLocation: newLocation }));

                    // Emit socket update
                    socket.emit('updateLocation', {
                        orderId: simulatingOrder._id,
                        lat: newLocation.lat.toString(),
                        lng: newLocation.lng.toString()
                    });

                    // Optionally update DB for persistence
                    axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/orders/${simulatingOrder._id}/location`, { lat: newLocation.lat, lng: newLocation.lng }, mockAuthConfig).catch(() => { });
                }
            },
        });
        return null;
    };

    // Mock Admin Authentication Header
    // (In production, grab this from Zustand auth state)
    const mockAuthConfig = {
        headers: { Authorization: `Bearer FAKE_TOKEN` }
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Warning: Endpoint requires auth, for demo we rely on simplified controllers or unprotected test route 
                // Alternatively, create a guest-friendly debug route, but keeping original structure for now.
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001''}/api/orders', {
                    // Injecting mock auth since we don't have login connected
                }).catch(() => ({ data: [] })); // Fail gracefully for mock demo

                // Group by status
                const grouped = { New: [], Cooking: [], 'Out for Delivery': [], Completed: [] };
                data.forEach(order => {
                    const status = order.status || 'New';
                    if (grouped[status]) {
                        grouped[status].push({ ...order, id: order._id }); // DND requires `id` 
                    }
                });
                setColumns(grouped);
            } catch (error) {
                console.error("Failed to load orders");
                // Set empty columns on error so it doesn't stay loading
                setColumns({ New: [], Cooking: [], 'Out for Delivery': [], Completed: [] });
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        const sourceCol = active.data.current?.sortable.containerId || Object.keys(columns).find(key => columns[key].some(item => item.id === active.id));
        const destCol = over.data.current?.sortable.containerId || over.id;

        if (!sourceCol || !destCol || (sourceCol === destCol && active.id === over.id)) return;

        // Perform Local Optimistic Update
        setColumns(prev => {
            const sourceItems = [...prev[sourceCol]];
            const destItems = [...prev[destCol]];
            const sourceIndex = sourceItems.findIndex(i => i.id === active.id);
            const [movedItem] = sourceItems.splice(sourceIndex, 1);

            const destIndex = over.id === destCol ? destItems.length : destItems.findIndex(i => i.id === over.id);
            movedItem.status = destCol; // Update local status
            destItems.splice(destIndex, 0, movedItem);

            return { ...prev, [sourceCol]: sourceItems, [destCol]: destItems };
        });

        // Patch to MongoDB
        try {
            await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/orders/${active.id}/status`, { status: destCol }, mockAuthConfig).catch(e => console.log("Mock API Mode Active"));
        } catch (error) {
            console.error("Failed to update status in DB");
        }
    };

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Order Kanban</h1>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="flex gap-6 h-[calc(100vh-140px)] overflow-x-auto pb-4">
                    {Object.entries(columns).map(([colName, items]) => (
                        <DroppableColumn key={colName} id={colName} title={colName} items={items} onSimulateLocation={setSimulatingOrder} />
                    ))}
                </div>
            </DndContext>

            {simulatingOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-gray-800">Simulate Driver GPS</h3>
                                <p className="text-xs text-gray-500">Click anywhere on the map to update the driver's location for Order #{simulatingOrder._id.slice(-6).toUpperCase()}</p>
                            </div>
                            <button onClick={() => setSimulatingOrder(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="h-96 w-full relative">
                            <MapContainer
                                center={[
                                    simulatingOrder.driverLocation?.lat || simulatingOrder.deliveryAddress?.lat || 28.6139,
                                    simulatingOrder.driverLocation?.lng || simulatingOrder.deliveryAddress?.lng || 77.2090
                                ]}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationSelector />
                                {simulatingOrder.driverLocation?.lat && (
                                    <Marker position={[simulatingOrder.driverLocation.lat, simulatingOrder.driverLocation.lng]} />
                                )}
                            </MapContainer>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end">
                            <button onClick={() => setSimulatingOrder(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
