import { API_BASE_URL, handleResponse } from "./apiClient";

export async function getShippingAddresses() {
    const response = await fetch(`${API_BASE_URL}/ShippingAddress`);
    return handleResponse(response, "Failed to fetch shipping addresses.");
}

export async function getShippingAddressById(id) {
    const response = await fetch(`${API_BASE_URL}/ShippingAddress/${id}`);
    return handleResponse(response, "Failed to fetch shipping address.");
}

export async function createShippingAddress(shippingAddress) {
    const response = await fetch(`${API_BASE_URL}/ShippingAddress`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(shippingAddress)
    });

    return handleResponse(response, "Failed to create shipping address.");
}

export async function updateShippingAddress(id, shippingAddress) {
    const response = await fetch(`${API_BASE_URL}/ShippingAddress/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(shippingAddress)
    });

    return handleResponse(response, "Failed to update shipping address.");
}

export async function deleteShippingAddress(id) {
    const response = await fetch(`${API_BASE_URL}/ShippingAddress/${id}`, {
        method: "DELETE"
    });

    return handleResponse(response, "Failed to delete shipping address.");
}