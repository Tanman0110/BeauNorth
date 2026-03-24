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
        password: "",
        confirmPassword: ""
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

    function isValidName(name) {
        const nameRegex = /^[A-Za-z]+([ '-][A-Za-z]+)*$/;
        return nameRegex.test(name);
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isStrongPassword(password) {
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
        return passwordRegex.test(password);
    }

    function validateForm() {
        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();
        const email = formData.email.trim();

        const reservedWords = ["admin", "root", "system", "null", "owner", "support"];

        if (!firstName) {
            return "First name is required.";
        }

        if (!isValidName(firstName)) {
            return "First name contains invalid characters.";
        }

        if (reservedWords.includes(firstName.toLowerCase())) {
            return "That first name is not allowed.";
        }

        if (!lastName) {
            return "Last name is required.";
        }

        if (!isValidName(lastName)) {
            return "Last name contains invalid characters.";
        }

        if (reservedWords.includes(lastName.toLowerCase())) {
            return "That last name is not allowed.";
        }

        if (!email) {
            return "Email is required.";
        }

        if (!isValidEmail(email)) {
            return "Enter a valid email address.";
        }

        if (!isStrongPassword(formData.password)) {
            return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
        }

        if (formData.password !== formData.confirmPassword) {
            return "Passwords do not match.";
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
            await register({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                password: formData.password
            });

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

                    <label className="auth-label">
                        Confirm Password
                        <input
                            className="auth-input"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
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