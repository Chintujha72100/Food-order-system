import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, Tag, ListOrdered, Settings, Users, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/menu', label: 'Menu Management', icon: UtensilsCrossed },
    { path: '/discounts', label: 'Discount Engine', icon: Tag },
    { path: '/orders', label: 'Order Kanban', icon: ListOrdered },
    { path: '/users', label: 'Customers', icon: Users },
    { path: '/settings', label: 'System Settings', icon: Settings },
];

import { useAuthStore } from '../store/authStore';
import { LogOut } from 'lucide-react';

export default function Sidebar() {
    const { isDarkMode, toggleTheme } = useTheme();
    const { admin, logout } = useAuthStore();

    return (
        <div className="w-64 bg-sidebar text-white p-6 flex flex-col min-h-screen shadow-xl z-20">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-xl">
                    CB
                </div>
                <h1 className="text-xl font-bold tracking-wider text-white">Admin Panel</h1>
            </div>

            <nav className="flex-grow space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
                        }
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-800 space-y-2">
                <div className="px-4 py-2 mb-2 flex items-center gap-3 bg-gray-800/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                        {admin?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold leading-tight">{admin?.name || 'Admin'}</span>
                        <span className="text-[10px] text-gray-400">Administrator</span>
                    </div>
                </div>

                <button
                    onClick={toggleTheme}
                    className="flex w-full items-center gap-4 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <button
                    onClick={logout}
                    className="flex w-full items-center gap-4 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-red-500/20 hover:text-red-400 group"
                >
                    <LogOut size={20} className="group-hover:rotate-180 transition-transform duration-300" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </div>
    );
}
