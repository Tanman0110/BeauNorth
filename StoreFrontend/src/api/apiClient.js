const API_BASE_URL = "http://localhost:5149/api";

async function handleResponse(response, errorMessage) {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || errorMessage);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

function getAuthHeaders() {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : ""
    };
}

export { API_BASE_URL, handleResponse, getAuthHeaders };