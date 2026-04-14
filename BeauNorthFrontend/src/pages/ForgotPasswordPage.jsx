import { useState } from "react";
import { forgotPassword } from "../api/authApi";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError("Email is required.");
            return;
        }

        if (!isValidEmail(trimmedEmail)) {
            setError("Enter a valid email address.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await forgotPassword(trimmedEmail);
            setMessage(response.message || "If that email exists, a reset link has been sent.");
        } catch (err) {
            setError(err.message || "Failed to send reset email.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="forgot-password-page">
            <section className="forgot-password-card">
                <h1 className="forgot-password-title">Forgot Password</h1>
                <p className="forgot-password-subtitle">
                    Enter your email and we’ll send you a reset link.
                </p>

                <form className="forgot-password-form" onSubmit={handleSubmit}>
                    <label className="forgot-password-label">
                        Email
                        <input
                            className="forgot-password-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>

                    {error && <p className="forgot-password-error">{error}</p>}
                    {message && <p className="forgot-password-success">{message}</p>}

                    <button
                        className="forgot-password-button"
                        type="submit"
                        disabled={submitting}
                    >
                        {submitting ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>
            </section>
        </main>
    );
}