import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useEffect, useState } from "react";

import "./Navbar.css";

export default function Navbar() {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const [cartItemCount, setCartItemCount] = useState(0);

    useEffect(() => {
        function updateCartCount() {
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            const count = cart.reduce((total, item) => total + item.quantity, 0);
            setCartItemCount(count);
        }

        updateCartCount();
        window.addEventListener("storage", updateCartCount);

        return () => {
            window.removeEventListener("storage", updateCartCount);
        };
    }, []);

    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <header className="navbar">
            <Link to="/" className="navbar-logo">
                StoreFront
            </Link>

            <nav className="navbar-links">
                <Link to="/" className="navbar-link">
                    Home
                </Link>

                <Link to="/products" className="navbar-link">
                    Products
                </Link>

                <Link to="/cart" className="navbar-link">
                    Cart ({cartItemCount})
                </Link>

                {isAuthenticated ? (
                    <>
                        <Link to="/account" className="navbar-link">
                            {user.firstName}
                        </Link>
                        <button className="navbar-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="navbar-link">
                            Login
                        </Link>
                        <Link to="/register" className="navbar-link navbar-link-strong">
                            Register
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}