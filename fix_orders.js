const fs = require('fs');

const file = 'frontend-admin/src/pages/Orders.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const SortableOrderCard = \(\{ id, order, onSimulateLocation \}\) => \{[\s\S]*?const DroppableColumn/m;

const replacement = `const SortableOrderCard = ({ id, order, onSimulateLocation }) => {
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
                    <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full \${order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'Out for Delivery' ? 'bg-purple-100 text-purple-700' :
                            order.status === 'Cooking' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                        }\`}>
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
                            <span className="font-medium text-gray-800 line-clamp-1" title={\`\${order.deliveryAddress.houseNumber ? order.deliveryAddress.houseNumber + ', ' : ''}\${order.deliveryAddress.street || 'No address'}\${order.deliveryAddress.landmark ? \` (Near \${order.deliveryAddress.landmark})\` : ''}\`}>
                                {order.deliveryAddress.houseNumber ? \`\${order.deliveryAddress.houseNumber}, \` : ''}{order.deliveryAddress.street || 'No Address Provided'}
                            </span>
                            {order.deliveryAddress.landmark && <span className="text-[10px] text-gray-500 italic block leading-tight mb-0.5">Near {order.deliveryAddress.landmark}</span>}
                            <span>{(order.deliveryAddress.city || '')} {(order.deliveryAddress.zipCode || '')}</span>
                        </div>
                    </div>
                    {order.deliveryAddress.lat && order.deliveryAddress.lng && (
                        <a
                            href={\`https://www.google.com/maps?q=\${order.deliveryAddress.lat},\${order.deliveryAddress.lng}\`}
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
                    {order.items.map(i => \`\${i.quantity}x \${i.product?.name || 'Item'}\`).join(', ')}
                </p>
            )}
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                <span className="text-xs text-gray-500 font-medium">Total</span>
                <span className="font-bold text-primary">₹{order.totalAmount}</span>
            </div>
        </div>
    );
};

const DroppableColumn`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("Done");
