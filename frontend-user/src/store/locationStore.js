import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useLocationStore = create(
    persist(
        (set) => ({
            location: {
                address: '',
                lat: '',
                lng: ''
            },
            setLocation: (address, lat, lng) => set({ location: { address, lat, lng } }),
            clearLocation: () => set({ location: { address: '', lat: '', lng: '' } })
        }),
        {
            name: 'cravebite-location-storage', // unique name for localStorage
        }
    )
);

export default useLocationStore;
