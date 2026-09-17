import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    try {
      setError("");

      const response = await api.get("/orders");
      setOrders(response.data.orders || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    setError("");
    setMessage("");

    try {
      await api.patch(`/orders/${orderId}/status`, {
        status,
      });

      setMessage(
        `Order successfully updated to ${status}.`
      );

      await loadOrders();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        order.status === statusFilter;

      const searchableText = [
        order._id,
        order.customerId?.name,
        order.customerId?.email,
        order.assignedBranchId?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue ||
        searchableText.includes(searchValue);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const calculateTotal = (items) =>
    items.reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0
    );

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const countStatus = (status) =>
    orders.filter(
      (order) => order.status === status
    ).length;

  if (loading) {
    return (
      <div className="page-message">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="page-container admin-orders-page">
      <header className="admin-page-heading">
        <div>
          <span>ORDER MANAGEMENT</span>

          <h1>Orders</h1>

          <p>
            Review allocations and manage the customer
            order lifecycle.
          </p>
        </div>

        <div className="orders-total">
          <strong>{orders.length}</strong>
          <span>Total Orders</span>
        </div>
      </header>

      {message && (
        <div className="alert success">
          {message}
        </div>
      )}

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <div className="order-status-strip">
        <button
          className={
            statusFilter === "ALL"
              ? "active"
              : ""
          }
          onClick={() =>
            setStatusFilter("ALL")
          }
        >
          <strong>{orders.length}</strong>
          <span>All</span>
        </button>

        <button
          className={
            statusFilter === "ALLOCATED"
              ? "active"
              : ""
          }
          onClick={() =>
            setStatusFilter("ALLOCATED")
          }
        >
          <strong>
            {countStatus("ALLOCATED")}
          </strong>
          <span>Allocated</span>
        </button>

        <button
          className={
            statusFilter === "PROCESSING"
              ? "active"
              : ""
          }
          onClick={() =>
            setStatusFilter("PROCESSING")
          }
        >
          <strong>
            {countStatus("PROCESSING")}
          </strong>
          <span>Processing</span>
        </button>

        <button
          className={
            statusFilter === "COMPLETED"
              ? "active"
              : ""
          }
          onClick={() =>
            setStatusFilter("COMPLETED")
          }
        >
          <strong>
            {countStatus("COMPLETED")}
          </strong>
          <span>Completed</span>
        </button>

        <button
          className={
            statusFilter === "CANCELLED"
              ? "active"
              : ""
          }
          onClick={() =>
            setStatusFilter("CANCELLED")
          }
        >
          <strong>
            {countStatus("CANCELLED")}
          </strong>
          <span>Cancelled</span>
        </button>
      </div>

      <div className="orders-toolbar">
        <div className="order-search">
          <span>⌕</span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search order, customer, email or branch..."
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="ALL">
            All statuses
          </option>

          <option value="ALLOCATED">
            Allocated
          </option>

          <option value="PROCESSING">
            Processing
          </option>

          <option value="COMPLETED">
            Completed
          </option>

          <option value="CANCELLED">
            Cancelled
          </option>
        </select>
      </div>

      <div className="order-results-heading">
        <span>
          Showing {filteredOrders.length}{" "}
          {filteredOrders.length === 1
            ? "order"
            : "orders"}
        </span>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="admin-empty-state">
          <span>⌕</span>

          <h3>No matching orders</h3>

          <p>
            Try changing your search or status filter.
          </p>
        </div>
      ) : (
        <div className="admin-order-list">
          {filteredOrders.map((order) => (
            <article
              className="admin-order-row"
              key={order._id}
            >
              <div className="admin-order-main">
                <div className="admin-order-identity">
                  <div className="customer-avatar">
                    {order.customerId?.name
                      ?.charAt(0)
                      .toUpperCase() || "C"}
                  </div>

                  <div>
                    <span>
                      #
                      {order._id
                        .slice(-8)
                        .toUpperCase()}
                    </span>

                    <strong>
                      {order.customerId?.name ||
                        "Customer"}
                    </strong>

                    <small>
                      {order.customerId?.email ||
                        "No email"}
                    </small>
                  </div>
                </div>

                <div className="admin-order-detail">
                  <span>Branch</span>

                  <strong>
                    {order.assignedBranchId?.name ||
                      "Unassigned"}
                  </strong>
                </div>

                <div className="admin-order-detail">
                  <span>Items</span>

                  <strong>
                    {order.items.reduce(
                      (total, item) =>
                        total + item.quantity,
                      0
                    )}
                  </strong>
                </div>

                <div className="admin-order-detail">
                  <span>Total</span>

                  <strong className="admin-order-price">
                    Rs.{" "}
                    {calculateTotal(
                      order.items
                    ).toLocaleString()}
                  </strong>
                </div>

                <div className="admin-order-detail">
                  <span>Created</span>

                  <strong>
                    {formatDate(order.createdAt)}
                  </strong>
                </div>

                <span
                  className={`status-badge status-${order.status.toLowerCase()}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="admin-order-footer">
                <div className="allocation-mini">
                  <span>⚡</span>

                  <p>
                    {order.allocationReason ||
                      "No allocation details available."}
                  </p>
                </div>

                <div className="admin-order-actions">
                  {order.status ===
                    "ALLOCATED" && (
                    <button
                      className="process-button"
                      disabled={
                        updatingId === order._id
                      }
                      onClick={() =>
                        updateStatus(
                          order._id,
                          "PROCESSING"
                        )
                      }
                    >
                      {updatingId === order._id
                        ? "Updating..."
                        : "Start Processing →"}
                    </button>
                  )}

                  {order.status ===
                    "PROCESSING" && (
                    <button
                      className="complete-button"
                      disabled={
                        updatingId === order._id
                      }
                      onClick={() =>
                        updateStatus(
                          order._id,
                          "COMPLETED"
                        )
                      }
                    >
                      {updatingId === order._id
                        ? "Updating..."
                        : "Mark Completed ✓"}
                    </button>
                  )}

                  {order.status ===
                    "COMPLETED" && (
                    <span className="no-action-text">
                      Order completed
                    </span>
                  )}

                  {order.status ===
                    "CANCELLED" && (
                    <span className="no-action-text">
                      No action required
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;