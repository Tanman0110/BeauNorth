import { API_BASE_URL, handleResponse } from "./apiClient";

export async function getCategories() {
    const response = await fetch(`${API_BASE_URL}/Category`);
    return handleResponse(response, "Failed to fetch categories.");
}

export async function getCategoryById(id) {
    const response = await fetch(`${API_BASE_URL}/Category/${id}`);
    return handleResponse(response, "Failed to fetch category.");
}

export async function createCategory(category) {
    const response = await fetch(`${API_BASE_URL}/Category`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(category)
    });

    return handleResponse(response, "Failed to create category.");
}

export async function updateCategory(id, category) {
    const response = await fetch(`${API_BASE_URL}/Category/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(category)
    });

    return handleResponse(response, "Failed to update category.");
}

export async function deleteCategory(id) {
    const response = await fetch(`${API_BASE_URL}/Category/${id}`, {
        method: "DELETE"
    });

    return handleResponse(response, "Failed to delete category.");
}