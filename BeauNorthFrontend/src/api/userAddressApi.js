import { API_BASE_URL, getAuthHeaders, handleResponse } from "./apiClient";

export async function getMyAddresses() {
    const response = await fetch(`${API_BASE_URL}/UserAddress/me`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to fetch addresses.");
}

export async function createMyAddress(addressData) {
    const response = await fetch(`${API_BASE_URL}/UserAddress/me`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(addressData)
    });

    return handleResponse(response, "Failed to create address.");
}

export async function updateMyAddress(id, addressData) {
    const response = await fetch(`${API_BASE_URL}/UserAddress/me/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(addressData)
    });

    return handleResponse(response, "Failed to update address.");
}

export async function deleteMyAddress(id) {
    const response = await fetch(`${API_BASE_URL}/UserAddress/me/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to delete address.");
}