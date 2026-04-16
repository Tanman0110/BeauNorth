import { API_BASE_URL, getAuthHeaders, handleResponse } from "./apiClient";

export async function getApliiqConfigStatus() {
    const response = await fetch(`${API_BASE_URL}/Apliiq/config-status`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to fetch Apliiq configuration status.");
}

export async function getApliiqOrder(providerOrderId) {
    const response = await fetch(`${API_BASE_URL}/Apliiq/order/${providerOrderId}`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to fetch Apliiq order.");
}