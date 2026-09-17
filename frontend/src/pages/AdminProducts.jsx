import { useEffect, useState } from "react";
import api from "../services/api";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
  });

  const loadProducts = async () => {
    try {
      setError("");

      const response = await api.get("/products");
      setProducts(response.data.products || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !form.name.trim() ||
      !form.sku.trim() ||
      form.price === ""
    ) {
      setError(
        "Product name, SKU and price are required."
      );
      return;
    }

    const price = Number(form.price);

    if (!Number.isFinite(price) || price < 0) {
      setError("Please enter a valid product price.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/products", {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description.trim(),
        price,
      });

      setMessage("Product added successfully.");

      setForm({
        name: "",
        sku: "",
        description: "",
        price: "",
      });

      setShowForm(false);

      await loadProducts();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to add product."
      );
    } finally {
      setSaving(false);
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
    <div className="page-container admin-products-page">
      <header className="product-admin-header">
        <div>
          <span>CATALOGUE MANAGEMENT</span>

          <h1>Products</h1>

          <p>
            Manage products available for customer orders.
          </p>
        </div>

        <button
          className="add-product-button"
          onClick={() => {
            setShowForm(!showForm);
            setError("");
            setMessage("");
          }}
        >
          {showForm ? "× Close" : "+ Add Product"}
        </button>
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

      {showForm && (
        <form
          className="modern-product-form"
          onSubmit={handleSubmit}
        >
          <div className="product-form-heading">
            <div>
              <span>NEW PRODUCT</span>
              <h2>Add to Catalogue</h2>
            </div>

            <p>
              Create a product before assigning stock
              to branches.
            </p>
          </div>

          <div className="product-form-grid">
            <div>
              <label>Product Name</label>

              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Mechanical Keyboard"
                maxLength="100"
                required
              />
            </div>

            <div>
              <label>SKU</label>

              <input
                name="sku"
                type="text"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. KB-001"
                required
              />
            </div>

            <div>
              <label>Price (Rs.)</label>

              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="8500"
                required
              />
            </div>
          </div>

          <div className="product-description-field">
            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Short product description..."
              maxLength="500"
              rows="3"
            />
          </div>

          <div className="product-form-actions">
            <button
              type="button"
              className="product-cancel-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="product-save-button"
              disabled={saving}
            >
              {saving
                ? "Adding Product..."
                : "Add Product →"}
            </button>
          </div>
        </form>
      )}

      <div className="catalogue-meta">
        <div>
          <strong>{products.length}</strong>
          <span>Products in catalogue</span>
        </div>

        <p>
          Stock quantities are managed separately for
          each branch.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="admin-empty-state">
          <span>◇</span>
          <h3>No products</h3>
          <p>Add your first product to the catalogue.</p>
        </div>
      ) : (
        <div className="admin-product-list">
          <div className="product-list-header">
            <span>PRODUCT</span>
            <span>SKU</span>
            <span>PRICE</span>
            <span>STATUS</span>
          </div>

          {products.map((product, index) => (
            <div
              className="admin-product-row"
              key={product._id}
            >
              <div className="product-identity">
                <div className="product-index">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <strong>{product.name}</strong>

                  <p>
                    {product.description ||
                      "No description"}
                  </p>
                </div>
              </div>

              <div className="product-data">
                <span>SKU</span>
                <strong>{product.sku}</strong>
              </div>

              <div className="product-data">
                <span>Price</span>

                <strong className="catalogue-price">
                  Rs.{" "}
                  {Number(
                    product.price
                  ).toLocaleString()}
                </strong>
              </div>

              <div>
                <span
                  className={`catalogue-status ${
                    product.isActive
                      ? "active"
                      : "inactive"
                  }`}
                >
                  <i />
                  {product.isActive
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;