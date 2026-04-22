import { API_BASE_URL, getAuthHeaders, handleResponse } from "./apiClient";

export async function checkout(orderData) {
    const response = await fetch(`${API_BASE_URL}/Checkout`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
    });

    return handleResponse(response, "Checkout failed.");
}

export async function createPayPalOrder(checkoutData) {
    const response = await fetch(`${API_BASE_URL}/Checkout/paypal/create-order`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(checkoutData)
    });

    return handleResponse(response, "Failed to create PayPal order.");
}

export async function capturePayPalOrder(orderId, payPalOrderId) {
    const response = await fetch(`${API_BASE_URL}/Checkout/paypal/capture-order`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            orderId,
            payPalOrderId
        })
    });

    return handleResponse(response, "Failed to capture PayPal order.");
}