import { API_BASE_URL, handleResponse } from "./apiClient";

export async function getPayments() {
    const response = await fetch(`${API_BASE_URL}/Payment`);
    return handleResponse(response, "Failed to fetch payments.");
}

export async function getPaymentById(id) {
    const response = await fetch(`${API_BASE_URL}/Payment/${id}`);
    return handleResponse(response, "Failed to fetch payment.");
}

export async function createPayment(payment) {
    const response = await fetch(`${API_BASE_URL}/Payment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payment)
    });

    return handleResponse(response, "Failed to create payment.");
}

export async function updatePayment(id, payment) {
    const response = await fetch(`${API_BASE_URL}/Payment/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payment)
    });

    return handleResponse(response, "Failed to update payment.");
}

export async function deletePayment(id) {
    const response = await fetch(`${API_BASE_URL}/Payment/${id}`, {
        method: "DELETE"
    });

    return handleResponse(response, "Failed to delete payment.");
}