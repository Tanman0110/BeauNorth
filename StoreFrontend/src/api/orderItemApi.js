import { API_BASE_URL, handleResponse } from "./apiClient";

export async function getOrderItems() {
    const response = await fetch(`${API_BASE_URL}/OrderItem`);
    return handleResponse(response, "Failed to fetch order items.");
}

export async function getOrderItemById(id) {
    const response = await fetch(`${API_BASE_URL}/OrderItem/${id}`);
    return handleResponse(response, "Failed to fetch order item.");
}

export async function createOrderItem(orderItem) {
    const response = await fetch(`${API_BASE_URL}/OrderItem`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(orderItem)
    });

    return handleResponse(response, "Failed to create order item.");
}

export async function updateOrderItem(id, orderItem) {
    const response = await fetch(`${API_BASE_URL}/OrderItem/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(orderItem)
    });

    return handleResponse(response, "Failed to update order item.");
}

export async function deleteOrderItem(id) {
    const response = await fetch(`${API_BASE_URL}/OrderItem/${id}`, {
        method: "DELETE"
    });

    return handleResponse(response, "Failed to delete order item.");
}