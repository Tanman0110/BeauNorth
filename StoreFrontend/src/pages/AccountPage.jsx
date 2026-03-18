import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./AccountPage.css";

export default function AccountPage() {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return <p className="account-status">Loading account...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <main className="account-page">
            <section className="account-card">
                <h1 className="account-title">My Account</h1>
                <p className="account-subtitle">Your current account details.</p>

                <div className="account-grid">
                    <div className="account-row">
                        <span className="account-label">First Name</span>
                        <strong>{user.firstName}</strong>
                    </div>

                    <div className="account-row">
                        <span className="account-label">Last Name</span>
                        <strong>{user.lastName}</strong>
                    </div>

                    <div className="account-row">
                        <span className="account-label">Email</span>
                        <strong>{user.email}</strong>
                    </div>

                    <div className="account-row">
                        <span className="account-label">Role</span>
                        <strong>{user.role}</strong>
                    </div>
                </div>
            </section>
        </main>
    );
}