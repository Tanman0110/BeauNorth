import { API_BASE_URL, getAuthHeaders, handleResponse } from "./apiClient";

export async function getMyAccount() {
    const response = await fetch(`${API_BASE_URL}/User/me`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to fetch account.");
}

export async function updateMyAccount(accountData) {
    const response = await fetch(`${API_BASE_URL}/User/me`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(accountData)
    });

    return handleResponse(response, "Failed to update account.");
}

export async function changeMyPassword(passwordData) {
    const response = await fetch(`${API_BASE_URL}/User/me/password`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordData)
    });

    return handleResponse(response, "Failed to change password.");
}

export async function deleteMyAccount() {
    const response = await fetch(`${API_BASE_URL}/User/me`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to delete account.");
}