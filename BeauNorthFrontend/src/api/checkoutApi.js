import { API_BASE_URL, getAuthHeaders, handleResponse } from "./apiClient";

export async function checkout(orderData) {
    const response = await fetch(`${API_BASE_URL}/Checkout`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
    });

    return handleResponse(response, "Checkout failed.");
}