import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, MessageSquare } from 'lucide-react';
import axios from '../utils/axiosInstance';
import toast from 'react-hot-toast';

export default function MenuManagement() {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null); // Track if we are editing
    const [newItem, setNewItem] = useState({ name: '', category: 'Fast Food', price: '', gstRate: 5, imageUrl: '/assets/cravebite_dish_burger.png', inStock: true, isVeg: true });

    // Review management state
    const [reviewModalItem, setReviewModalItem] = useState(null);

    const fetchProducts = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/products`);
            setItems(data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/products/${editingId}`, newItem, {
                    headers: { Authorization: `Bearer FAKE_TOKEN` }
                });
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/products`, newItem, {
                    headers: { Authorization: `Bearer FAKE_TOKEN` }
                });
            }
            setIsModalOpen(false);
            setEditingId(null);
            setNewItem({ name: '', category: 'Fast Food', price: '', gstRate: 5, imageUrl: '/assets/cravebite_dish_burger.png', inStock: true, isVeg: true });
            fetchProducts();
        } catch (error) {
            console.error('Error saving product', error);
        }
    };

    const handleEditClick = (item) => {
        setEditingId(item._id);
        setNewItem({
            name: item.name,
            category: item.category,
            price: item.price,
            gstRate: item.gstRate ?? 5,
            imageUrl: item.imageUrl,
            inStock: item.inStock,
            isVeg: item.isVeg !== false // default true
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this dish?')) {
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/products/${id}`, {
                    headers: { Authorization: `Bearer FAKE_TOKEN` }
                });
                fetchProducts();
                toast.success('Dish deleted');
            } catch (error) {
                console.error('Error deleting product', error);
                toast.error('Failed to delete dish');
            }
        }
    };

    const handleDeleteReview = async (productId, reviewId) => {
        if (window.confirm('Delete this review?')) {
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/products/${productId}/reviews/${reviewId}`, {
                    headers: { Authorization: `Bearer FAKE_TOKEN` }
                });

                // Update local modal state
                if (reviewModalItem && reviewModalItem._id === productId) {
                    setReviewModalItem({
                        ...reviewModalItem,
                        reviews: reviewModalItem.reviews.filter(r => r._id !== reviewId)
                    });
                }

                fetchProducts();
                toast.success('Review deleted successfully');
            } catch (error) {
                console.error('Error deleting review', error);
                toast.error(error.response?.data?.message || 'Failed to delete review');
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
                <button
                    onClick={() => { setEditingId(null); setNewItem({ name: '', category: 'Fast Food', price: '', gstRate: 5, imageUrl: '/assets/cravebite_dish_burger.png', inStock: true, isVeg: true }); setIsModalOpen(true); }}
                    className="bg-primary hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                    <Plus size={20} /> Add New Dish
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text" placeholder="Search menu items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                            <th className="p-4 font-medium">Dish Name</th>
                            <th className="p-4 font-medium">Category</th>
                            <th className="p-4 font-medium">Type</th>
                            <th className="p-4 font-medium">Price</th>
                            <th className="p-4 font-medium">GST</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading menu...</td></tr>
                        )}
                        {!loading && filteredItems.length === 0 && (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">No dishes found.</td></tr>
                        )}
                        {filteredItems.map(item => (
                            <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 font-semibold text-gray-800">
                                    <div className="flex items-center gap-3">
                                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                                        {item.name}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-500">
                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">{item.category}</span>
                                </td>
                                <td className="p-4">
                                    <span className={`flex items-center gap-1.5 text-xs font-bold ${item.isVeg !== false ? 'text-green-600' : 'text-red-500'}`}>
                                        <span className={`w-2 h-2 rounded-full ${item.isVeg !== false ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]'}`}></span>
                                        {item.isVeg !== false ? 'Veg' : 'Non-Veg'}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-700 font-bold">₹{item.price}</td>
                                <td className="p-4 text-gray-500 font-medium">{item.gstRate ?? 5}%</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.inStock ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <button onClick={() => setReviewModalItem(item)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Manage Reviews"><MessageSquare size={18} /></button>
                                    <button onClick={() => handleEditClick(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(item._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add New Dish Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Dish' : 'Add New Dish'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name</label>
                                <input required type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                    <input required type="number" min="0" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                                    <input required type="number" min="0" max="100" value={newItem.gstRate} onChange={e => setNewItem({ ...newItem, gstRate: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                                        <option>Fast Food</option>
                                        <option>Healthy</option>
                                        <option>Asian</option>
                                        <option>Desserts</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Type</label>
                                    <div className="flex gap-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" checked={newItem.isVeg !== false} onChange={() => setNewItem({ ...newItem, isVeg: true })} className="w-4 h-4 text-green-500 focus:ring-green-500" />
                                            <span className="text-sm font-bold text-green-700">Veg</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" checked={newItem.isVeg === false} onChange={() => setNewItem({ ...newItem, isVeg: false })} className="w-4 h-4 text-red-500 focus:ring-red-500" />
                                            <span className="text-sm font-bold text-red-700">Non-Veg</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image Attachment</label>
                                <input type="file" accept="image/*" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setNewItem({ ...newItem, imageUrl: reader.result });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }} className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-gray-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                                {newItem.imageUrl && newItem.imageUrl.startsWith('data:image') && (
                                    <div className="mt-2 text-sm text-green-600 font-medium">Image attached successfully ✔</div>
                                )}
                            </div>
                            <div className="flex items-center mt-2 mb-4">
                                <input type="checkbox" id="inStockCheckbox" checked={newItem.inStock} onChange={e => setNewItem({ ...newItem, inStock: e.target.checked })} className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2" />
                                <label htmlFor="inStockCheckbox" className="ml-2 text-sm font-medium text-gray-700">In Stock Available</label>
                            </div>
                            <button type="submit" className="w-full bg-primary hover:bg-orange-600 text-white py-3 rounded-xl font-medium mt-6 transition-colors shadow-lg">
                                {editingId ? 'Update Dish' : 'Save Dish'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reviews Modal */}
            {reviewModalItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Reviews: {reviewModalItem.name}</h2>
                            <button onClick={() => setReviewModalItem(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>

                        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                            {!reviewModalItem.reviews || reviewModalItem.reviews.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No reviews for this product yet.</p>
                            ) : (
                                reviewModalItem.reviews.map(review => (
                                    <div key={review._id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-start gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-sm text-gray-700">{review.name}</span>
                                                <span className="text-xs text-yellow-500 font-bold bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">⭐ {review.rating}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteReview(reviewModalItem._id, review._id)}
                                            className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors flex-shrink-0"
                                            title="Delete Review"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
