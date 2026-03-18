import { API_BASE_URL, handleResponse } from "./apiClient";

export async function getUsers() {
    const response = await fetch(`${API_BASE_URL}/User`);
    return handleResponse(response, "Failed to fetch users.");
}

export async function getUserById(id) {
    const response = await fetch(`${API_BASE_URL}/User/${id}`);
    return handleResponse(response, "Failed to fetch user.");
}

export async function createUser(user) {
    const response = await fetch(`${API_BASE_URL}/User`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    });

    return handleResponse(response, "Failed to create user.");
}

export async function updateUser(id, user) {
    const response = await fetch(`${API_BASE_URL}/User/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    });

    return handleResponse(response, "Failed to update user.");
}

export async function deleteUser(id) {
    const response = await fetch(`${API_BASE_URL}/User/${id}`, {
        method: "DELETE"
    });

    return handleResponse(response, "Failed to delete user.");
}