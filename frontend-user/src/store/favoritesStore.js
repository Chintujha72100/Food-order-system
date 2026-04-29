import { create } from 'zustand';
import axios from 'axios';

const useFavoritesStore = create((set, get) => ({
    favorites: [],

    fetchFavorites: async (token) => {
        if (!token) {
            set({ favorites: [] });
            return;
        }
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/wishlist`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ favorites: data.map(product => typeof product === 'object' ? product._id : product) });
        } catch (error) {
            console.error('Failed to fetch wishlist', error);
        }
    },

    toggleFavorite: async (productId, token, onAuthRequired) => {
        if (!token) {
            if (onAuthRequired) onAuthRequired();
            return;
        }

        const { favorites } = get();
        const isFav = favorites.includes(productId);

        if (isFav) {
            set({ favorites: favorites.filter(id => id !== productId) });
        } else {
            set({ favorites: [...favorites, productId] });
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/wishlist/${productId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Failed to toggle wishlist', error);
            set({ favorites });
        }
    },

    isFavorite: (productId) => get().favorites.includes(productId)
}));

export default useFavoritesStore;
