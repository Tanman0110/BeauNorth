import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getMyCart, removeCartItem, updateCartItem, clearMyCart } from "../api/cartApi";
import "./CartPage.css";

export default function CartPage() {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();

    const [cart, setCart] = useState(null);
    const [error, setError] = useState("");
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        async function loadCart() {
            try {
                const data = await getMyCart();
                setCart(data);
            } catch (err) {
                setError(err.message || "Failed to load cart.");
            } finally {
                setPageLoading(false);
            }
        }

        if (!loading && isAuthenticated) {
            loadCart();
        } else if (!loading) {
            setPageLoading(false);
        }
    }, [loading, isAuthenticated]);

    if (loading || pageLoading) {
        return <p className="cart-status">Loading cart...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const cartItems = cart?.cartItems || [];
    const subtotal = cartItems.reduce((total, item) => total + Number(item.unitPrice) * item.quantity, 0);

    async function handleUpdateQuantity(cartItemId, newQuantity) {
        if (newQuantity < 1) return;

        try {
            await updateCartItem(cartItemId, newQuantity);
            window.dispatchEvent(new Event("cart-updated"));
            const updatedCart = await getMyCart();
            setCart(updatedCart);
        } catch (err) {
            setError(err.message || "Failed to update cart item.");
        }
    }

    async function handleRemoveItem(cartItemId) {
        try {
            await removeCartItem(cartItemId);
            window.dispatchEvent(new Event("cart-updated"));
            const updatedCart = await getMyCart();
            setCart(updatedCart);
        } catch (err) {
            setError(err.message || "Failed to remove cart item.");
        }
    }

    async function handleClearCart() {
        try {
            await clearMyCart();
            window.dispatchEvent(new Event("cart-updated"));
            const updatedCart = await getMyCart();
            setCart(updatedCart);
        } catch (err) {
            setError(err.message || "Failed to clear cart.");
        }
    }

    return (
        <main className="cart-page">
            <section className="cart-section">
                <h1 className="cart-title">Your Cart</h1>

                {error && <p className="cart-error">{error}</p>}

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
                            {cartItems.map((item) => (
                                <article key={item.cartItemId} className="cart-item">
                                    <img
                                        src={item.product?.imageUrl}
                                        alt={item.product?.name}
                                        className="cart-item-image"
                                    />

                                    <div className="cart-item-content">
                                        <h2 className="cart-item-title">
                                            {item.product?.name}
                                        </h2>

                                        {item.sizeSelected && (
                                            <p className="cart-item-meta">
                                                Size: {item.sizeSelected}
                                            </p>
                                        )}

                                        {item.colorSelected && (
                                            <p className="cart-item-meta">
                                                Color: {item.colorSelected}
                                            </p>
                                        )}

                                        <p className="cart-item-price">
                                            ${Number(item.unitPrice).toFixed(2)}
                                        </p>

                                        <div className="cart-item-actions">
                                            <button
                                                className="cart-qty-button"
                                                onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
                                            >
                                                -
                                            </button>

                                            <span className="cart-qty-value">{item.quantity}</span>

                                            <button
                                                className="cart-qty-button"
                                                onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                                            >
                                                +
                                            </button>

                                            <button
                                                className="cart-remove-button"
                                                onClick={() => handleRemoveItem(item.cartItemId)}
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

                            <button
                                className="cart-checkout-button"
                                onClick={() => navigate("/checkout")}
                            >
                                Checkout
                            </button>
                        </aside>
                    </div>
                )}
            </section>
        </main>
    );
}