import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./Navbar.css";

export default function Navbar() {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

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
                <Link to="/" className="navbar-link">Home</Link>
                <Link to="/products" className="navbar-link">Products</Link>

                {isAuthenticated ? (
                    <>
                        <Link to="/cart" className="navbar-link">Cart</Link>
                        <Link to="/orders" className="navbar-link">Orders</Link>
                        <Link to="/account" className="navbar-link">{user?.firstName || "Account"}</Link>
                        <button className="navbar-button" onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="navbar-link">Login</Link>
                        <Link to="/register" className="navbar-link navbar-link-strong">Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
}