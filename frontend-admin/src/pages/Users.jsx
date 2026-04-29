import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Shield, ShieldOff, Trash2 } from 'lucide-react';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            // For now, using mock auth token since admin panel uses FAKE_TOKEN
            // In a real app, grab from zustand auth store
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users`, {
                headers: { Authorization: `Bearer FAKE_TOKEN` }
            });
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (id, role) => {
        if (role === 'admin') {
            alert('Cannot delete admin users from this dashboard.');
            return;
        }

        if (window.confirm("Are you sure you want to delete this user? Their orders will not be deleted.")) {
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/${id}`, {
                    headers: { Authorization: `Bearer FAKE_TOKEN` }
                });
                setUsers(users.filter(u => u._id !== id));
            } catch (error) {
                console.error('Failed to delete user', error);
                alert("Could not delete user.");
            }
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                                <th className="p-4 font-semibold uppercase tracking-wider">User</th>
                                <th className="p-4 font-semibold uppercase tracking-wider">Email</th>
                                <th className="p-4 font-semibold uppercase tracking-wider">Role</th>
                                <th className="p-4 font-semibold uppercase tracking-wider">Joined</th>
                                <th className="p-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold">
                                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{user.name}</p>
                                                <p className="text-xs text-gray-400">ID: {user._id.slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                            {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleDeleteUser(user._id, user.role)}
                                            disabled={user.role === 'admin'}
                                            className={`p-2 rounded-xl transition-colors inline-block ${user.role === 'admin' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                            title={user.role === 'admin' ? "Cannot delete admin" : "Delete User"}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
