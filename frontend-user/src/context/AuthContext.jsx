import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('cravebite_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('cravebite_user', JSON.stringify(userData));
        setIsAuthModalOpen(false);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('cravebite_user');
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthModalOpen,
            setIsAuthModalOpen
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
