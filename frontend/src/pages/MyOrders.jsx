import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const MyOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = async () => {
    try {
      setError("");

      const response = await api.get("/orders/my");
      setOrders(response.data.orders || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load your orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancel = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    setCancellingId(orderId);
    setError("");
    setMessage("");

    try {
      await api.patch(`/orders/${orderId}/cancel`);

      setMessage("Order cancelled successfully.");
      await loadOrders();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to cancel this order."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateTotal = (items) => {
    return items.reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0
    );
  };

  const getStatusCount = (status) => {
    return orders.filter(
      (order) => order.status === status
    ).length;
  };

  if (loading) {
    return (
      <div className="page-message">
        Loading your orders...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="orders-heading">
        <div>
          <h1>My Orders</h1>
          <p>
            Track your orders and manage your purchases.
          </p>
        </div>

        <button
          className="new-order-button"
          onClick={() => navigate("/dashboard")}
        >
          + Place New Order
        </button>
      </div>

      {message && (
        <div className="alert success">{message}</div>
      )}

      {error && (
        <div className="alert error">{error}</div>
      )}

      {orders.length > 0 && (
        <div className="order-summary">
          <div className="summary-item">
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </div>

          <div className="summary-item">
            <span>Allocated</span>
            <strong>
              {getStatusCount("ALLOCATED")}
            </strong>
          </div>

          <div className="summary-item">
            <span>Processing</span>
            <strong>
              {getStatusCount("PROCESSING")}
            </strong>
          </div>

          <div className="summary-item">
            <span>Completed</span>
            <strong>
              {getStatusCount("COMPLETED")}
            </strong>
          </div>

          <div className="summary-item">
            <span>Cancelled</span>
            <strong>
              {getStatusCount("CANCELLED")}
            </strong>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-orders-icon">📦</div>

          <h2>No orders yet</h2>

          <p>
            Your orders will appear here after you make
            your first purchase.
          </p>

          <button
            className="new-order-button"
            onClick={() => navigate("/dashboard")}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="compact-orders-list">
          {orders.map((order) => (
            <article
              className="compact-order-card"
              key={order._id}
            >
              <div className="compact-order-top">
                <div>
                  <span className="small-label">
                    ORDER
                  </span>

                  <h3>
                    #{order._id
                      .slice(-8)
                      .toUpperCase()}
                  </h3>

                  <p>{formatDate(order.createdAt)}</p>
                </div>

                <span
                  className={`status-badge status-${order.status.toLowerCase()}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="compact-order-body">
                <div className="compact-product">
                  <div className="compact-product-icon">
                    📦
                  </div>

                  <div>
                    <strong>
                      {order.items[0]?.productId?.name ||
                        "Product"}
                    </strong>

                    <p>
                      {order.items.length === 1
                        ? order.items[0]?.productId?.sku
                        : `${order.items.length} products`}
                    </p>
                  </div>
                </div>

                <div className="compact-info">
                  <span>Quantity</span>
                  <strong>
                    {order.items.reduce(
                      (total, item) =>
                        total + item.quantity,
                      0
                    )}
                  </strong>
                </div>

                <div className="compact-info">
                  <span>Total</span>
                  <strong className="order-price">
                    Rs.{" "}
                    {calculateTotal(
                      order.items
                    ).toLocaleString()}
                  </strong>
                </div>

                <div className="compact-info branch-info">
                  <span>Assigned Branch</span>
                  <strong>
                    {order.assignedBranchId?.name ||
                      "Not assigned"}
                  </strong>
                </div>
              </div>

              <div className="compact-order-bottom">
                <div className="allocation-summary">
                  <span>⚡</span>

                  <p>
                    {order.allocationReason ||
                      "Smart branch allocation completed."}
                  </p>
                </div>

                {["PENDING", "ALLOCATED"].includes(
                  order.status
                ) && (
                  <button
                    className="compact-cancel-button"
                    onClick={() =>
                      handleCancel(order._id)
                    }
                    disabled={
                      cancellingId === order._id
                    }
                  >
                    {cancellingId === order._id
                      ? "Cancelling..."
                      : "Cancel Order"}
                  </button>
                )}
              </div>

              {order.customerMessage && (
                <div className="compact-note">
                  <strong>Note:</strong>{" "}
                  {order.customerMessage}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;