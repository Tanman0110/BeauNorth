import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CartPage.css";

export default function CartPage() {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        function loadCart() {
            const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
            setCartItems(storedCart);
        }

        loadCart();
        window.addEventListener("storage", loadCart);

        return () => {
            window.removeEventListener("storage", loadCart);
        };
    }, []);

    function updateQuantity(index, newQuantity) {
        if (newQuantity < 1) return;

        const updatedCart = [...cartItems];
        updatedCart[index].quantity = newQuantity;

        localStorage.setItem("cart", JSON.stringify(updatedCart));
        setCartItems(updatedCart);
        window.dispatchEvent(new Event("storage"));
    }

    function removeItem(index) {
        const updatedCart = cartItems.filter((_, itemIndex) => itemIndex !== index);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        setCartItems(updatedCart);
        window.dispatchEvent(new Event("storage"));
    }

    const subtotal = cartItems.reduce(
        (total, item) => total + Number(item.price) * item.quantity,
        0
    );

    return (
        <main className="cart-page">
            <section className="cart-section">
                <h1 className="cart-title">Your Cart</h1>

                {cartItems.length === 0 ? (
                    <div className="cart-empty">
                        <p className="cart-empty-text">Your cart is empty.</p>
                        <Link to="/products" className="cart-shop-button">
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="cart-layout">
                        <div className="cart-items">
                            {cartItems.map((item, index) => (
                                <article
                                    key={`${item.productId}-${item.selectedSize}-${item.selectedColor}-${index}`}
                                    className="cart-item"
                                >
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="cart-item-image"
                                    />

                                    <div className="cart-item-content">
                                        <h2 className="cart-item-title">{item.name}</h2>

                                        {item.selectedSize && (
                                            <p className="cart-item-meta">
                                                Size: {item.selectedSize}
                                            </p>
                                        )}

                                        {item.selectedColor && (
                                            <p className="cart-item-meta">
                                                Color: {item.selectedColor}
                                            </p>
                                        )}

                                        <p className="cart-item-price">
                                            ${Number(item.price).toFixed(2)}
                                        </p>

                                        <div className="cart-item-actions">
                                            <button
                                                className="cart-qty-button"
                                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                            >
                                                -
                                            </button>

                                            <span className="cart-qty-value">{item.quantity}</span>

                                            <button
                                                className="cart-qty-button"
                                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                            >
                                                +
                                            </button>

                                            <button
                                                className="cart-remove-button"
                                                onClick={() => removeItem(index)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <aside className="cart-summary">
                            <h2 className="cart-summary-title">Order Summary</h2>
                            <p className="cart-summary-row">
                                <span>Subtotal</span>
                                <strong>${subtotal.toFixed(2)}</strong>
                            </p>

                            <button className="cart-checkout-button">
                                Checkout
                            </button>
                        </aside>
                    </div>
                )}
            </section>
        </main>
    );
}