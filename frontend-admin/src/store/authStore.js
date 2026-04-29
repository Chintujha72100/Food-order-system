import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    admin: JSON.parse(localStorage.getItem('adminInfo')) || null,
    setAdmin: (adminData) => {
        if (adminData) {
            localStorage.setItem('adminInfo', JSON.stringify(adminData));
        } else {
            localStorage.removeItem('adminInfo');
        }
        set({ admin: adminData });
    },
    logout: () => {
        localStorage.removeItem('adminInfo');
        set({ admin: null });
    }
}));
