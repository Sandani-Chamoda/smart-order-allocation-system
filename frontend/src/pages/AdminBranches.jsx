import { useEffect, useState } from "react";
import api from "../services/api";

const AdminBranches = () => {
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [stockQuantity, setStockQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setError("");

      const [branchesResponse, productsResponse] =
        await Promise.all([
          api.get("/branches"),
          api.get("/products"),
        ]);

      setBranches(branchesResponse.data.branches || []);
      setProducts(productsResponse.data.products || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load branch information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStockQuantity = (branch, productId) => {
    const stockItem = branch.stock?.find((item) => {
      const id =
        typeof item.productId === "object"
          ? item.productId?._id
          : item.productId;

      return id === productId;
    });

    return stockItem?.quantity ?? 0;
  };

  const startEditing = (branch, product) => {
    setError("");
    setMessage("");

    setEditing({
      branchId: branch._id,
      productId: product._id,
      branchName: branch.name,
      productName: product.name,
    });

    setStockQuantity(
      String(getStockQuantity(branch, product._id))
    );
  };

  const cancelEditing = () => {
    setEditing(null);
    setStockQuantity("");
  };

  const updateStock = async (event) => {
    event.preventDefault();

    const quantity = Number(stockQuantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setError(
        "Stock quantity must be a non-negative whole number."
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api.put(
        `/branches/${editing.branchId}/stock`,
        {
          productId: editing.productId,
          quantity,
        }
      );

      setMessage(
        `${editing.productName} stock updated for ${editing.branchName}.`
      );

      setEditing(null);
      setStockQuantity("");

      await loadData();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to update stock."
      );
    } finally {
      setSaving(false);
    }
  };

  const totalStock = (branch) =>
    branch.stock?.reduce(
      (total, item) => total + item.quantity,
      0
    ) || 0;

  const workloadLevel = (workload) => {
    if (workload <= 2) return "Low";
    if (workload <= 5) return "Moderate";
    return "High";
  };

  if (loading) {
    return (
      <div className="page-message">
        Loading branches...
      </div>
    );
  }

  return (
    <div className="page-container branches-admin-page">
      <header className="branches-header">
        <div>
          <span>ALLOCATION NETWORK</span>

          <h1>Branches & Stock</h1>

          <p>
            Monitor branch workload and control product
            availability across the network.
          </p>
        </div>

        <div className="network-count">
          <strong>{branches.length}</strong>
          <span>Branches</span>
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

      <section className="network-overview">
        <div>
          <span>Network</span>
          <strong>
            {branches.filter((branch) => branch.isActive).length}
          </strong>
          <small>Active branches</small>
        </div>

        <div>
          <span>Catalogue</span>
          <strong>{products.length}</strong>
          <small>Active products</small>
        </div>

        <div>
          <span>Units Available</span>
          <strong>
            {branches.reduce(
              (total, branch) =>
                total + totalStock(branch),
              0
            )}
          </strong>
          <small>Across all branches</small>
        </div>

        <div>
          <span>Combined Workload</span>
          <strong>
            {branches.reduce(
              (total, branch) =>
                total + branch.currentWorkload,
              0
            )}
          </strong>
          <small>Active allocated orders</small>
        </div>
      </section>

      <div className="branch-list">
        {branches.map((branch, index) => (
          <section
            className="branch-section"
            key={branch._id}
          >
            <div className="branch-main-info">
              <div className="branch-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="branch-title">
                <div>
                  <h2>{branch.name}</h2>

                  <span
                    className={`branch-active-state ${
                      branch.isActive
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    <i />
                    {branch.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <p>
                  {branch.location?.latitude},{" "}
                  {branch.location?.longitude}
                </p>
              </div>

              <div className="branch-stat">
                <span>Workload</span>
                <strong>
                  {branch.currentWorkload}
                </strong>
                <small>
                  {workloadLevel(
                    branch.currentWorkload
                  )}
                </small>
              </div>

              <div className="branch-stat">
                <span>Total Stock</span>
                <strong>
                  {totalStock(branch)}
                </strong>
                <small>units available</small>
              </div>
            </div>

            <div className="branch-stock-area">
              <div className="stock-heading">
                <span>PRODUCT</span>
                <span>AVAILABLE STOCK</span>
                <span>ACTION</span>
              </div>

              {products.map((product) => {
                const quantity = getStockQuantity(
                  branch,
                  product._id
                );

                return (
                  <div
                    className="stock-product-row"
                    key={`${branch._id}-${product._id}`}
                  >
                    <div className="stock-product-name">
                      <div>◇</div>

                      <span>
                        <strong>{product.name}</strong>
                        <small>{product.sku}</small>
                      </span>
                    </div>

                    <div className="stock-level">
                      <strong>{quantity}</strong>

                      <span
                        className={
                          quantity === 0
                            ? "stock-zero"
                            : quantity <= 5
                              ? "stock-low"
                              : "stock-good"
                        }
                      >
                        {quantity === 0
                          ? "Out of stock"
                          : quantity <= 5
                            ? "Low stock"
                            : "In stock"}
                      </span>
                    </div>

                    <button
                      className="edit-stock-button"
                      onClick={() =>
                        startEditing(
                          branch,
                          product
                        )
                      }
                    >
                      Update Stock →
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {editing && (
        <div className="stock-modal-backdrop">
          <form
            className="stock-modal"
            onSubmit={updateStock}
          >
            <span className="modal-eyebrow">
              STOCK MANAGEMENT
            </span>

            <h2>Update Stock</h2>

            <p>
              {editing.productName}
              <br />
              <strong>{editing.branchName}</strong>
            </p>

            <label>Available Quantity</label>

            <input
              type="number"
              min="0"
              step="1"
              value={stockQuantity}
              onChange={(event) =>
                setStockQuantity(
                  event.target.value
                )
              }
              autoFocus
              required
            />

            <small>
              Enter the total quantity currently available
              at this branch.
            </small>

            <div className="stock-modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={cancelEditing}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="modal-save"
                disabled={saving}
              >
                {saving
                  ? "Updating..."
                  : "Save Stock"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminBranches;