import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Navbar.css";

export default function Navbar() {
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
            </nav>
        </header>
    );
}