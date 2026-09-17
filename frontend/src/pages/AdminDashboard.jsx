import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setError("");

        const [
          ordersResponse,
          branchesResponse,
          productsResponse,
        ] = await Promise.all([
          api.get("/orders"),
          api.get("/branches"),
          api.get("/products"),
        ]);

        setOrders(ordersResponse.data.orders || []);
        setBranches(branchesResponse.data.branches || []);
        setProducts(productsResponse.data.products || []);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Unable to load admin dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const countStatus = (status) =>
    orders.filter((order) => order.status === status).length;

  const activeOrders = orders.filter((order) =>
    ["ALLOCATED", "PROCESSING"].includes(order.status)
  ).length;

  const completedOrders = countStatus("COMPLETED");
  const allocatedOrders = countStatus("ALLOCATED");
  const processingOrders = countStatus("PROCESSING");
  const cancelledOrders = countStatus("CANCELLED");

  const completionRate =
    orders.length > 0
      ? Math.round((completedOrders / orders.length) * 100)
      : 0;

  const recentOrders = orders.slice(0, 4);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="page-message">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="page-container modern-admin">
      {error && <div className="alert error">{error}</div>}

      <section className="admin-hero">
        <div className="admin-hero-content">
          <span className="admin-eyebrow">
            SMARTORDER / ADMIN
          </span>

          <h1>
            Good to see you,
            <br />
            <span>{user?.name}</span>
          </h1>

          <p>
            Here's what's happening across your order
            allocation network.
          </p>

          <button
            className="hero-action"
            onClick={() => navigate("/admin/orders")}
          >
            Manage Orders
            <span>→</span>
          </button>
        </div>

        <div className="hero-visual">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />

          <div className="hero-center">
            <span>⚡</span>
            <strong>{activeOrders}</strong>
            <small>Active Orders</small>
          </div>

          <div className="floating-stat floating-one">
            <span>Branches</span>
            <strong>{branches.length}</strong>
          </div>

          <div className="floating-stat floating-two">
            <span>Products</span>
            <strong>{products.length}</strong>
          </div>
        </div>
      </section>

      <section className="admin-metrics">
        <div className="metric">
          <div className="metric-top">
            <span>Total Orders</span>
            <div className="metric-symbol">↗</div>
          </div>

          <strong>{orders.length}</strong>
          <p>Orders recorded in the system</p>
        </div>

        <div className="metric">
          <div className="metric-top">
            <span>Active Now</span>
            <div className="metric-symbol purple-symbol">
              ⚡
            </div>
          </div>

          <strong>{activeOrders}</strong>
          <p>Allocated or being processed</p>
        </div>

        <div className="metric">
          <div className="metric-top">
            <span>Completed</span>
            <div className="metric-symbol green-symbol">
              ✓
            </div>
          </div>

          <strong>{completedOrders}</strong>
          <p>{completionRate}% of all orders</p>
        </div>

        <div className="metric">
          <div className="metric-top">
            <span>Network</span>
            <div className="metric-symbol orange-symbol">
              ◉
            </div>
          </div>

          <strong>{branches.length}</strong>
          <p>Active allocation branches</p>
        </div>
      </section>

      <div className="admin-dashboard-grid">
        <section className="workflow-section">
          <div className="modern-section-title">
            <div>
              <span>ORDER FLOW</span>
              <h2>Allocation Pipeline</h2>
            </div>

            <button
              onClick={() => navigate("/admin/orders")}
            >
              View all →
            </button>
          </div>

          <div className="pipeline">
            <div className="pipeline-stage">
              <div className="pipeline-number blue-number">
                {allocatedOrders}
              </div>

              <div>
                <strong>Allocated</strong>
                <span>Branch assigned</span>
              </div>
            </div>

            <div className="pipeline-line">
              <span>→</span>
            </div>

            <div className="pipeline-stage">
              <div className="pipeline-number purple-number">
                {processingOrders}
              </div>

              <div>
                <strong>Processing</strong>
                <span>Being prepared</span>
              </div>
            </div>

            <div className="pipeline-line">
              <span>→</span>
            </div>

            <div className="pipeline-stage">
              <div className="pipeline-number green-number">
                {completedOrders}
              </div>

              <div>
                <strong>Completed</strong>
                <span>Order finished</span>
              </div>
            </div>
          </div>

          {cancelledOrders > 0 && (
            <div className="cancelled-summary">
              <span>×</span>
              {cancelledOrders} cancelled{" "}
              {cancelledOrders === 1 ? "order" : "orders"}
            </div>
          )}
        </section>

        <section className="quick-actions-section">
          <div className="modern-section-title">
            <div>
              <span>QUICK ACCESS</span>
              <h2>Management</h2>
            </div>
          </div>

          <div className="modern-actions">
            <button
              onClick={() => navigate("/admin/orders")}
            >
              <span className="action-number">01</span>

              <div>
                <strong>Orders</strong>
                <small>Review & update status</small>
              </div>

              <b>↗</b>
            </button>

            <button
              onClick={() => navigate("/admin/products")}
            >
              <span className="action-number">02</span>

              <div>
                <strong>Products</strong>
                <small>Manage catalogue</small>
              </div>

              <b>↗</b>
            </button>

            <button
              onClick={() => navigate("/admin/branches")}
            >
              <span className="action-number">03</span>

              <div>
                <strong>Branches</strong>
                <small>Stock & workload</small>
              </div>

              <b>↗</b>
            </button>
          </div>
        </section>
      </div>

      <section className="recent-section">
        <div className="modern-section-title">
          <div>
            <span>RECENT ACTIVITY</span>
            <h2>Latest Orders</h2>
          </div>

          <button
            onClick={() => navigate("/admin/orders")}
          >
            Manage all →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <p className="muted">No orders available.</p>
        ) : (
          <div className="recent-orders">
            {recentOrders.map((order) => (
              <div
                className="recent-order-row"
                key={order._id}
              >
                <div className="recent-order-id">
                  <div className="order-avatar">
                    {order.customerId?.name
                      ?.charAt(0)
                      .toUpperCase() || "C"}
                  </div>

                  <div>
                    <strong>
                      #
                      {order._id
                        .slice(-7)
                        .toUpperCase()}
                    </strong>

                    <span>
                      {order.customerId?.name ||
                        "Customer"}
                    </span>
                  </div>
                </div>

                <div className="recent-detail">
                  <span>Branch</span>
                  <strong>
                    {order.assignedBranchId?.name ||
                      "Unassigned"}
                  </strong>
                </div>

                <div className="recent-detail">
                  <span>Date</span>
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;