import { API_BASE_URL, getAuthHeaders, handleResponse } from "./apiClient";

export async function getAdminProducts() {
    const response = await fetch(`${API_BASE_URL}/Product`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to fetch products.");
}

export async function createProduct(productData) {
    const response = await fetch(`${API_BASE_URL}/Product`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
    });

    return handleResponse(response, "Failed to create product.");
}

export async function updateProduct(id, productData) {
    const response = await fetch(`${API_BASE_URL}/Product/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
    });

    return handleResponse(response, "Failed to update product.");
}

export async function deleteProduct(id) {
    const response = await fetch(`${API_BASE_URL}/Product/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to delete product.");
}