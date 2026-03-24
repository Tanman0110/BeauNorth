import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import { useAuth } from "../context/useAuth";
import {
    deleteMyAccount,
    getMyAccount,
    updateMyAccount
} from "../api/userApi";
import "./AccountPage.css";

export default function AccountPage() {
    const navigate = useNavigate();
    const { isAuthenticated, loading, logout } = useAuth();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: ""
    });

    const [statusMessage, setStatusMessage] = useState("");
    const [error, setError] = useState("");
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        async function loadAccount() {
            try {
                const user = await getMyAccount();
                setFormData({
                    firstName: user.firstName ?? "",
                    lastName: user.lastName ?? "",
                    email: user.email ?? ""
                });
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

    function isValidName(name) {
        return /^[A-Za-z]+([ '-][A-Za-z]+)*$/.test(name);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async function handleProfileSubmit(event) {
        event.preventDefault();
        setError("");
        setStatusMessage("");

        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();

        if (!firstName) {
            setError("First name is required.");
            return;
        }

        if (!isValidName(firstName)) {
            setError("First name contains invalid characters.");
            return;
        }

        if (!lastName) {
            setError("Last name is required.");
            return;
        }

        if (!isValidName(lastName)) {
            setError("Last name contains invalid characters.");
            return;
        }

        if (!email) {
            setError("Email is required.");
            return;
        }

        if (!isValidEmail(email)) {
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

    async function handleDeleteAccount() {
        const confirmed = window.confirm("Are you sure you want to delete your account?");

        if (!confirmed) {
            return;
        }

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

                <div className="account-danger-zone">
                    <h2 className="account-section-title">Danger Zone</h2>

                    <button
                        className="account-delete-button"
                        onClick={handleDeleteAccount}
                    >
                        Delete Account
                    </button>
                </div>
            </section>
        </main>
    );
}