import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                <div className="site-footer-column">
                    <h3 className="site-footer-title">Beau North</h3>
                    <p className="site-footer-text">
                        Everyday essentials designed with a clean, modern feel.
                    </p>
                </div>

                <div className="site-footer-column">
                    <h4 className="site-footer-heading">Shop</h4>
                    <Link to="/products" className="site-footer-link">
                        All Products
                    </Link>
                    <Link to="/categories" className="site-footer-link">
                        Categories
                    </Link>
                    <Link to="/cart" className="site-footer-link">
                        Cart
                    </Link>
                </div>

                <div className="site-footer-column">
                    <h4 className="site-footer-heading">Account</h4>
                    <Link to="/account" className="site-footer-link">
                        My Account
                    </Link>
                    <Link to="/orders" className="site-footer-link">
                        Orders
                    </Link>
                </div>

                <div className="site-footer-column">
                    <h4 className="site-footer-heading">Support</h4>
                    <a href="mailto:support@beaunorth.com" className="site-footer-link">
                        Contact
                    </a>
                    <Link to="/forgot-password" className="site-footer-link">
                        Password Help
                    </Link>
                </div>
            </div>

            <div className="site-footer-bottom">
                <span>© 2026 Beau North. All rights reserved.</span>
            </div>
        </footer>
    );
}