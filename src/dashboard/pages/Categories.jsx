import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/dashboard/category";

const emptyForm = {
  name: "",
  slug: "",
  image: "",
  description: "",
  active: true,
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const authConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
  });

  const fetchCategories = async () => {
    try {
      setError("");

      const response = await axios.get(API_URL, authConfig());
      const data = response.data?.data ?? response.data;

      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Categories load ചെയ്യാൻ കഴിഞ്ഞില്ല. API route, login പരിശോധിക്കുക.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "active" ? value === "true" : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const categoryData = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      image: form.image.trim(),
      description: form.description.trim(),
      active: form.active,
    };

    if (!categoryData.name || !categoryData.slug) {
      setError("Category name, slug എന്നിവ പൂരിപ്പിക്കുക.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, categoryData, authConfig());
        setMessage("Category update ചെയ്തു.");
      } else {
        await axios.post(API_URL, categoryData, authConfig());
        setMessage("Category create ചെയ്തു.");
      }

      resetForm();
      await fetchCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Category save ചെയ്യാൻ കഴിഞ്ഞില്ല. Backend route പരിശോധിക്കുക.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);

    setForm({
      name: category.name || "",
      slug: category.slug || "",
      image: category.image || "",
      description: category.description || "",
      active: category.active ?? true,
    });

    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `"${category.name}" category delete ചെയ്യണോ?`,
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await axios.delete(`${API_URL}/${category._id}`, authConfig());

      setMessage("Category delete ചെയ്തു.");

      if (editingId === category._id) {
        resetForm();
      }

      await fetchCategories();
    } catch (err) {
      setError(
        err.response?.data?.message || "Category delete ചെയ്യാൻ കഴിഞ്ഞില്ല.",
      );
    }
  };

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories.filter((category) =>
      [category.name, category.slug, category.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [categories, search]);

  const activeCount = categories.filter(
    (category) => category.active !== false,
  ).length;

  if (loading) {
    return (
      <div className="fashion-loading">
        <span className="fashion-spinner" />
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <main className="categories-page">
      <header className="products-header">
        <div>
          <p className="fashion-eyebrow">ÉLORA / CATALOG MANAGEMENT</p>
          <h1>Categories Management</h1>
          <p className="fashion-subtitle">
            Organise your fashion collection into categories.
          </p>
        </div>

        <button
          type="button"
          className="fashion-button"
          onClick={fetchCategories}
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

      {/* SUMMARY CARDS */}
      <section className="fashion-stats">
        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">✦</span>
          <p>Total Categories</p>
          <h2>{categories.length}</h2>
          <span className="fashion-stat-note">All catalog categories</span>
        </article>

        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">◈</span>
          <p>Active Categories</p>
          <h2>{activeCount}</h2>
          <span className="fashion-stat-note">Currently active</span>
        </article>

        <article className="fashion-stat-card dark-stat">
          <span className="fashion-stat-icon">◇</span>
          <p>Inactive Categories</p>
          <h2>{categories.length - activeCount}</h2>
          <span className="fashion-stat-note">Currently inactive</span>
        </article>
      </section>

      {/* ADD / EDIT FORM */}
      <section className="fashion-card">
        <div className="fashion-section-heading">
          <div>
            <p className="fashion-eyebrow">
              {editingId ? "UPDATE CATEGORY" : "NEW CATEGORY"}
            </p>

            <h2>{editingId ? "Edit Category" : "Add New Category"}</h2>

            <p>Add a name and details for your fashion category.</p>
          </div>

          <span className="fashion-section-symbol">✳</span>
        </div>

        <form onSubmit={handleSubmit} className="fashion-form">
          <label className="fashion-field">
            Category Name <span>*</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Kurtis"
              required
            />
          </label>

          <label className="fashion-field">
            Slug <span>*</span>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="e.g. kurtis"
              required
            />
          </label>

          <label className="fashion-field full-width">
            Image URL
            <input
              name="image"
              type="url"
              value={form.image}
              onChange={handleChange}
              placeholder="https://example.com/category.jpg"
            />
          </label>

          {form.image.trim() && (
            <div className="category-image-preview full-width">
              <span>Image preview</span>
              <img
                src={form.image}
                alt="Category preview"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
                onLoad={(event) => {
                  event.currentTarget.style.display = "block";
                }}
              />
            </div>
          )}

          <label className="fashion-field full-width">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe this category..."
              rows={3}
            />
          </label>

          <label className="fashion-field">
            Category Status
            <select
              name="active"
              value={String(form.active)}
              onChange={handleChange}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>

          <div className="fashion-form-actions full-width">
            <button type="submit" className="fashion-button" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes →"
                  : "＋ Add Category"}
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

      {/* CATEGORY DIRECTORY */}
      <section className="fashion-card">
        <div className="fashion-section-heading">
          <div>
            <p className="fashion-eyebrow">YOUR CATALOG</p>
            <h2>All Categories</h2>
            <p>{filteredCategories.length} categories shown</p>
          </div>
        </div>

        <div className="categories-search">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search category name or slug..."
            aria-label="Search categories"
          />
        </div>

        {filteredCategories.length === 0 ? (
          <div className="fashion-empty">
            <span>✧</span>
            <h3>No categories found</h3>
            <p>Create a category or try a different search.</p>
          </div>
        ) : (
          <div className="fashion-table-wrap">
            <table className="fashion-table categories-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <div className="category-table-name">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt=""
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="fashion-product-icon">✦</span>
                        )}

                        <strong>{category.name}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="fashion-slug">{category.slug}</span>
                    </td>

                    <td className="category-description">
                      {category.description || "—"}
                    </td>

                    <td>
                      <span
                        className={
                          category.active !== false
                            ? "category-status active"
                            : "category-status inactive"
                        }
                      >
                        {category.active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="fashion-actions">
                        <button
                          type="button"
                          className="fashion-button secondary small-button"
                          onClick={() => handleEdit(category)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="fashion-button danger small-button"
                          onClick={() => handleDelete(category)}
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
        <span>ÉLORA · CATEGORY MANAGEMENT</span>
        <span>Designed with care ✦</span>
      </footer>
    </main>
  );
}

export default Categories;
