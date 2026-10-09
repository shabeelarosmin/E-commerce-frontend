import { useEffect, useState } from "react";
import {
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from "../../api/productVariantApi";
import { getAdminProducts } from "../../api/productApi";

const emptyForm = {
  ProductId: "",
  size: "",
  color: "",
  sku: "",
  sellingPrice: "",
  stockQuantity: "0",
};

function ProductVariants() {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchVariants = async () => {
    try {
      const response = await getProductVariants();
      const data = response.data ?? response;
      setVariants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Variants load ചെയ്യാൻ കഴിഞ്ഞില്ല. Login പരിശോധിക്കുക.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getAdminProducts();
      const data = response.data ?? response;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Products load ചെയ്യാൻ കഴിഞ്ഞില്ല.",
      );
    }
  };

  useEffect(() => {
    fetchVariants();
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (
      !form.ProductId ||
      !form.size.trim() ||
      !form.color.trim() ||
      !form.sku.trim() ||
      form.sellingPrice === "" ||
      form.stockQuantity === ""
    ) {
      setError("എല്ലാ required fields-ഉം പൂരിപ്പിക്കുക.");
      return;
    }

    const sellingPrice = Number(form.sellingPrice);
    const stockQuantity = Number(form.stockQuantity);

    if (
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0 ||
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      setError("Price, stock quantity എന്നിവ ശരിയായി നൽകുക.");
      return;
    }

    const variantData = {
      ProductId: form.ProductId,
      size: form.size.trim(),
      color: form.color.trim(),
      sku: form.sku.trim(),
      sellingPrice,
      stockQuantity,
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateProductVariant(editingId, variantData);
        setMessage("Product variant update ചെയ്തു.");
      } else {
        await createProductVariant(variantData);
        setMessage("Product variant create ചെയ്തു.");
      }

      resetForm();
      await fetchVariants();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Variant save ചെയ്യാൻ കഴിഞ്ഞില്ല. Fields പരിശോധിക്കുക.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (variant) => {
    setEditingId(variant._id);

    setForm({
      ProductId:
        typeof variant.ProductId === "object"
          ? variant.ProductId?._id || ""
          : variant.ProductId || "",
      size: variant.size || "",
      color: variant.color || "",
      sku: variant.sku || "",
      sellingPrice: String(variant.sellingPrice ?? ""),
      stockQuantity: String(variant.stockQuantity ?? 0),
    });

    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (variant) => {
    const confirmed = window.confirm(`SKU "${variant.sku}" delete ചെയ്യണോ?`);

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await deleteProductVariant(variant._id);
      setMessage("Product variant delete ചെയ്തു.");

      if (editingId === variant._id) {
        resetForm();
      }

      await fetchVariants();
    } catch (err) {
      setError(
        err.response?.data?.message || "Variant delete ചെയ്യാൻ കഴിഞ്ഞില്ല.",
      );
    }
  };

  const getProductName = (variant) => {
    if (variant.ProductId && typeof variant.ProductId === "object") {
      return variant.ProductId.name || "Product";
    }

    return (
      products.find((product) => product._id === variant.ProductId)?.name ||
      "Product"
    );
  };

  if (loading) {
    return (
      <div className="fashion-loading">
        <span className="fashion-spinner" />
        <p>Loading product variants...</p>
      </div>
    );
  }

  return (
    <div className="variants-page">
      <header className="products-header">
        <div>
          <p className="fashion-eyebrow">FASHION STORE / INVENTORY</p>
          <h1>Product Variants</h1>
          <p className="fashion-subtitle">
            Manage sizes, colors, pricing and stock.
          </p>
        </div>

        <button
          type="button"
          className="fashion-button"
          onClick={() => {
            fetchVariants();
            fetchProducts();
          }}
        >
          ↻ Refresh
        </button>
      </header>

      {message && (
        <div className="fashion-alert success" role="status">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="fashion-alert error" role="alert">
          {error}
        </div>
      )}

      <section className="fashion-stats">
        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">✦</span>
          <p>Total Variants</p>
          <h2>{variants.length}</h2>
          <span className="fashion-stat-note">Size and color options</span>
        </article>

        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">◈</span>
          <p>Products</p>
          <h2>{products.length}</h2>
          <span className="fashion-stat-note">Available products</span>
        </article>

        <article className="fashion-stat-card dark-stat">
          <span className="fashion-stat-icon">✧</span>
          <p>Total Stock</p>
          <h2>
            {variants.reduce(
              (total, variant) => total + Number(variant.stockQuantity || 0),
              0,
            )}
          </h2>
          <span className="fashion-stat-note">Units in inventory</span>
        </article>
      </section>

      <section className="fashion-card">
        <div className="fashion-section-heading">
          <div>
            <p className="fashion-eyebrow">
              {editingId ? "UPDATE VARIANT" : "NEW VARIANT"}
            </p>
            <h2>
              {editingId ? "Edit Product Variant" : "Add Product Variant"}
            </h2>
            <p>Choose a product and enter its variant details.</p>
          </div>

          <span className="fashion-section-symbol">✳</span>
        </div>

        <form onSubmit={handleSubmit} className="fashion-form">
          <label className="fashion-field full-width">
            Product <span>*</span>
            <select
              name="ProductId"
              value={form.ProductId}
              onChange={handleChange}
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label className="fashion-field">
            Size <span>*</span>
            <select
              name="size"
              value={form.size}
              onChange={handleChange}
              required
            >
              <option value="">Select size</option>
              {["XS", "S", "M", "L", "XL", "XXL", "Free Size"].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <label className="fashion-field">
            Color <span>*</span>
            <input
              name="color"
              value={form.color}
              onChange={handleChange}
              placeholder="e.g. Black"
              required
            />
          </label>

          <label className="fashion-field">
            SKU <span>*</span>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="e.g. KUR-BLK-M-001"
              required
            />
          </label>

          <label className="fashion-field">
            Selling Price (₹) <span>*</span>
            <input
              name="sellingPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.sellingPrice}
              onChange={handleChange}
              placeholder="1499"
              required
            />
          </label>

          <label className="fashion-field">
            Stock Quantity <span>*</span>
            <input
              name="stockQuantity"
              type="number"
              min="0"
              step="1"
              value={form.stockQuantity}
              onChange={handleChange}
              placeholder="20"
              required
            />
          </label>

          <div className="fashion-form-actions full-width">
            <button
              type="submit"
              className="fashion-button"
              disabled={saving || products.length === 0}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes →"
                  : "＋ Add Variant"}
            </button>

            {editingId && (
              <button
                type="button"
                className="fashion-button secondary"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>

          {products.length === 0 && (
            <p className="fashion-help full-width">
              ആദ്യം Products Management page-ൽ ഒരു product create ചെയ്യുക.
            </p>
          )}
        </form>
      </section>

      <section className="fashion-card">
        <div className="fashion-section-heading">
          <div>
            <p className="fashion-eyebrow">INVENTORY DETAILS</p>
            <h2>All Product Variants</h2>
            <p>{variants.length} variants in your inventory</p>
          </div>
        </div>

        {variants.length === 0 ? (
          <div className="fashion-empty">
            <span>✧</span>
            <h3>No variants yet</h3>
            <p>Add a size and color option using the form above.</p>
          </div>
        ) : (
          <div className="fashion-table-wrap">
            <table className="fashion-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Color</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {variants.map((variant) => (
                  <tr key={variant._id}>
                    <td>
                      <div className="fashion-product-name">
                        <span className="fashion-product-icon">✦</span>
                        <strong>{getProductName(variant)}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="fashion-discount">{variant.size}</span>
                    </td>

                    <td>{variant.color}</td>

                    <td>
                      <span className="fashion-slug">{variant.sku}</span>
                    </td>

                    <td className="fashion-price">
                      ₹
                      {Number(variant.sellingPrice || 0).toLocaleString(
                        "en-IN",
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          Number(variant.stockQuantity || 0) > 0
                            ? "fashion-discount"
                            : "fashion-button danger small-button"
                        }
                      >
                        {variant.stockQuantity ?? 0} units
                      </span>
                    </td>

                    <td>
                      <div className="fashion-actions">
                        <button
                          type="button"
                          className="fashion-button secondary small-button"
                          onClick={() => handleEdit(variant)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="fashion-button danger small-button"
                          onClick={() => handleDelete(variant)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="fashion-footer">
        <span>ATELIER · FASHION ADMIN</span>
        <span>Designed with care ✦</span>
      </footer>
    </div>
  );
}

export default ProductVariants;
