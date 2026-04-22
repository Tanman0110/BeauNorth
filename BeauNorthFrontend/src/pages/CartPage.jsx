import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getMyCart, removeCartItem, updateCartItem, clearMyCart } from "../api/cartApi";
import { getPrimaryProductImage } from "../utils/productImages";
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
        return <p className="cart-status loading-screen-space">Loading cart...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const cartItems = cart?.cartItems || [];
    const subtotal = cartItems.reduce((total, item) => {
        const normalizedSize = String(item.sizeSelected || "").trim().toUpperCase();

        const sizeSurchargePerUnit =
            normalizedSize === "XXL"
                ? 2
                : normalizedSize === "XXXL"
                    ? 3
                    : 0;

        const itemTotal =
            (Number(item.unitPrice) * Number(item.quantity)) +
            (sizeSurchargePerUnit * Number(item.quantity));

        return total + itemTotal;
    }, 0);

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
                                {cartItems.map((item) => {
                                    const imageSource = item.product?.productImages?.length
                                        ? item.product
                                        : {
                                            ...item.product,
                                            productImages: item.productImages || []
                                        };

                                    const imageUrl = getPrimaryProductImage(
                                        imageSource,
                                        item.colorSelected || null
                                    );

                                    const normalizedSize = String(item.sizeSelected || "").trim().toUpperCase();

                                    const sizeSurchargePerUnit =
                                        normalizedSize === "XXL"
                                            ? 2
                                            : normalizedSize === "XXXL"
                                                ? 3
                                                : 0;

                                    const basePricePerUnit = Number(item.unitPrice);
                                    const itemTotal =
                                        (basePricePerUnit * Number(item.quantity)) +
                                        (sizeSurchargePerUnit * Number(item.quantity));

                                    return (
                                        <article key={item.cartItemId} className="cart-item">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={item.product?.name}
                                                    className="cart-item-image"
                                                />
                                            ) : (
                                                <div className="cart-item-image cart-item-image-placeholder">
                                                    No Image
                                                </div>
                                            )}

                                            <div className="cart-item-content">
                                                <div className="cart-item-top">
                                                    <div className="cart-item-header">
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
                                                    </div>

                                                    <div className="cart-item-qty-controls">
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

                                                        <div className="cart-item-actions">
                                                        <button
                                                            className="cart-remove-button"
                                                            onClick={() => handleRemoveItem(item.cartItemId)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                    </div>
                                                </div>

                                                <div className="cart-item-pricing">
                                                    <p className="cart-item-price-row">
                                                        <span className="cart-item-price-label">Base Price:</span>
                                                        <span className="cart-item-price-value">
                                                            ${basePricePerUnit.toFixed(2)}
                                                        </span>
                                                    </p>

                                                    {sizeSurchargePerUnit > 0 && (
                                                        <p className="cart-item-price-row">
                                                            <span className="cart-item-price-label">Size Cost:</span>
                                                            <span className="cart-item-price-value">
                                                                ${sizeSurchargePerUnit.toFixed(2)}
                                                            </span>
                                                        </p>
                                                    )}

                                                    <p className="cart-item-price-row">
                                                        <span className="cart-item-price-label">Quantity:</span>
                                                        <span className="cart-item-price-value">
                                                            {item.quantity}
                                                        </span>
                                                    </p>

                                                    <p className="cart-item-price cart-item-total">
                                                        <span className="cart-item-price-label">Item(s) Total:</span>
                                                        <span className="cart-item-price-value">
                                                            ${itemTotal.toFixed(2)}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
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

                            <button
                                className="cart-clear-button"
                                onClick={handleClearCart}
                            >
                                Clear Cart
                            </button>
                        </aside>
                    </div>
                )}
            </section>
        </main>
    );
}