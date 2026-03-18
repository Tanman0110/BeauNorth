import { API_BASE_URL, handleResponse } from "./apiClient";

export async function getOrders() {
    const response = await fetch(`${API_BASE_URL}/Order`);
    return handleResponse(response, "Failed to fetch orders.");
}

export async function getOrderById(id) {
    const response = await fetch(`${API_BASE_URL}/Order/${id}`);
    return handleResponse(response, "Failed to fetch order.");
}

export async function createOrder(order) {
    const response = await fetch(`${API_BASE_URL}/Order`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(order)
    });

    return handleResponse(response, "Failed to create order.");
}

export async function updateOrder(id, order) {
    const response = await fetch(`${API_BASE_URL}/Order/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(order)
    });

    return handleResponse(response, "Failed to update order.");
}

export async function deleteOrder(id) {
    const response = await fetch(`${API_BASE_URL}/Order/${id}`, {
        method: "DELETE"
    });

    return handleResponse(response, "Failed to delete order.");
}