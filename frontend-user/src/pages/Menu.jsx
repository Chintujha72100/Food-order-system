import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Star, Plus, Heart, X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import useCartStore from '../store/cartStore';
import useFavoritesStore from '../store/favoritesStore';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Menu() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('popular');
    const [isVegOnly, setIsVegOnly] = useState(false);
    const [maxPrice, setMaxPrice] = useState(2000); // added max price filter

    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewingProduct, setReviewingProduct] = useState(null);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');

    const addToCart = useCartStore(state => state.addToCart);
    const { favorites, toggleFavorite, isFavorite } = useFavoritesStore();
    const { user, setIsAuthModalOpen } = useAuth();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001''}/api/products');
                setProducts(data);
            } catch (error) {
                console.error('Failed to fetch products', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (user?.token) {
            useFavoritesStore.getState().fetchFavorites(user.token);
        }
    }, [user]);

    const categories = ['All', 'Favorites', 'Fast Food', 'Healthy', 'Asian', 'Desserts'];

    let filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const inStock = p.inStock;
        const matchesVeg = isVegOnly ? p.isVeg !== false : true;
        const matchesPrice = p.price <= maxPrice;

        let matchesCategory = true;
        if (selectedCategory === 'Favorites') {
            matchesCategory = favorites.includes(p._id);
        } else if (selectedCategory !== 'All') {
            matchesCategory = p.category === selectedCategory;
        }

        return matchesSearch && inStock && matchesCategory && matchesVeg && matchesPrice;
    });

    if (sortBy === 'price_low') filtered.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_high') filtered.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/products/${reviewingProduct._id}/reviews`, {
                rating, comment: reviewText
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // Refresh products to show new rating
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001''}/api/products');
            setProducts(data);

            setReviewModalOpen(false);
            setReviewingProduct(null);
            toast.success('Review submitted successfully!');
        } catch (error) {
            console.error('Failed to submit review', error);
            toast.error(error.response?.data?.message || 'Failed to submit review');
        }
    };

    return (
        <div className="pt-24 pb-20 bg-[#F9F9F9] min-h-screen">
            <div className="container mx-auto px-6 max-w-7xl">

                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <h1 className="text-4xl font-bold text-secondary">Our Menu</h1>

                    <div className="flex w-full md:w-auto gap-4 flex-wrap justify-end">
                        <div className="relative flex-grow md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text" placeholder="Search dishes..."
                                className="w-full bg-white border border-gray-100 rounded-full py-3 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-2 shadow-sm">
                            <span className="text-sm font-bold text-gray-700 whitespace-nowrap">Max ₹{maxPrice}</span>
                            <input
                                type="range" min="100" max="2000" step="50"
                                value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
                                className="w-24 accent-primary"
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-2 shadow-sm">
                            <span className="text-sm font-bold text-green-700 whitespace-nowrap">Veg Only</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={isVegOnly} onChange={() => setIsVegOnly(!isVegOnly)} />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>

                        <div className="relative bg-white border border-gray-100 rounded-full px-4 flex items-center shadow-sm text-sm md:text-base py-2">
                            <Filter className="text-gray-400 mr-2" size={16} />
                            <select
                                className="bg-transparent text-secondary focus:outline-none appearance-none pr-4 font-medium"
                                value={sortBy} onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="popular">Popularity</option>
                                <option value="rating">Top Rated</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`whitespace-nowrap px-6 py-2 rounded-full font-medium transition-colors ${selectedCategory === cat ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Menu Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8 pb-12">
                        <AnimatePresence>
                            {filtered.map((item, idx) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                    key={item._id}
                                    className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col"
                                >
                                    <div className="relative h-56 overflow-hidden">
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                                        {/* Favorite Button Overlay */}
                                        <button
                                            onClick={() => toggleFavorite(item._id, user?.token, () => setIsAuthModalOpen(true))}
                                            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:scale-110 transition-transform z-10"
                                        >
                                            <Heart size={18} className={`${isFavorite(item._id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                        </button>

                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold shadow-sm flex items-center gap-1 z-10">
                                            <Star className="text-accent fill-accent" size={14} />
                                            {item.rating ? item.rating.toFixed(1) : 0} ({item.numReviews || 0})
                                        </div>
                                    </div>

                                    <div className="p-6 flex-grow flex flex-col">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`flex-shrink-0 w-4 h-4 border-2 flex items-center justify-center rounded-sm ${item.isVeg !== false ? 'border-green-600' : 'border-red-600'}`}>
                                                <div className={`w-2 h-2 rounded-full ${item.isVeg !== false ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                            </div>
                                            <h3 className="font-bold text-xl text-secondary leading-tight line-clamp-1" title={item.name}>{item.name}</h3>
                                        </div>

                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{item.description || `${item.category} • ${item.prepTime}`}</p>

                                        <div className="mt-auto pt-4 border-t border-gray-50">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-2xl font-black text-secondary">₹{item.price}</span>
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="bg-black text-white p-3 rounded-full hover:bg-primary transition-colors transform active:scale-95 shadow-md flex items-center justify-center"
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            </div>

                                            {/* Reviews Button trigger */}
                                            <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                                                <button
                                                    onClick={() => {
                                                        if (!user) return setIsAuthModalOpen(true);
                                                        setReviewingProduct(item);
                                                        setReviewModalOpen(true);
                                                        setRating(5);
                                                        setReviewText('');
                                                    }}
                                                    className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                                                >
                                                    <MessageSquare size={14} />
                                                    Add Review
                                                </button>
                                                <span>{item.prepTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        <Search className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-xl">No dishes found matching your criteria.</p>
                    </div>
                )}

            </div>

            {/* Review Modal for Product */}
            {reviewModalOpen && reviewingProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative"
                    >
                        <button onClick={() => setReviewModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-2 transition-colors">
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-4 mb-6 pr-8">
                            <img src={reviewingProduct.imageUrl} className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-gray-100" />
                            <div>
                                <h2 className="text-xl font-bold text-secondary leading-tight">{reviewingProduct.name}</h2>
                                <p className="text-gray-500 text-sm">Write a review and rate</p>
                            </div>
                        </div>

                        <form onSubmit={submitReview} className="space-y-6">
                            <div className="flex justify-center gap-3 mb-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`transition-colors p-1 hover:scale-110 transform ${rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                    >
                                        <Star size={36} fill={rating >= star ? "currentColor" : "none"} />
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Your Review</label>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    className="w-full border border-gray-200 bg-gray-50 rounded-2xl p-4 focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary outline-none resize-none h-32 transition-all shadow-inner"
                                    placeholder="What did you think of the food?"
                                    required
                                ></textarea>
                            </div>

                            <button type="submit" className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex justify-center items-center gap-2">
                                <Star size={18} className="fill-white" /> Post Review
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

        </div>
    );
}
