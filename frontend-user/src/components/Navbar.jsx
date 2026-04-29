import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu as MenuIcon, User, LogOut, MapPin, Sun, Moon } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useLocationStore from '../store/locationStore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LocationModal from './LocationModal';

export default function Navbar() {
    const { cart } = useCartStore(state => state);
    const { location } = useLocationStore();
    const { user, logout, setIsAuthModalOpen } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const totalItems = cart ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;

    return (
        <nav className="fixed top-0 w-full z-50 glass-panel py-4 transition-all duration-300">
            <div className="container mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/assets/cravebite_logo.png" alt="CraveBite" className="h-10 w-10 object-contain" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
                            CraveBite
                        </span>
                    </Link>

                    {/* Location Selector */}
                    <div
                        onClick={() => setIsLocationModalOpen(true)}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50/80 px-3 py-1.5 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                    >
                        <MapPin size={22} className="text-primary flex-shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Delivering To</span>
                            <span className="text-sm font-semibold text-gray-700 truncate max-w-[120px] md:max-w-[200px] leading-tight">
                                {location.address || 'Select Location'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-8 font-medium">
                    <Link to="/" className="hover:text-primary transition-colors dark:text-gray-300 dark:hover:text-primary">Home</Link>
                    <Link to="/menu" className="hover:text-primary transition-colors dark:text-gray-300 dark:hover:text-primary">Menu</Link>
                    <Link to="/tracker" className="hover:text-primary transition-colors dark:text-gray-300 dark:hover:text-primary">Track Order</Link>
                </div>

                <div className="flex items-center gap-6">
                    <Link to="/cart" className="relative text-secondary dark:text-gray-300 hover:text-primary transition-colors">
                        <ShoppingCart size={24} />
                        {totalItems > 0 && (
                            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {totalItems}
                            </span>
                        )}
                    </Link>

                    <button onClick={toggleTheme} className="text-secondary dark:text-gray-300 hover:text-primary transition-colors">
                        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                    </button>

                    {user ? (
                        <div className="hidden md:flex items-center gap-4">
                            <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer group border border-transparent hover:border-gray-200">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-orange-400 flex items-center justify-center text-white font-bold shadow-sm group-hover:shadow-md transition-shadow">
                                    {user.name.charAt(0)}
                                </div>
                                <span className="font-medium text-secondary group-hover:text-primary transition-colors">{user.name.split(' ')[0]}</span>
                            </Link>
                            <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="hidden md:flex items-center gap-2 bg-secondary text-white px-5 py-2 rounded-full hover:bg-black transition-colors"
                        >
                            <User size={18} />
                            <span>Login</span>
                        </button>
                    )}
                    <button className="md:hidden text-secondary">
                        <MenuIcon size={24} />
                    </button>
                </div>
            </div>

            <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
        </nav>
    );
}
