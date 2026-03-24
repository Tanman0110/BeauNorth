import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import "./ResetPasswordPage.css";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    function isStrongPassword(password) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!token) {
            setError("Missing reset token.");
            return;
        }

        if (!isStrongPassword(newPassword)) {
            setError(
                "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await resetPassword(token, newPassword);
            setMessage(response.message || "Password reset successfully.");

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (err) {
            setError(err.message || "Failed to reset password.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="reset-password-page">
            <section className="reset-password-card">
                <h1 className="reset-password-title">Reset Password</h1>

                <form className="reset-password-form" onSubmit={handleSubmit}>
                    <label className="reset-password-label">
                        New Password
                        <input
                            className="reset-password-input"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </label>

                    <label className="reset-password-label">
                        Confirm New Password
                        <input
                            className="reset-password-input"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </label>

                    {error && <p className="reset-password-error">{error}</p>}
                    {message && <p className="reset-password-success">{message}</p>}

                    <button
                        className="reset-password-button"
                        type="submit"
                        disabled={submitting}
                    >
                        {submitting ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </section>
        </main>
    );
}