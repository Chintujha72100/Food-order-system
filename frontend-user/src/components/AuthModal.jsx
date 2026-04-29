import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function AuthModal() {
    const { isAuthModalOpen, setIsAuthModalOpen, login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);

    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${endpoint}`, formData);
            login(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleMock = () => {
        login({ _id: 'mock_google_123', name: 'Google User', email: 'google@test.com', role: 'user', token: 'mock_google_token' });
    };

    if (!isAuthModalOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsAuthModalOpen(false)}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                    <div className="flex h-32 bg-gradient-to-br from-primary to-orange-400 p-8 items-end relative">
                        <button
                            onClick={() => setIsAuthModalOpen(false)}
                            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 rounded-full p-1 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-3xl font-bold text-white">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                    </div>

                    <div className="p-8">
                        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-4 text-sm">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text" placeholder="Full Name" required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email" placeholder="Email Address" required
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password" placeholder="Password" required
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="w-full bg-primary hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/30 flex justify-center items-center"
                            >
                                {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
                            </button>
                        </form>

                        <div className="my-6 flex items-center gap-4">
                            <div className="h-[1px] bg-gray-200 flex-grow" />
                            <span className="text-gray-400 text-sm">Or continue with</span>
                            <div className="h-[1px] bg-gray-200 flex-grow" />
                        </div>

                        <button
                            type="button" onClick={handleGoogleMock}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                            Google
                        </button>

                        <p className="mt-6 text-center text-gray-500">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
