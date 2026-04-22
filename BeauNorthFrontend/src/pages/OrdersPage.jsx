import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getMyOrders } from "../api/orderApi";
import "./OrdersPage.css";

export default function OrdersPage() {
    const location = useLocation();
    const { isAuthenticated, loading } = useAuth();

    const [orders, setOrders] = useState([]);
    const [error, setError] = useState("");
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        async function loadOrders() {
            try {
                const data = await getMyOrders();
                setOrders(data);
            } catch (err) {
                setError(err.message || "Failed to load orders.");
            } finally {
                setPageLoading(false);
            }
        }

        if (!loading && isAuthenticated) {
            loadOrders();
        } else if (!loading) {
            setPageLoading(false);
        }
    }, [loading, isAuthenticated]);

    if (loading || pageLoading) {
        return <p className="orders-status">Loading orders...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <main className="orders-page">
            <section className="orders-section">
                <h1 className="orders-title">My Orders</h1>

                {location.state?.successMessage && (
                    <p className="orders-success">{location.state.successMessage}</p>
                )}

                {error && <p className="orders-error">{error}</p>}

                {orders.length === 0 ? (
                    <p>No orders yet.</p>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => (
                            <article key={order.orderId} className="order-card">
                                <div className="order-card-header">
                                    <h2>{order.orderNumber}</h2>
                                    <span>{order.status}</span>
                                </div>

                                <p><strong>Total:</strong> ${Number(order.totalAmount).toFixed(2)}</p>
                                <p><strong>Placed:</strong> {new Date(order.createdAt).toLocaleString()}</p>

                                {order.fulfillmentOrder && (
                                    <div className="order-fulfillment-box">
                                        <h3 className="order-fulfillment-title">Fulfillment</h3>
                                        <p><strong>Provider:</strong> {order.fulfillmentOrder.provider || "N/A"}</p>
                                        <p><strong>Status:</strong> {order.fulfillmentOrder.fulfillmentStatus || "Pending"}</p>

                                        {order.fulfillmentOrder.trackingNumber && (
                                            <p><strong>Tracking Number:</strong> {order.fulfillmentOrder.trackingNumber}</p>
                                        )}

                                        {order.fulfillmentOrder.trackingUrl && (
                                            <p>
                                                <a
                                                    href={order.fulfillmentOrder.trackingUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="order-tracking-link"
                                                >
                                                    Track Package
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="order-items">
                                    {order.orderItems?.map((item) => (
                                        <div key={item.orderItemId} className="order-item-row">
                                            <span>{item.productNameSnapshot}</span>
                                            <span>{item.quantity} × ${Number(item.unitPrice).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}