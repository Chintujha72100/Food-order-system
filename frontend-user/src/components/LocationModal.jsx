import { useState, useEffect } from 'react';
import { MapPin, Target, X } from 'lucide-react';
import axios from 'axios';
import useLocationStore from '../store/locationStore';

export default function LocationModal({ isOpen, onClose, forcePrompt = false }) {
    const { location, setLocation } = useLocationStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // If we're not forcing the prompt and a location already exists, don't show the modal
    if (!isOpen && (!forcePrompt || location.address)) return null;

    const findOptimalAddress = (addressObj) => {
        return addressObj.road || addressObj.suburb || addressObj.neighbourhood || addressObj.city || addressObj.municipality || 'Unknown Location';
    };

    const handleAutoLocate = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await axios.get(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                    );

                    if (response.data && response.data.address) {
                        const localArea = findOptimalAddress(response.data.address);

                        let fullAddress = [];
                        if (localArea) fullAddress.push(localArea);
                        if (response.data.address.city || response.data.address.town || response.data.address.village) {
                            fullAddress.push(response.data.address.city || response.data.address.town || response.data.address.village);
                        }

                        setLocation(fullAddress.join(', '), latitude.toString(), longitude.toString());
                        onClose(); // Close modal on success
                    } else {
                        setError('Could not precisely determine your location.');
                    }
                } catch (err) {
                    console.error('Reverse geocoding failed:', err);
                    setError('Failed to fetch address details. Please try again.');
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('Location access denied or unavailable. Please enable permissions.');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full relative">
                {/* Allow closing ONLY if it was manually triggered (forcePrompt = true) or if they already have an address */}
                {(forcePrompt || location.address) && (
                    <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
                        <X size={24} />
                    </button>
                )}

                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative">
                        <MapPin size={40} className="text-primary z-10" />
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                    </div>
                </div>

                <h2 className="text-2xl font-black text-center text-gray-800 mb-2">Where are you?</h2>
                <p className="text-center text-gray-500 text-sm mb-8 leading-relaxed">
                    We need your location to show available restaurants and ensure accurate delivery bounds.
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center font-medium">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleAutoLocate}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-orange-600 active:scale-95 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:active:scale-100"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Target size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                            Detect Current Location
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
