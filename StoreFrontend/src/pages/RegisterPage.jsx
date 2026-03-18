import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./RegisterPage.css";

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
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

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            await register(formData);
            navigate("/account");
        } catch (err) {
            setError(err.message || "Registration failed.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Register to start shopping.</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label className="auth-label">
                        First Name
                        <input
                            className="auth-input"
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="auth-label">
                        Last Name
                        <input
                            className="auth-input"
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="auth-label">
                        Email
                        <input
                            className="auth-input"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
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
                            required
                        />
                    </label>

                    {error && <p className="auth-error">{error}</p>}

                    <button className="auth-button" type="submit" disabled={submitting}>
                        {submitting ? "Creating Account..." : "Register"}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </section>
        </main>
    );
}