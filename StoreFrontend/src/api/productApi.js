import { API_BASE_URL, handleResponse } from "./apiClient";

export async function getProducts() {
    const response = await fetch(`${API_BASE_URL}/Product`);
    return handleResponse(response, "Failed to fetch products.");
}

export async function getProductById(id) {
    const response = await fetch(`${API_BASE_URL}/Product/${id}`);
    return handleResponse(response, "Failed to fetch product.");
}

export async function createProduct(product) {
    const response = await fetch(`${API_BASE_URL}/Product`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(product)
    });

    return handleResponse(response, "Failed to create product.");
}

export async function updateProduct(id, product) {
    const response = await fetch(`${API_BASE_URL}/Product/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(product)
    });

    return handleResponse(response, "Failed to update product.");
}

export async function deleteProduct(id) {
    const response = await fetch(`${API_BASE_URL}/Product/${id}`, {
        method: "DELETE"
    });

    return handleResponse(response, "Failed to delete product.");
}