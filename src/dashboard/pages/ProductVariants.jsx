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

const inputClass =
  "mt-2 w-full rounded-lg border border-[#e6d9ca] bg-[#fffdf9] px-4 py-3 text-sm text-[#493528] outline-none transition placeholder:text-[#b6a797] focus:border-[#9a7955] focus:ring-2 focus:ring-[#9a7955]/15";

const labelClass = "block text-xs font-semibold tracking-wide text-[#685343]";

const buttonPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#51392b] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#72523b] disabled:cursor-not-allowed disabled:opacity-50";

const buttonSecondary =
  "inline-flex min-h-9 items-center justify-center rounded-lg border border-[#e3d7c9] bg-[#fffdf9] px-3 py-2 text-xs font-semibold text-[#51392b] transition hover:bg-[#f4ebdf]";

const buttonDanger =
  "inline-flex min-h-9 items-center justify-center rounded-lg border border-[#efd3cd] bg-[#fff4f1] px-3 py-2 text-xs font-semibold text-[#a34032] transition hover:bg-[#fce4df]";

function ProductVariants() {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage("");
    setError("");

    try {
      await Promise.all([fetchVariants(), fetchProducts()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
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

  const totalStock = variants.reduce(
    (total, variant) => total + Number(variant.stockQuantity || 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 bg-[#f8f5ef] text-sm text-[#857365]">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#e9ded1] border-t-[#79563b]" />
        <p>Loading product variants...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f8f5ef] p-4 text-[#39291f] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Page Header */}
        <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
              FASHION STORE / INVENTORY
            </p>

            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#39291f] sm:text-4xl">
              Product Variants
            </h1>

            <p className="mt-2 text-sm text-[#8d8177]">
              Manage sizes, colors, pricing and stock.
            </p>
          </div>

          <button
            type="button"
            className={buttonPrimary}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <span className="mr-2 text-base">↻</span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {/* Notifications */}
        {message && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-lg border border-[#d3e4d4] bg-[#f0f7ef] p-4 text-sm text-[#386746]"
          >
            <span>✓</span>
            <p>{message}</p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-lg border border-[#edcfca] bg-[#fff3f1] p-4 text-sm text-[#a23d32]"
          >
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        {/* Statistics */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-xl border border-[#ece2d6] bg-[#fffdf9] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[#e9d9c5] bg-[#f5ede2] text-lg text-[#8b6744]">
              ✦
            </div>
            <p className="text-xs font-semibold text-[#85776b]">
              Total Variants
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#39291f]">
              {variants.length}
            </h2>
            <p className="mt-2 text-xs text-[#a09488]">
              Size and color options
            </p>
          </article>

          <article className="rounded-xl border border-[#ece2d6] bg-[#fffdf9] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[#e9d9c5] bg-[#f5ede2] text-lg text-[#8b6744]">
              ◈
            </div>
            <p className="text-xs font-semibold text-[#85776b]">Products</p>
            <h2 className="mt-2 font-serif text-3xl text-[#39291f]">
              {products.length}
            </h2>
            <p className="mt-2 text-xs text-[#a09488]">Available products</p>
          </article>

          <article className="rounded-xl border border-[#51392b] bg-[#51392b] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 sm:p-6 xl:col-span-1">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-lg text-[#e9cba1]">
              ✧
            </div>
            <p className="text-xs font-semibold text-[#d1bfb0]">Total Stock</p>
            <h2 className="mt-2 font-serif text-3xl text-[#fff8ef]">
              {totalStock.toLocaleString("en-IN")}
            </h2>
            <p className="mt-2 text-xs text-[#d1bfb0]">Units in inventory</p>
          </article>
        </section>

        {/* Add / Edit Form */}
        <section className="mb-7 rounded-xl border border-[#eae0d5] bg-[#fffdf9] p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-[#eee5da] pb-5">
            <div>
              <p className="mb-2 text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
                {editingId ? "UPDATE VARIANT" : "NEW VARIANT"}
              </p>

              <h2 className="font-serif text-2xl font-medium text-[#39291f]">
                {editingId ? "Edit Product Variant" : "Add Product Variant"}
              </h2>

              <p className="mt-2 text-xs leading-5 text-[#8d8177]">
                Choose a product and enter its variant details.
              </p>
            </div>

            <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#e9d9c5] bg-[#f6efe6] text-xl text-[#98754e] sm:flex">
              ✳
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2"
          >
            <label className={`${labelClass} md:col-span-2`}>
              Product <span className="text-[#b55d4c]">*</span>
              <select
                name="ProductId"
                value={form.ProductId}
                onChange={handleChange}
                className={inputClass}
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

            <label className={labelClass}>
              Size <span className="text-[#b55d4c]">*</span>
              <select
                name="size"
                value={form.size}
                onChange={handleChange}
                className={inputClass}
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

            <label className={labelClass}>
              Color <span className="text-[#b55d4c]">*</span>
              <input
                name="color"
                value={form.color}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. Black"
                required
              />
            </label>

            <label className={labelClass}>
              SKU <span className="text-[#b55d4c]">*</span>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. KUR-BLK-M-001"
                required
              />
            </label>

            <label className={labelClass}>
              Selling Price (₹) <span className="text-[#b55d4c]">*</span>
              <input
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.sellingPrice}
                onChange={handleChange}
                className={inputClass}
                placeholder="1499"
                required
              />
            </label>

            <label className={labelClass}>
              Stock Quantity <span className="text-[#b55d4c]">*</span>
              <input
                name="stockQuantity"
                type="number"
                min="0"
                step="1"
                value={form.stockQuantity}
                onChange={handleChange}
                className={inputClass}
                placeholder="20"
                required
              />
            </label>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row md:col-span-2">
              <button
                type="submit"
                className={buttonPrimary}
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
                  className={buttonSecondary}
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {products.length === 0 && (
              <p className="text-xs leading-5 text-[#a16c42] md:col-span-2">
                ആദ്യം Products Management page-ൽ ഒരു product create ചെയ്യുക.
              </p>
            )}
          </form>
        </section>

        {/* Inventory Table */}
        <section className="mb-7 rounded-xl border border-[#eae0d5] bg-[#fffdf9] p-5 shadow-sm sm:p-7">
          <div className="mb-6 border-b border-[#eee5da] pb-5">
            <p className="mb-2 text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
              INVENTORY DETAILS
            </p>
            <h2 className="font-serif text-2xl font-medium text-[#39291f]">
              All Product Variants
            </h2>
            <p className="mt-2 text-xs text-[#8d8177]">
              {variants.length} variants in your inventory
            </p>
          </div>

          {variants.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 py-10 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#e8d8c4] bg-[#f7efe5] text-2xl text-[#98754e]">
                ✧
              </span>
              <h3 className="font-serif text-xl text-[#493528]">
                No variants yet
              </h3>
              <p className="mt-2 text-xs leading-5 text-[#958579]">
                Add a size and color option using the form above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#eee4d9]">
              <table className="w-full min-w-[790px] border-collapse text-left">
                <thead className="bg-[#f6efe6]">
                  <tr>
                    {[
                      "Product",
                      "Size",
                      "Color",
                      "SKU",
                      "Price",
                      "Stock",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap border-b border-[#e8ddd0] px-4 py-4 text-[10px] font-extrabold tracking-wider text-[#786452]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0e8df]">
                  {variants.map((variant) => (
                    <tr
                      key={variant._id}
                      className="transition hover:bg-[#faf5ee]"
                    >
                      <td className="px-4 py-4">
                        <div className="flex min-w-[150px] items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#e9d9c5] bg-[#f5ede2] text-sm text-[#98754e]">
                            ✦
                          </span>
                          <strong className="text-xs font-bold text-[#463326]">
                            {getProductName(variant)}
                          </strong>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-md border border-[#e4d8c8] bg-[#f7f0e7] px-2.5 py-1.5 text-[11px] font-bold text-[#795a3c]">
                          {variant.size}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-xs text-[#6e5b4b]">
                        {variant.color}
                      </td>

                      <td className="px-4 py-4">
                        <span className="whitespace-nowrap rounded border border-[#eee5db] bg-[#faf6f0] px-2 py-1.5 font-mono text-[11px] text-[#877768]">
                          {variant.sku}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs font-extrabold text-[#493323]">
                        ₹
                        {Number(variant.sellingPrice || 0).toLocaleString(
                          "en-IN",
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-bold ${
                            Number(variant.stockQuantity || 0) > 0
                              ? "border border-[#d7e6d5] bg-[#eff7ed] text-[#47734b]"
                              : "border border-[#efd3cd] bg-[#fff4f1] text-[#a34032]"
                          }`}
                        >
                          {variant.stockQuantity ?? 0} units
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className={buttonSecondary}
                            onClick={() => handleEdit(variant)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={buttonDanger}
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

        {/* Footer */}
        <footer className="flex flex-col justify-between gap-3 px-1 pb-2 text-[10px] tracking-wider text-[#a19487] sm:flex-row">
          <span className="font-extrabold text-[#81634a]">
            ÉLORA · FASHION ADMIN
          </span>
          <span>Designed with care ✦</span>
        </footer>
      </div>
    </div>
  );
}

export default ProductVariants;
