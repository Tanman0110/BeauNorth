import { useEffect, useState } from "react";
import { AuthContext } from "./useAuth";
import { getCurrentUser, loginUser, registerUser } from "../api/authApi";

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const currentUser = await getCurrentUser(token);
                setUser(currentUser);
            } catch {
                localStorage.removeItem("token");
                setToken("");
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, [token]);

    async function register(registerData) {
        const authResponse = await registerUser(registerData);

        localStorage.setItem("token", authResponse.token);
        setToken(authResponse.token);
        setUser({
            userId: authResponse.userId,
            firstName: authResponse.firstName,
            lastName: authResponse.lastName,
            email: authResponse.email,
            role: authResponse.role
        });
    }

    async function login(loginData) {
        const authResponse = await loginUser(loginData);

        localStorage.setItem("token", authResponse.token);
        setToken(authResponse.token);
        setUser({
            userId: authResponse.userId,
            firstName: authResponse.firstName,
            lastName: authResponse.lastName,
            email: authResponse.email,
            role: authResponse.role
        });
    }

    function logout() {
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                register,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}