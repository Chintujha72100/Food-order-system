import { useState, useEffect } from 'react';
import axios from '../utils/axiosInstance';
import { MapPin, Save, RefreshCw } from 'lucide-react';

export default function Settings() {
    const [settings, setSettings] = useState({
        storeLocation: {
            name: 'CraveBite Central Kitchen',
            street: '',
            area: '',
            city: '',
            state: '',
            zipCode: '',
            lat: '',
            lng: ''
        }
    });

    const [isLocating, setIsLocating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/settings`);
                if (data && data.storeLocation) {
                    setSettings(data);
                }
            } catch (error) {
                console.error("Failed to load settings", error);
            }
        };
        fetchSettings();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            storeLocation: {
                ...prev.storeLocation,
                [name]: value
            }
        }));
    };

    const fetchCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                // Use OpenStreetMap Nominatim for free Reverse Geocoding
                const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);

                if (data && data.address) {
                    setSettings(prev => ({
                        ...prev,
                        storeLocation: {
                            ...prev.storeLocation,
                            street: data.address.road || data.address.street || '',
                            area: data.address.suburb || data.address.neighbourhood || '',
                            city: data.address.city || data.address.town || data.address.village || '',
                            state: data.address.state || '',
                            zipCode: data.address.postcode || '',
                            lat: latitude.toString(),
                            lng: longitude.toString()
                        }
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch address", error);
                alert("Could not fetch address details automatically.");
            } finally {
                setIsLocating(false);
            }
        }, () => {
            alert("Unable to retrieve your location.");
            setIsLocating(false);
        });
    };

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/settings`, {
                storeLocation: settings.storeLocation
            });
            alert('Store Location saved successfully!');
        } catch (error) {
            console.error("Failed to save settings", error);
            alert('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">System Settings</h1>

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <MapPin className="text-primary" /> Store Location
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Set the official physical location of the restaurant. This is displayed to users on the order tracking map.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="col-span-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                        <input
                            type="text" name="name"
                            value={settings.storeLocation.name} onChange={handleInputChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="e.g. CraveBite Central Kitchen"
                        />
                    </div>

                    <div className="col-span-full bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-600">
                            <strong>Auto-Locate:</strong> Click the button to automatically fetch and fill your current GPS coordinates and exact address details via satellite.
                        </p>
                        <button
                            onClick={fetchCurrentLocation} disabled={isLocating}
                            className="bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors"
                        >
                            <RefreshCw size={16} className={isLocating ? "animate-spin" : ""} />
                            {isLocating ? 'Scanning GPS...' : 'Fetch via GPS / Map'}
                        </button>
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street / House No</label>
                        <input
                            type="text" name="street"
                            value={settings.storeLocation.street} onChange={handleInputChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="123 Example Street"
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Area / Suburb</label>
                        <input
                            type="text" name="area"
                            value={settings.storeLocation.area} onChange={handleInputChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="Downtown"
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                            type="text" name="city"
                            value={settings.storeLocation.city} onChange={handleInputChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="Mumbai"
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <input
                            type="text" name="state"
                            value={settings.storeLocation.state} onChange={handleInputChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="Maharashtra"
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pincode / Zip Code</label>
                        <input
                            type="text" name="zipCode"
                            value={settings.storeLocation.zipCode} onChange={handleInputChange}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="400001"
                        />
                    </div>

                    <div className="col-span-1 flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-xs font-medium text-gray-400 mb-2">Latitude</label>
                            <input
                                type="text" readOnly
                                value={settings.storeLocation.lat}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 text-sm outline-none cursor-not-allowed"
                                placeholder="..."
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-xs font-medium text-gray-400 mb-2">Longitude</label>
                            <input
                                type="text" readOnly
                                value={settings.storeLocation.lng}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 text-sm outline-none cursor-not-allowed"
                                placeholder="..."
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        onClick={saveSettings} disabled={isSaving}
                        className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-black/10"
                    >
                        {isSaving ? (
                            <RefreshCw className="animate-spin" size={20} />
                        ) : (
                            <Save size={20} />
                        )}
                        {isSaving ? 'Saving map data...' : 'Save Global Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
