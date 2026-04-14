import { API_BASE_URL, getAuthHeaders, handleResponse } from "./apiClient";

export async function getMyCart() {
    const response = await fetch(`${API_BASE_URL}/Cart/me`, {
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to fetch cart.");
}

export async function addItemToCart(cartItem) {
    const response = await fetch(`${API_BASE_URL}/Cart/items`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(cartItem)
    });

    return handleResponse(response, "Failed to add item to cart.");
}

export async function updateCartItem(cartItemId, quantity) {
    const response = await fetch(`${API_BASE_URL}/Cart/items/${cartItemId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantity })
    });

    return handleResponse(response, "Failed to update cart item.");
}

export async function removeCartItem(cartItemId) {
    const response = await fetch(`${API_BASE_URL}/Cart/items/${cartItemId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to remove cart item.");
}

export async function clearMyCart() {
    const response = await fetch(`${API_BASE_URL}/Cart/me`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    return handleResponse(response, "Failed to clear cart.");
}