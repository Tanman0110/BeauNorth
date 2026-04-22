import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { createPayPalOrder, capturePayPalOrder } from "../api/checkoutApi";
import { getMyAddresses } from "../api/userAddressApi";
import { getMyCart } from "../api/cartApi";
import "./CheckoutPage.css";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";

function loadPayPalScript(clientId) {
    return new Promise((resolve, reject) => {
        if (window.paypal) {
            resolve(window.paypal);
            return;
        }

        const existingScript = document.querySelector("script[data-paypal-sdk='true']");
        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(window.paypal));
            existingScript.addEventListener("error", () => reject(new Error("Failed to load PayPal SDK.")));
            return;
        }

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons&enable-funding=venmo`;
        script.async = true;
        script.dataset.paypalSdk = "true";

        script.onload = () => resolve(window.paypal);
        script.onerror = () => reject(new Error("Failed to load PayPal SDK."));
        document.body.appendChild(script);
    });
}

function getSizeSurcharge(sizeSelected) {
    const normalized = String(sizeSelected || "").trim().toUpperCase();

    if (normalized === "XXL") {
        return 2;
    }

    if (normalized === "XXXL") {
        return 3;
    }

    return 0;
}

function calculateShippingAmount(totalItemCount, subtotalBeforeShipping) {
    if (subtotalBeforeShipping >= 500) {
        return 0;
    }

    if (totalItemCount <= 0) {
        return 0;
    }

    if (totalItemCount == 1) {
        return 6.65;
    }

    return 6.65 + Math.floor(totalItemCount / 2) * 3.3;
}

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [loadingAddresses, setLoadingAddresses] = useState(true);

    const [cart, setCart] = useState(null);
    const [loadingCart, setLoadingCart] = useState(true);

    const [formData, setFormData] = useState({
        fullName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: ""
    });

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [paypalReady, setPaypalReady] = useState(false);

    const paypalContainerRef = useRef(null);
    const internalOrderIdRef = useRef(null);

    useEffect(() => {
        async function loadAddresses() {
            try {
                const data = await getMyAddresses();
                setAddresses(data);

                if (data.length > 0) {
                    const defaultAddress =
                        data.find((address) => address.isDefault) || data[0];

                    setSelectedAddressId(String(defaultAddress.userAddressId));
                    applyAddressToForm(defaultAddress);
                }
            } catch (err) {
                setError(err.message || "Failed to load saved addresses.");
            } finally {
                setLoadingAddresses(false);
            }
        }

        async function loadCart() {
            try {
                const data = await getMyCart();
                setCart(data);
            } catch (err) {
                setError((prev) => prev || err.message || "Failed to load cart.");
            } finally {
                setLoadingCart(false);
            }
        }

        if (!loading && isAuthenticated) {
            loadAddresses();
            loadCart();
        } else if (!loading) {
            setLoadingAddresses(false);
            setLoadingCart(false);
        }
    }, [loading, isAuthenticated]);

    useEffect(() => {
        async function initPayPal() {
            if (!PAYPAL_CLIENT_ID) {
                setError("PayPal is not configured. Add VITE_PAYPAL_CLIENT_ID to your frontend environment.");
                return;
            }

            try {
                await loadPayPalScript(PAYPAL_CLIENT_ID);
                setPaypalReady(true);
            } catch (err) {
                setError(err.message || "Failed to initialize PayPal.");
            }
        }

        initPayPal();
    }, []);

    function applyAddressToForm(address) {
        setFormData((prev) => ({
            ...prev,
            fullName: address.fullName || "",
            addressLine1: address.addressLine1 || "",
            addressLine2: address.addressLine2 || "",
            city: address.city || "",
            state: address.state || "",
            postalCode: address.postalCode || "",
            country: address.country || ""
        }));
    }

    function handleAddressChange(event) {
        const nextAddressId = event.target.value;
        setSelectedAddressId(nextAddressId);

        const selectedAddress = addresses.find(
            (address) => String(address.userAddressId) === nextAddressId
        );

        if (selectedAddress) {
            applyAddressToForm(selectedAddress);
        }
    }

    const selectedAddress = useMemo(() => {
        return (
            addresses.find(
                (address) =>
                    String(address.userAddressId) === String(selectedAddressId)
            ) || null
        );
    }, [addresses, selectedAddressId]);

    const cartItems = cart?.cartItems || [];

    const subtotal = useMemo(() => {
        return cartItems.reduce((total, item) => {
            const baseLine = Number(item.unitPrice) * Number(item.quantity);
            const surcharge = getSizeSurcharge(item.sizeSelected) * Number(item.quantity);
            return total + baseLine + surcharge;
        }, 0);
    }, [cartItems]);

    const taxAmount = useMemo(() => {
        return Number((subtotal * 0.06).toFixed(2));
    }, [subtotal]);

    const totalItemCount = useMemo(() => {
        return cartItems.reduce((total, item) => total + Number(item.quantity), 0);
    }, [cartItems]);

    const shippingAmount = useMemo(() => {
        return Number(calculateShippingAmount(totalItemCount, subtotal).toFixed(2));
    }, [totalItemCount, subtotal]);

    const totalAmount = useMemo(() => {
        return Number((subtotal + taxAmount + shippingAmount).toFixed(2));
    }, [subtotal, taxAmount, shippingAmount]);

    useEffect(() => {
        if (!paypalReady || !window.paypal || !paypalContainerRef.current) {
            return;
        }

        if (!selectedAddress || cartItems.length === 0) {
            paypalContainerRef.current.innerHTML = "";
            return;
        }

        paypalContainerRef.current.innerHTML = "";

        const buttons = window.paypal.Buttons({
            style: {
                layout: "vertical",
                shape: "rect",
                label: "paypal"
            },

            createOrder: async () => {
                setError("");
                setMessage("");

                const response = await createPayPalOrder({
                    fullName: formData.fullName.trim(),
                    addressLine1: formData.addressLine1.trim(),
                    addressLine2: formData.addressLine2.trim(),
                    city: formData.city.trim(),
                    state: formData.state.trim(),
                    postalCode: formData.postalCode.trim(),
                    country: formData.country.trim(),
                    paymentProvider: "PayPal"
                });

                internalOrderIdRef.current = response.orderId;
                return response.payPalOrderId;
            },

            onApprove: async (data) => {
                setError("");
                setMessage("Finalizing payment...");

                try {
                    const result = await capturePayPalOrder(
                        internalOrderIdRef.current,
                        data.orderID
                    );

                    window.dispatchEvent(new Event("cart-updated"));

                    navigate("/orders", {
                        state: {
                            successMessage: `Order ${result.orderNumber} placed successfully.`
                        }
                    });
                } catch (err) {
                    setMessage("");
                    setError(err.message || "Failed to capture PayPal payment.");
                }
            },

            onCancel: () => {
                setMessage("");
            },

            onError: () => {
                setMessage("");
                setError("PayPal checkout failed. Please try again.");
            }
        });

        if (buttons.isEligible()) {
            buttons.render(paypalContainerRef.current);
        }

        return () => {
            if (paypalContainerRef.current) {
                paypalContainerRef.current.innerHTML = "";
            }
        };
    }, [paypalReady, selectedAddress, cartItems, formData, navigate]);

    if (loading || loadingAddresses || loadingCart) {
        return <p className="checkout-status">Loading checkout...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <main className="checkout-page">
            <section className="checkout-card">
                <h1 className="checkout-title">Checkout</h1>

                {error && <p className="checkout-error">{error}</p>}
                {message && <p className="checkout-success">{message}</p>}

                {addresses.length === 0 ? (
                    <div className="checkout-no-addresses">
                        <p className="checkout-no-addresses-text">
                            You need a saved shipping address before placing an order.
                        </p>

                        <Link to="/account" className="checkout-manage-addresses-button">
                            Manage Addresses
                        </Link>
                    </div>
                ) : (
                    <div className="checkout-layout">
                        <div className="checkout-form-column">
                            <label className="checkout-label">
                                Shipping Address
                                <select
                                    className="checkout-input"
                                    value={selectedAddressId}
                                    onChange={handleAddressChange}
                                >
                                    {addresses.map((address) => (
                                        <option
                                            key={address.userAddressId}
                                            value={address.userAddressId}
                                        >
                                            {address.fullName} - {address.addressLine1}, {address.city}, {address.state}
                                            {address.isDefault ? " (Default)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {selectedAddress && (
                                <div className="checkout-address-card">
                                    <p className="checkout-address-name">{formData.fullName}</p>
                                    <p className="checkout-address-line">{formData.addressLine1}</p>
                                    {formData.addressLine2 && (
                                        <p className="checkout-address-line">{formData.addressLine2}</p>
                                    )}
                                    <p className="checkout-address-line">
                                        {formData.city}, {formData.state} {formData.postalCode}
                                    </p>
                                    <p className="checkout-address-line">{formData.country}</p>
                                </div>
                            )}

                            <div className="checkout-address-actions">
                                <Link to="/account" className="checkout-address-link">
                                    Manage Addresses
                                </Link>
                            </div>

                            <div className="checkout-paypal-block">
                                <h2 className="checkout-paypal-title">Pay with PayPal</h2>
                                <div ref={paypalContainerRef} />
                            </div>
                        </div>

                        <aside className="checkout-summary-card">
                            <h2 className="checkout-summary-title">Order Summary</h2>

                            <div className="checkout-summary-items">
                                {cartItems.map((item) => {
                                    const surchargePerUnit = getSizeSurcharge(item.sizeSelected);
                                    const lineTotal =
                                        Number(item.unitPrice) * Number(item.quantity) +
                                        surchargePerUnit * Number(item.quantity);

                                    return (
                                        <div key={item.cartItemId} className="checkout-summary-item">
                                            <div className="checkout-summary-item-main">
                                                <span className="checkout-summary-item-name">
                                                    {item.product?.name || "Product"}
                                                </span>
                                                <span className="checkout-summary-item-meta">
                                                    Qty {item.quantity}
                                                    {item.sizeSelected ? ` • ${item.sizeSelected}` : ""}
                                                    {item.colorSelected ? ` • ${item.colorSelected}` : ""}
                                                </span>
                                            </div>

                                            <span className="checkout-summary-item-price">
                                                ${lineTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="checkout-summary-totals">
                                <div className="checkout-summary-row">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>

                                <div className="checkout-summary-row">
                                    <span>Tax</span>
                                    <span>${taxAmount.toFixed(2)}</span>
                                </div>

                                <div className="checkout-summary-row">
                                    <span>Shipping</span>
                                    <span>{shippingAmount === 0 ? "Free" : `$${shippingAmount.toFixed(2)}`}</span>
                                </div>

                                <div className="checkout-summary-row checkout-summary-row-total">
                                    <span>Total</span>
                                    <span>${totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </section>
        </main>
    );
}