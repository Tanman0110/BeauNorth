import { API_BASE_URL, getAuthHeaders, handleResponse } from "./apiClient";

export async function getAdminCategories() {
    const response = await fetch(`${API_BASE_URL}/Category`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to fetch categories.");
}

export async function createCategory(categoryData) {
    const response = await fetch(`${API_BASE_URL}/Category`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData)
    });

    return handleResponse(response, "Failed to create category.");
}

export async function updateCategory(id, categoryData) {
    const response = await fetch(`${API_BASE_URL}/Category/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData)
    });

    return handleResponse(response, "Failed to update category.");
}

export async function deleteCategory(id) {
    const response = await fetch(`${API_BASE_URL}/Category/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to delete category.");
}