import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { changeMyPassword, deleteMyAccount, getMyAccount, updateMyAccount } from "../api/userApi";
import "./AccountPage.css";

export default function AccountPage() {
    const navigate = useNavigate();
    const { isAuthenticated, loading, logout } = useAuth();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: ""
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: ""
    });

    const [statusMessage, setStatusMessage] = useState("");
    const [error, setError] = useState("");
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        async function loadAccount() {
            try {
                const user = await getMyAccount();
                setFormData({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
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

    function handlePasswordChange(event) {
        const { name, value } = event.target;
        setPasswordData((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    async function handleProfileSubmit(event) {
        event.preventDefault();
        setError("");
        setStatusMessage("");

        try {
            await updateMyAccount({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim()
            });

            setStatusMessage("Account updated successfully.");
        } catch (err) {
            setError(err.message || "Failed to update account.");
        }
    }

    async function handlePasswordSubmit(event) {
        event.preventDefault();
        setError("");
        setStatusMessage("");

        try {
            await changeMyPassword(passwordData);
            setPasswordData({
                currentPassword: "",
                newPassword: ""
            });
            setStatusMessage("Password changed successfully.");
        } catch (err) {
            setError(err.message || "Failed to change password.");
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
                        <input className="account-input" name="firstName" value={formData.firstName} onChange={handleChange} />
                    </label>

                    <label className="account-label">
                        Last Name
                        <input className="account-input" name="lastName" value={formData.lastName} onChange={handleChange} />
                    </label>

                    <label className="account-label">
                        Email
                        <input className="account-input" name="email" value={formData.email} onChange={handleChange} />
                    </label>

                    <button className="account-button" type="submit">
                        Save Changes
                    </button>
                </form>

                <form className="account-form" onSubmit={handlePasswordSubmit}>
                    <h2 className="account-section-title">Change Password</h2>

                    <label className="account-label">
                        Current Password
                        <input className="account-input" type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                    </label>

                    <label className="account-label">
                        New Password
                        <input className="account-input" type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} />
                    </label>

                    <button className="account-button" type="submit">
                        Update Password
                    </button>
                </form>

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