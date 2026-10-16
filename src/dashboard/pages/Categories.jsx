import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/dashboard/category";

const emptyForm = {
  name: "",
  slug: "",
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
        err.response?.data?.message || "Categories load ചെയ്യാൻ കഴിഞ്ഞില്ല.",
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
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const categoryData = {
      name: form.name.trim(),
      slug: form.slug.trim(),
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
        err.response?.data?.message || "Category save ചെയ്യാൻ കഴിഞ്ഞില്ല.",
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

  const inputClass =
    "mt-2 w-full rounded-lg border border-[#e5d9cb] bg-[#fffefa] px-4 py-3 text-sm text-[#39291f] outline-none transition placeholder:text-[#b5a89c] focus:border-[#a17b50] focus:ring-4 focus:ring-[#a17b50]/10";

  const labelClass = "block text-xs font-bold tracking-wide text-[#594537]";

  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-[#51392b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#72523b] focus:outline-none focus:ring-4 focus:ring-[#51392b]/15 disabled:cursor-not-allowed disabled:opacity-60";

  const secondaryButton =
    "inline-flex items-center justify-center rounded-lg border border-[#dfd1c0] bg-[#fffdf9] px-4 py-2.5 text-xs font-semibold text-[#654b37] transition hover:bg-[#f5ede2]";

  const dangerButton =
    "inline-flex items-center justify-center rounded-lg border border-[#e9d0ca] bg-[#fff7f5] px-4 py-2.5 text-xs font-semibold text-[#a34e41] transition hover:bg-[#fce9e5]";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#f7f3ed] text-[#705b49]">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#e4d6c5] border-t-[#51392b]" />
        <p className="text-sm">Loading categories...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-4 py-6 sm:px-6 lg:px-9 lg:py-9">
      <div className="mx-auto max-w-[1500px] space-y-7">
        {/* HEADER */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-[10px] font-extrabold tracking-[2.5px] text-[#a17b50]">
              ÉLORA / CATALOG MANAGEMENT
            </p>

            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#39291f] sm:text-4xl">
              Categories Management
            </h1>

            <p className="mt-2 text-sm text-[#8d8177]">
              Organise your fashion collection into categories.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchCategories}
            className={primaryButton}
          >
            <span className="text-lg">↻</span>
            Refresh
          </button>
        </header>

        {/* FEEDBACK */}
        {message && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl border border-[#cbdcc8] bg-[#f0f7ed] px-4 py-3 text-sm text-[#466746]"
          >
            <span className="font-bold">✓</span>
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-[#edcfca] bg-[#fff3f1] px-4 py-3 text-sm text-[#a23d32]"
          >
            <span className="font-bold">!</span>
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            symbol="✦"
            title="Total Categories"
            value={categories.length}
            note="All catalog categories"
          />

          <StatCard
            symbol="◈"
            title="Active Categories"
            value={activeCount}
            note="Currently active"
          />

          <StatCard
            symbol="◇"
            title="Inactive Categories"
            value={categories.length - activeCount}
            note="Currently inactive"
            dark
          />
        </section>

        {/* ADD / EDIT FORM */}
        <section className="overflow-hidden rounded-2xl border border-[#e9dfd3] bg-[#fffdf9] shadow-[0_8px_30px_rgba(70,48,30,0.035)]">
          <div className="flex items-center justify-between gap-4 border-b border-[#eee5da] px-5 py-6 sm:px-8">
            <div>
              <p className="mb-2 text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
                {editingId ? "UPDATE CATEGORY" : "NEW CATEGORY"}
              </p>

              <h2 className="font-serif text-2xl text-[#39291f]">
                {editingId ? "Edit Category" : "Add New Category"}
              </h2>

              <p className="mt-2 text-sm text-[#958579]">
                Add a name and details for your fashion category.
              </p>
            </div>

            <span className="hidden h-12 w-12 items-center justify-center rounded-xl border border-[#e8d9c6] bg-[#f8f1e7] text-2xl text-[#9a774f] sm:flex">
              ✳
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-8"
          >
            <label className={labelClass}>
              Category Name <span className="text-[#b55d4c]">*</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Kurtis"
                className={inputClass}
                required
              />
            </label>

            <label className={labelClass}>
              Slug <span className="text-[#b55d4c]">*</span>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="e.g. kurtis"
                className={inputClass}
                required
              />
            </label>

            <label className={`${labelClass} sm:col-span-2`}>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe this category..."
                rows={3}
                className={`${inputClass} resize-y`}
              />
            </label>

            <label className={labelClass}>
              Category Status
              <select
                name="active"
                value={String(form.active)}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>

            <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
              <button type="submit" className={primaryButton} disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes →"
                    : "＋ Add Category"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* CATEGORY DIRECTORY */}
        <section className="overflow-hidden rounded-2xl border border-[#e9dfd3] bg-[#fffdf9] shadow-[0_8px_30px_rgba(70,48,30,0.035)]">
          <div className="flex flex-col justify-between gap-4 border-b border-[#eee5da] px-5 py-6 sm:flex-row sm:items-center sm:px-8">
            <div>
              <p className="mb-2 text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
                YOUR CATALOG
              </p>

              <h2 className="font-serif text-2xl text-[#39291f]">
                All Categories
              </h2>

              <p className="mt-2 text-sm text-[#958579]">
                {filteredCategories.length} categories shown
              </p>
            </div>

            <div className="relative w-full sm:max-w-[330px]">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a18e7b]">
                ⌕
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories..."
                aria-label="Search categories"
                className="w-full rounded-lg border border-[#e5d9cb] bg-[#fffefa] py-3 pl-10 pr-4 text-sm text-[#39291f] outline-none transition placeholder:text-[#b5a89c] focus:border-[#a17b50] focus:ring-4 focus:ring-[#a17b50]/10"
              />
            </div>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f5ede2] text-2xl text-[#a17b50]">
                ✧
              </span>

              <h3 className="mt-4 font-serif text-xl text-[#51392b]">
                No categories found
              </h3>

              <p className="mt-2 text-sm text-[#958579]">
                Create a category or try a different search.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#faf6f0]">
                    {[
                      "Category",
                      "Slug",
                      "Description",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[1.3px] text-[#8e7864]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0e8de]">
                  {filteredCategories.map((category) => (
                    <tr
                      key={category._id}
                      className="transition hover:bg-[#fcf8f2]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#eadcc9] bg-[#f7efe4] text-[#9a774f]">
                            ✦
                          </span>

                          <strong className="text-sm font-semibold text-[#51392b]">
                            {category.name}
                          </strong>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-md bg-[#f5eee5] px-2.5 py-1.5 font-mono text-xs text-[#8b6744]">
                          {category.slug}
                        </span>
                      </td>

                      <td className="max-w-[260px] px-5 py-4 text-sm text-[#8d8177]">
                        <span className="line-clamp-2">
                          {category.description || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            category.active !== false
                              ? "inline-flex items-center gap-2 rounded-full bg-[#edf5e9] px-3 py-1.5 text-xs font-semibold text-[#50754b]"
                              : "inline-flex items-center gap-2 rounded-full bg-[#f7e9e5] px-3 py-1.5 text-xs font-semibold text-[#a35b4d]"
                          }
                        >
                          <span
                            className={
                              category.active !== false
                                ? "h-1.5 w-1.5 rounded-full bg-[#6d9565]"
                                : "h-1.5 w-1.5 rounded-full bg-[#bb7566]"
                            }
                          />
                          {category.active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className={secondaryButton}
                            onClick={() => handleEdit(category)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={dangerButton}
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

        {/* FOOTER */}
        <footer className="flex flex-col items-center justify-between gap-2 border-t border-[#e6dbce] pt-5 text-[10px] font-semibold tracking-[1.5px] text-[#9a8877] sm:flex-row">
          <span>ÉLORA · CATEGORY MANAGEMENT</span>
          <span>DESIGNED WITH CARE ✦</span>
        </footer>
      </div>
    </main>
  );
}

function StatCard({ symbol, title, value, note, dark = false }) {
  return (
    <article
      className={
        dark
          ? "rounded-2xl border border-[#51392b] bg-[#51392b] p-5 text-white shadow-[0_8px_25px_rgba(70,48,30,0.10)] sm:p-6"
          : "rounded-2xl border border-[#e9dfd3] bg-[#fffdf9] p-5 shadow-[0_8px_25px_rgba(70,48,30,0.035)] sm:p-6"
      }
    >
      <div className="flex items-start justify-between">
        <p
          className={
            dark
              ? "text-sm font-medium text-white/70"
              : "text-sm font-medium text-[#8d8177]"
          }
        >
          {title}
        </p>

        <span
          className={
            dark
              ? "flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl text-[#e7c79e]"
              : "flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5ede2] text-xl text-[#9a774f]"
          }
        >
          {symbol}
        </span>
      </div>

      <h2
        className={
          dark
            ? "mt-5 font-serif text-4xl text-white"
            : "mt-5 font-serif text-4xl text-[#39291f]"
        }
      >
        {value}
      </h2>

      <p
        className={
          dark ? "mt-2 text-xs text-white/60" : "mt-2 text-xs text-[#a09284]"
        }
      >
        {note}
      </p>
    </article>
  );
}

export default Categories;
