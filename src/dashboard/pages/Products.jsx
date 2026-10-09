import { useEffect, useState } from "react";
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../api/productApi";
import { getAdminCategories } from "../../api/categoryApi";

const emptyForm = {
  name: "",
  slug: "",
  categoryId: "",
  description: "",
  brand: "",
  basePrice: "",
  discount: "0",
};

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      setError("");
      const response = await getAdminProducts();
      const data = response.data ?? response;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Products load ചെയ്യാൻ കഴിഞ്ഞില്ല. Admin login പരിശോധിക്കുക.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getAdminCategories();
      const data = response.data ?? response;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Categories load ചെയ്യാൻ കഴിഞ്ഞില്ല.",
      );
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "name" && !editingId
        ? {
            slug: value
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, ""),
          }
        : {}),
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
      !form.name.trim() ||
      !form.slug.trim() ||
      !form.categoryId.trim() ||
      form.basePrice === ""
    ) {
      setError("Name, Slug, Category, Base Price എന്നിവ നൽകണം.");
      return;
    }

    const basePrice = Number(form.basePrice);
    const discount = Number(form.discount);

    if (
      !Number.isFinite(basePrice) ||
      basePrice < 0 ||
      !Number.isFinite(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      setError("Price ശരിയാക്കുക. Discount 0 മുതൽ 100 വരെ നൽകാം.");
      return;
    }

    const productData = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      categoryId: form.categoryId.trim(),
      description: form.description.trim(),
      brand: form.brand.trim(),
      basePrice,
      discount,
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateProduct(editingId, productData);
        setMessage("Product update ചെയ്തു.");
      } else {
        await createProduct(productData);
        setMessage("Product create ചെയ്തു.");
      }

      resetForm();
      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Product save ചെയ്യാൻ കഴിഞ്ഞില്ല. Fields പരിശോധിക്കുക.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);

    setForm({
      name: product.name || "",
      slug: product.slug || "",
      categoryId:
        typeof product.categoryId === "object"
          ? product.categoryId?._id || ""
          : product.categoryId || "",
      description: product.description || "",
      brand: product.brand || "",
      basePrice: String(product.basePrice ?? ""),
      discount: String(product.discount ?? 0),
    });

    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`"${product.name}" delete ചെയ്യണോ?`);

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await deleteProduct(product._id);
      setMessage("Product delete ചെയ്തു.");

      if (editingId === product._id) {
        resetForm();
      }

      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message || "Product delete ചെയ്യാൻ കഴിഞ്ഞില്ല.",
      );
    }
  };

  if (loading) {
    return (
      <div className="fashion-loading">
        <span className="fashion-spinner" />
        <p>Loading your collection...</p>
      </div>
    );
  }

  return (
    <div className="products-page">
      <header className="products-header">
        <div>
          <p className="fashion-eyebrow">FASHION STORE / INVENTORY</p>
          <h1>Products Management</h1>
          <p className="fashion-subtitle">
            Curate and manage your fashion collection.
          </p>
        </div>

        <button
          type="button"
          className="fashion-button"
          onClick={fetchProducts}
        >
          ↻ Refresh Products
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
          <p>Total Products</p>
          <h2>{products.length}</h2>
          <span className="fashion-stat-note">In your collection</span>
        </article>

        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">◈</span>
          <p>Categories</p>
          <h2>{categories.length}</h2>
          <span className="fashion-stat-note">Available categories</span>
        </article>

        <article className="fashion-stat-card dark-stat">
          <span className="fashion-stat-icon">✧</span>
          <p>Collection</p>
          <h2>CURATED</h2>
          <span className="fashion-stat-note">Your fashion, your style</span>
        </article>
      </section>

      <section className="fashion-card">
        <div className="fashion-section-heading">
          <div>
            <p className="fashion-eyebrow">
              {editingId ? "UPDATE COLLECTION" : "NEW ARRIVAL"}
            </p>
            <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
            <p>Enter the details of your fashion product.</p>
          </div>

          <span className="fashion-section-symbol">✳</span>
        </div>

        <form onSubmit={handleSubmit} className="fashion-form">
          <label className="fashion-field">
            Product Name <span>*</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Cotton Kurti"
              required
            />
          </label>

          <label className="fashion-field">
            Slug <span>*</span>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="cotton-kurti"
              required
            />
          </label>

          <label className="fashion-field">
            Category <span>*</span>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <small className="fashion-help">
                Categories ലഭ്യമല്ല. Backend category API പരിശോധിക്കുക.
              </small>
            )}
          </label>

          <label className="fashion-field">
            Brand
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="e.g. My Brand"
            />
          </label>

          <label className="fashion-field">
            Base Price (₹) <span>*</span>
            <input
              name="basePrice"
              type="number"
              min="0"
              step="0.01"
              value={form.basePrice}
              onChange={handleChange}
              placeholder="1499"
              required
            />
          </label>

          <label className="fashion-field">
            Discount (%)
            <input
              name="discount"
              type="number"
              min="0"
              max="100"
              value={form.discount}
              onChange={handleChange}
              placeholder="0"
            />
          </label>

          <label className="fashion-field full-width">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the fabric, fit and style..."
            />
          </label>

          <div className="fashion-form-actions full-width">
            <button
              type="submit"
              className="fashion-button"
              disabled={saving || categories.length === 0}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes →"
                  : "＋ Add Product"}
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
        </form>
      </section>

      <section className="fashion-card">
        <div className="fashion-section-heading">
          <div>
            <p className="fashion-eyebrow">YOUR INVENTORY</p>
            <h2>All Products</h2>
            <p>
              {products.length} product
              {products.length !== 1 ? "s" : ""} in your collection
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="fashion-empty">
            <span>✧</span>
            <h3>Your collection is waiting</h3>
            <p>Add your first product using the form above.</p>
          </div>
        ) : (
          <div className="fashion-table-wrap">
            <table className="fashion-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Slug</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="fashion-product-name">
                        <span className="fashion-product-icon">✦</span>
                        <div>
                          <strong>{product.name}</strong>
                          <small>{product.brand || "Fashion Collection"}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="fashion-slug">{product.slug}</span>
                    </td>

                    <td className="fashion-price">
                      ₹{Number(product.basePrice || 0).toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span className="fashion-discount">
                        {product.discount ?? 0}%
                      </span>
                    </td>

                    <td>
                      <div className="fashion-actions">
                        <button
                          type="button"
                          className="fashion-button small-button secondary"
                          onClick={() => handleEdit(product)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="fashion-button small-button danger"
                          onClick={() => handleDelete(product)}
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

export default Products;
