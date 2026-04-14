import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./LoginPage.css";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    function validateForm() {
        if (!formData.email.trim()) {
            return "Email is required.";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
            return "Enter a valid email address.";
        }

        if (!formData.password.trim()) {
            return "Password is required.";
        }

        if (formData.password.length < 8) {
            return "Password must be at least 8 characters.";
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
            await login({
                email: formData.email.trim(),
                password: formData.password
            });

            navigate("/");
        } catch (err) {
            setError(err.message || "Login failed.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <h1 className="auth-title">Login</h1>
                <p className="auth-subtitle">Sign in to your account.</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="auth-label">
                        Email
                        <input
                            className="auth-input"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </label>

                    <label className="auth-label">
                        Password
                        <input
                            className="auth-input"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </label>

                    <div>
                        <Link to="/forgot-password">Forgot password?</Link>
                    </div>

                    {error && <p className="auth-error">{error}</p>}

                    <button className="auth-button" type="submit" disabled={submitting}>
                        {submitting ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don’t have an account? <Link to="/register">Register</Link>
                </p>
            </section>
        </main>
    );
}