import { API_BASE_URL, getAuthHeaders, handleResponse } from "./apiClient";

export async function getApliiqConfigStatus() {
    const response = await fetch(`${API_BASE_URL}/Apliiq/config-status`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to get Apliiq config status.");
}