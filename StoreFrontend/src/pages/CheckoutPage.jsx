import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { checkout } from "../api/checkoutApi";
import "./CheckoutPage.css";

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();

    const [formData, setFormData] = useState({
        fullName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        paymentProvider: "Demo"
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (loading) {
        return <p className="checkout-status">Loading checkout...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    function validateForm() {
        if (!formData.fullName.trim()) return "Full name is required.";
        if (!formData.addressLine1.trim()) return "Address line 1 is required.";
        if (!formData.city.trim()) return "City is required.";
        if (!formData.state.trim()) return "State is required.";
        if (!formData.postalCode.trim()) return "Postal code is required.";
        if (!formData.country.trim()) return "Country is required.";
        return "";
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError("");
        setSubmitting(true);

        try {
            const order = await checkout({
                fullName: formData.fullName.trim(),
                addressLine1: formData.addressLine1.trim(),
                addressLine2: formData.addressLine2.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                postalCode: formData.postalCode.trim(),
                country: formData.country.trim(),
                paymentProvider: formData.paymentProvider
            });

            console.log("Checkout success:", order);

            navigate("/orders", {
                state: {
                    successMessage: `Order ${order.orderNumber} placed successfully.`
                }
            });
        } catch (err) {
            console.error("Checkout failed:", err);
            setError(err.message || "Checkout failed.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="checkout-page">
            <section className="checkout-card">
                <h1 className="checkout-title">Checkout</h1>

                <form className="checkout-form" onSubmit={handleSubmit}>
                    <label className="checkout-label">
                        Full Name
                        <input
                            className="checkout-input"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </label>

                    <label className="checkout-label">
                        Address Line 1
                        <input
                            className="checkout-input"
                            name="addressLine1"
                            value={formData.addressLine1}
                            onChange={handleChange}
                        />
                    </label>

                    <label className="checkout-label">
                        Address Line 2
                        <input
                            className="checkout-input"
                            name="addressLine2"
                            value={formData.addressLine2}
                            onChange={handleChange}
                        />
                    </label>

                    <label className="checkout-label">
                        City
                        <input
                            className="checkout-input"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                        />
                    </label>

                    <label className="checkout-label">
                        State
                        <input
                            className="checkout-input"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                        />
                    </label>

                    <label className="checkout-label">
                        Postal Code
                        <input
                            className="checkout-input"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                        />
                    </label>

                    <label className="checkout-label">
                        Country
                        <input
                            className="checkout-input"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                        />
                    </label>

                    <label className="checkout-label">
                        Payment Provider
                        <select
                            className="checkout-input"
                            name="paymentProvider"
                            value={formData.paymentProvider}
                            onChange={handleChange}
                        >
                            <option value="Demo">Demo</option>
                            <option value="Stripe">Stripe</option>
                            <option value="PayPal">PayPal</option>
                        </select>
                    </label>

                    {error && <p className="checkout-error">{error}</p>}

                    <button className="checkout-button" type="submit" disabled={submitting}>
                        {submitting ? "Placing Order..." : "Place Order"}
                    </button>
                </form>
            </section>
        </main>
    );
}