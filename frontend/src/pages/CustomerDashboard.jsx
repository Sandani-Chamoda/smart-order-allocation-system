import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const deliveryLocations = {
    kandy: {
      label: "Kandy",
      latitude: 7.2906,
      longitude: 80.6337,
    },
    colombo: {
      label: "Colombo",
      latitude: 6.9271,
      longitude: 79.8612,
    },
    peradeniya: {
      label: "Peradeniya",
      latitude: 7.2599,
      longitude: 80.5976,
    },
  };

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [deliveryLocation, setDeliveryLocation] = useState("kandy");
  const [customerMessage, setCustomerMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await api.get("/products");

        setProducts(response.data.products);

        if (response.data.products.length > 0) {
          setSelectedProduct(response.data.products[0]._id);
        }
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess(null);

    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    ) {
      setError("Quantity must be at least 1.");
      return;
    }

    const selectedLocation =
      deliveryLocations[deliveryLocation];

    setSubmitting(true);

    try {
      const response = await api.post("/orders", {
        items: [
          {
            productId: selectedProduct,
            quantity: Number(quantity),
          },
        ],

        customerLocation: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        },

        customerMessage,
      });

      setSuccess(response.data.order);

      setQuantity(1);
      setCustomerMessage("");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to place order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-message">
        Loading products...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Shop Products</h1>

          <p className="muted">
            Welcome, {user?.name}. Choose a product and we'll
            automatically allocate your order to the most suitable
            branch.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {success ? (
        <div className="order-success-card">
          <div className="success-icon">✓</div>

          <h2>Order Placed Successfully!</h2>

          <p>
            Your order has been received and automatically
            allocated to the most suitable branch.
          </p>

          <div className="success-details">
            <div>
              <span>Assigned Branch</span>
              <strong>
                {success.assignedBranchId?.name}
              </strong>
            </div>

            <div>
              <span>Order Status</span>
              <strong>{success.status}</strong>
            </div>
          </div>

          <div className="allocation-box">
            <strong>Smart Allocation</strong>

            <p>
              {success.allocationReason}
            </p>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() => navigate("/orders")}
          >
            View My Order
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={() => setSuccess(null)}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="shop-layout">
          <section className="product-section">
            <div className="section-title">
              <div>
                <h2>Available Products</h2>
                <p className="muted">
                  Select a product to add to your order.
                </p>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="empty-card">
                No products are currently available.
              </div>
            ) : (
              <div className="product-grid">
                {products.map((product) => (
                  <button
                    type="button"
                    key={product._id}
                    className={`product-card ${
                      selectedProduct === product._id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedProduct(product._id)
                    }
                  >
                    <div className="product-icon">
                      📦
                    </div>

                    <h3>{product.name}</h3>

                    <p className="muted">
                      {product.description ||
                        "No description available"}
                    </p>

                    <div className="product-bottom">
                      <span className="sku">
                        {product.sku}
                      </span>

                      <strong>
                        Rs.{" "}
                        {Number(
                          product.price
                        ).toLocaleString()}
                      </strong>
                    </div>

                    {selectedProduct === product._id && (
                      <div className="selected-label">
                        ✓ Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          <form
            className="order-card"
            onSubmit={handleSubmit}
          >
            <div className="order-card-header">
              <div className="order-card-icon">
                🛒
              </div>

              <div>
                <h2>Place Order</h2>
                <p>
                  Complete your order details.
                </p>
              </div>
            </div>

            <label>Quantity</label>

            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              required
            />

            <h3>Delivery Area</h3>

            <label>Select your delivery area</label>

            <select
              value={deliveryLocation}
              onChange={(event) =>
                setDeliveryLocation(
                  event.target.value
                )
              }
            >
              {Object.entries(
                deliveryLocations
              ).map(([key, location]) => (
                <option
                  key={key}
                  value={key}
                >
                  {location.label}
                </option>
              ))}
            </select>

            <p className="field-help">
              We'll automatically choose the best branch
              for your order.
            </p>

            <label>Order Note (Optional)</label>

            <textarea
              rows="4"
              maxLength="500"
              value={customerMessage}
              onChange={(event) =>
                setCustomerMessage(
                  event.target.value
                )
              }
              placeholder="For example: Please deliver after 5 PM"
            />

            <button
              className="primary-button"
              type="submit"
              disabled={
                submitting ||
                products.length === 0
              }
            >
              {submitting
                ? "Finding Best Branch..."
                : "Place Order"}
            </button>

            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                navigate("/orders")
              }
            >
              View My Orders
            </button>

            <div className="smart-info">
              <span>⚡</span>

              <p>
                <strong>Smart allocation</strong>
                <br />
                Your order is matched using stock,
                distance and branch workload.
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;