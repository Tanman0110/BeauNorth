import { API_BASE_URL, handleResponse } from "./apiClient";

export async function getCartItems() {
    const response = await fetch(`${API_BASE_URL}/CartItem`);
    return handleResponse(response, "Failed to fetch cart items.");
}

export async function getCartItemById(id) {
    const response = await fetch(`${API_BASE_URL}/CartItem/${id}`);
    return handleResponse(response, "Failed to fetch cart item.");
}

export async function createCartItem(cartItem) {
    const response = await fetch(`${API_BASE_URL}/CartItem`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(cartItem)
    });

    return handleResponse(response, "Failed to create cart item.");
}

export async function updateCartItem(id, cartItem) {
    const response = await fetch(`${API_BASE_URL}/CartItem/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(cartItem)
    });

    return handleResponse(response, "Failed to update cart item.");
}

export async function deleteCartItem(id) {
    const response = await fetch(`${API_BASE_URL}/CartItem/${id}`, {
        method: "DELETE"
    });

    return handleResponse(response, "Failed to delete cart item.");
}