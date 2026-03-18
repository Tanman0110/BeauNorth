import { API_BASE_URL, handleResponse } from "./apiClient";

export async function getCarts() {
    const response = await fetch(`${API_BASE_URL}/Cart`);
    return handleResponse(response, "Failed to fetch carts.");
}

export async function getCartById(id) {
    const response = await fetch(`${API_BASE_URL}/Cart/${id}`);
    return handleResponse(response, "Failed to fetch cart.");
}

export async function createCart(cart) {
    const response = await fetch(`${API_BASE_URL}/Cart`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(cart)
    });

    return handleResponse(response, "Failed to create cart.");
}

export async function updateCart(id, cart) {
    const response = await fetch(`${API_BASE_URL}/Cart/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(cart)
    });

    return handleResponse(response, "Failed to update cart.");
}

export async function deleteCart(id) {
    const response = await fetch(`${API_BASE_URL}/Cart/${id}`, {
        method: "DELETE"
    });

    return handleResponse(response, "Failed to delete cart.");
}