import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
    persist(
        (set) => ({
            cart: [],
            addToCart: (product, quantity = 1) => set((state) => {
                const existing = state.cart.find(item => item.product._id === product._id);
                if (existing) {
                    return { cart: state.cart.map(item => item.product._id === product._id ? { ...item, quantity: item.quantity + quantity } : item) };
                }
                return { cart: [...state.cart, { product, quantity }] };
            }),
            removeFromCart: (productId) => set((state) => ({
                cart: state.cart.filter(item => item.product._id !== productId)
            })),
            updateQuantity: (productId, quantity) => set((state) => {
                if (quantity <= 0) {
                    return { cart: state.cart.filter(item => item.product._id !== productId) };
                }
                return { cart: state.cart.map(item => item.product._id === productId ? { ...item, quantity } : item) };
            }),
            clearCart: () => set({ cart: [] }),
        }),
        {
            name: 'cravebite-cart-storage', // unique name
        }
    )
);

export default useCartStore;
