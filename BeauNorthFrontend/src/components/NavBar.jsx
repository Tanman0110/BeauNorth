import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { getMyCart } from "../api/cartApi";
import beauNorthLogo from "../assets/beau_north_logo.png";
import "./Navbar.css";

export default function Navbar() {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        async function loadCartCount() {
            if (!isAuthenticated) {
                setCartCount(0);
                return;
            }

            try {
                const cart = await getMyCart();
                const count = (cart?.cartItems || []).reduce(
                    (total, item) => total + item.quantity,
                    0
                );
                setCartCount(count);
            } catch {
                setCartCount(0);
            }
        }

        loadCartCount();

        window.addEventListener("cart-updated", loadCartCount);

        return () => {
            window.removeEventListener("cart-updated", loadCartCount);
        };
    }, [isAuthenticated]);

    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <header className="navbar">
            <Link to="/" className="navbar-logo">
                <img
                    src={beauNorthLogo}
                    alt="Beau North"
                    className="navbar-logo-image"
                />
            </Link>

            <nav className="navbar-links">
                <Link to="/products" className="navbar-link">Products</Link>

                {isAuthenticated ? (
                    <>
                        <Link to="/cart" className="navbar-link">
                            Cart ({cartCount})
                        </Link>
                        <Link to="/orders" className="navbar-link">Orders</Link>
                        <Link to="/account" className="navbar-link">
                            {user?.firstName || "Account"}
                        </Link>
                        <button className="navbar-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="navbar-link">Login</Link>
                        <Link to="/register" className="navbar-link navbar-link-strong">
                            Register
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}