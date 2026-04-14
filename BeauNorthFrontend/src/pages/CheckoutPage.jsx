import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { checkout } from "../api/checkoutApi";
import { getMyAddresses } from "../api/userAddressApi";
import "./CheckoutPage.css";

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [loadingAddresses, setLoadingAddresses] = useState(true);

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

        if (!loading && isAuthenticated) {
            loadAddresses();
        } else if (!loading) {
            setLoadingAddresses(false);
        }
    }, [loading, isAuthenticated]);

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

    function handlePaymentProviderChange(event) {
        const { value } = event.target;

        setFormData((prev) => ({
            ...prev,
            paymentProvider: value
        }));
    }

    const selectedAddress = useMemo(() => {
        return (
            addresses.find(
                (address) =>
                    String(address.userAddressId) === String(selectedAddressId)
            ) || null
        );
    }, [addresses, selectedAddressId]);

    if (loading || loadingAddresses) {
        return <p className="checkout-status">Loading checkout...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    function validateForm() {
        if (!selectedAddress) {
            return "Please select a shipping address.";
        }

        if (!formData.fullName.trim()) {
            return "Selected address is missing a full name.";
        }

        if (!formData.addressLine1.trim()) {
            return "Selected address is missing address line 1.";
        }

        if (!formData.city.trim()) {
            return "Selected address is missing a city.";
        }

        if (!formData.state.trim()) {
            return "Selected address is missing a state.";
        }

        if (!formData.postalCode.trim()) {
            return "Selected address is missing a postal code.";
        }

        if (!formData.country.trim()) {
            return "Selected address is missing a country.";
        }

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

            navigate("/orders", {
                state: {
                    successMessage: `Order ${order.orderNumber} placed successfully.`
                }
            });
        } catch (err) {
            setError(err.message || "Checkout failed.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="checkout-page">
            <section className="checkout-card">
                <h1 className="checkout-title">Checkout</h1>

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
                    <form className="checkout-form" onSubmit={handleSubmit}>
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

                        <label className="checkout-label">
                            Payment Provider
                            <select
                                className="checkout-input"
                                name="paymentProvider"
                                value={formData.paymentProvider}
                                onChange={handlePaymentProviderChange}
                            >
                                <option value="Demo">Demo</option>
                                <option value="Stripe">Stripe</option>
                                <option value="PayPal">PayPal</option>
                            </select>
                        </label>

                        <div className="checkout-address-actions">
                            <Link to="/account" className="checkout-address-link">
                                Manage Addresses
                            </Link>
                        </div>

                        {error && <p className="checkout-error">{error}</p>}

                        <button
                            className="checkout-button"
                            type="submit"
                            disabled={submitting || !selectedAddress}
                        >
                            {submitting ? "Placing Order..." : "Place Order"}
                        </button>
                    </form>
                )}
            </section>
        </main>
    );
}