import { API_BASE_URL, getAuthHeaders, handleResponse } from "./apiClient";

export async function getMyOrders() {
    const response = await fetch(`${API_BASE_URL}/Order/me`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to fetch orders.");
}

export async function getMyOrderById(id) {
    const response = await fetch(`${API_BASE_URL}/Order/me/${id}`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to fetch order.");
}