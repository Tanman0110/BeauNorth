import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import { useAuth } from "../context/useAuth";
import {
    deleteMyAccount,
    getMyAccount,
    updateMyAccount
} from "../api/userApi";
import {
    createMyAddress,
    deleteMyAddress,
    getMyAddresses
} from "../api/userAddressApi";
import "./AccountPage.css";

export default function AccountPage() {
    const navigate = useNavigate();
    const { isAuthenticated, loading, logout } = useAuth();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: ""
    });

    const [addresses, setAddresses] = useState([]);
    const [addressForm, setAddressForm] = useState({
        fullName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        isDefault: false
    });

    const [statusMessage, setStatusMessage] = useState("");
    const [error, setError] = useState("");
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        async function loadAccount() {
            try {
                const [user, userAddresses] = await Promise.all([
                    getMyAccount(),
                    getMyAddresses()
                ]);

                setFormData({
                    firstName: user.firstName ?? "",
                    lastName: user.lastName ?? "",
                    email: user.email ?? ""
                });

                setAddresses(userAddresses);
            } catch (err) {
                setError(err.message || "Failed to load account.");
            } finally {
                setPageLoading(false);
            }
        }

        if (!loading && isAuthenticated) {
            loadAccount();
        } else if (!loading) {
            setPageLoading(false);
        }
    }, [loading, isAuthenticated]);

    if (loading || pageLoading) {
        return <p className="account-status">Loading account...</p>;
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

    function handleAddressChange(event) {
        const { name, value, type, checked } = event.target;

        setAddressForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    function isValidName(name) {
        return /^[A-Za-z]+([ '-][A-Za-z]+)*$/.test(name);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async function reloadAddresses() {
        const userAddresses = await getMyAddresses();
        setAddresses(userAddresses);
    }

    async function handleProfileSubmit(event) {
        event.preventDefault();
        setError("");
        setStatusMessage("");

        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();

        if (!firstName || !isValidName(firstName)) {
            setError("First name contains invalid characters.");
            return;
        }

        if (!lastName || !isValidName(lastName)) {
            setError("Last name contains invalid characters.");
            return;
        }

        if (!email || !isValidEmail(email)) {
            setError("Enter a valid email address.");
            return;
        }

        try {
            await updateMyAccount({
                firstName,
                lastName,
                email
            });

            setStatusMessage("Account updated successfully.");
        } catch (err) {
            setError(err.message || "Failed to update account.");
        }
    }

    async function handleSendPasswordReset() {
        setError("");
        setStatusMessage("");

        try {
            const response = await forgotPassword(formData.email.trim());
            setStatusMessage(response.message || "Password reset email sent.");
        } catch (err) {
            setError(err.message || "Failed to send password reset email.");
        }
    }

    async function handleCreateAddress(event) {
        event.preventDefault();
        setError("");
        setStatusMessage("");

        try {
            await createMyAddress({
                fullName: addressForm.fullName.trim(),
                addressLine1: addressForm.addressLine1.trim(),
                addressLine2: addressForm.addressLine2.trim(),
                city: addressForm.city.trim(),
                state: addressForm.state.trim(),
                postalCode: addressForm.postalCode.trim(),
                country: addressForm.country.trim(),
                isDefault: addressForm.isDefault
            });

            setAddressForm({
                fullName: "",
                addressLine1: "",
                addressLine2: "",
                city: "",
                state: "",
                postalCode: "",
                country: "",
                isDefault: false
            });

            await reloadAddresses();
            window.dispatchEvent(new Event("addresses-updated"));
            setStatusMessage("Address added successfully.");
        } catch (err) {
            setError(err.message || "Failed to add address.");
        }
    }

    async function handleDeleteAddress(id) {
        try {
            await deleteMyAddress(id);
            await reloadAddresses();
            window.dispatchEvent(new Event("addresses-updated"));
            setStatusMessage("Address deleted successfully.");
        } catch (err) {
            setError(err.message || "Failed to delete address.");
        }
    }

    async function handleDeleteAccount() {
        const confirmed = window.confirm("Are you sure you want to delete your account?");
        if (!confirmed) return;

        try {
            await deleteMyAccount();
            logout();
            navigate("/");
        } catch (err) {
            setError(err.message || "Failed to delete account.");
        }
    }

    return (
        <main className="account-page">
            <section className="account-card">
                <h1 className="account-title">My Account</h1>

                {statusMessage && <p className="account-success">{statusMessage}</p>}
                {error && <p className="account-error">{error}</p>}

                <form className="account-form" onSubmit={handleProfileSubmit}>
                    <h2 className="account-section-title">Profile</h2>

                    <label className="account-label">
                        First Name
                        <input
                            className="account-input"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                        />
                    </label>

                    <label className="account-label">
                        Last Name
                        <input
                            className="account-input"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                        />
                    </label>

                    <label className="account-label">
                        Email
                        <input
                            className="account-input"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </label>

                    <button className="account-button" type="submit">
                        Save Changes
                    </button>
                </form>

                <div className="account-form">
                    <h2 className="account-section-title">Password</h2>
                    <button className="account-button" onClick={handleSendPasswordReset}>
                        Send Password Reset Email
                    </button>
                </div>

                <div className="account-form">
                    <h2 className="account-section-title">Saved Addresses</h2>

                    <div className="account-address-list">
                        {addresses.map((address) => (
                            <div key={address.userAddressId} className="account-address-card">
                                <div>
                                    <strong>{address.fullName}</strong>
                                    {address.isDefault && (
                                        <span className="account-address-default">Default</span>
                                    )}
                                </div>

                                <p>{address.addressLine1}</p>
                                {address.addressLine2 && <p>{address.addressLine2}</p>}
                                <p>
                                    {address.city}, {address.state} {address.postalCode}
                                </p>
                                <p>{address.country}</p>

                                <button
                                    className="account-delete-button"
                                    onClick={() => handleDeleteAddress(address.userAddressId)}
                                >
                                    Delete Address
                                </button>
                            </div>
                        ))}
                    </div>

                    <form className="account-form" onSubmit={handleCreateAddress}>
                        <h3 className="account-section-title">Add Address</h3>

                        <label className="account-label">
                            Full Name
                            <input
                                className="account-input"
                                name="fullName"
                                value={addressForm.fullName}
                                onChange={handleAddressChange}
                            />
                        </label>

                        <label className="account-label">
                            Address Line 1
                            <input
                                className="account-input"
                                name="addressLine1"
                                value={addressForm.addressLine1}
                                onChange={handleAddressChange}
                            />
                        </label>

                        <label className="account-label">
                            Address Line 2
                            <input
                                className="account-input"
                                name="addressLine2"
                                value={addressForm.addressLine2}
                                onChange={handleAddressChange}
                            />
                        </label>

                        <label className="account-label">
                            City
                            <input
                                className="account-input"
                                name="city"
                                value={addressForm.city}
                                onChange={handleAddressChange}
                            />
                        </label>

                        <label className="account-label">
                            State
                            <input
                                className="account-input"
                                name="state"
                                value={addressForm.state}
                                onChange={handleAddressChange}
                            />
                        </label>

                        <label className="account-label">
                            Postal Code
                            <input
                                className="account-input"
                                name="postalCode"
                                value={addressForm.postalCode}
                                onChange={handleAddressChange}
                            />
                        </label>

                        <label className="account-label">
                            Country
                            <input
                                className="account-input"
                                name="country"
                                value={addressForm.country}
                                onChange={handleAddressChange}
                            />
                        </label>

                        <label className="account-checkbox">
                            <input
                                type="checkbox"
                                name="isDefault"
                                checked={addressForm.isDefault}
                                onChange={handleAddressChange}
                            />
                            Set as default address
                        </label>

                        <button className="account-button" type="submit">
                            Add Address
                        </button>
                    </form>
                </div>

                <div className="account-danger-zone">
                    <h2 className="account-section-title">Danger Zone</h2>

                    <button className="account-delete-button" onClick={handleDeleteAccount}>
                        Delete Account
                    </button>
                </div>
            </section>
        </main>
    );
}