import { API_BASE_URL, handleResponse } from "./apiClient";

export async function registerUser(registerData) {
    const response = await fetch(`${API_BASE_URL}/Auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(registerData)
    });

    return handleResponse(response, "Failed to register.");
}

export async function loginUser(loginData) {
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
    });

    return handleResponse(response, "Failed to login.");
}

export async function getCurrentUser(token) {
    const response = await fetch(`${API_BASE_URL}/Auth/me`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return handleResponse(response, "Failed to fetch current user.");
}

export async function forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/Auth/forgot-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
    });

    return handleResponse(response, "Failed to send reset email.");
}

export async function resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/Auth/reset-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            token,
            newPassword
        })
    });

    return handleResponse(response, "Failed to reset password.");
}