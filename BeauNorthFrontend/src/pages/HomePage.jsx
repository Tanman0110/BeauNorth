import { Link } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
    return (
        <main className="home-page">
            <section className="home-hero">
                <p className="home-eyebrow">Modern Essentials</p>

                <h1 className="home-title">
                    Shop clean, simple, everyday pieces.
                </h1>

                <p className="home-description">
                    Browse products from your live backend, view product details,
                    and add items to your cart.
                </p>

                <div className="home-actions">
                    <Link to="/products" className="home-button home-button-primary">
                        Shop Products
                    </Link>

                    <Link to="/cart" className="home-button home-button-secondary">
                        View Cart
                    </Link>
                </div>
            </section>
        </main>
    );
}