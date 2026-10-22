import { useEffect, useState } from "react";

import {
  getProductVariants,
  getDashboardProducts,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from "../../api/productVariantApi";

const EMPTY_FORM = {
  productId: "",
  size: "",
  color: "",
  sku: "",
  sellingPrice: "",
  stockQuantity: "0",
  active: true,
};

function extractArray(response, key) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.[key])) return response[key];
  if (Array.isArray(response?.data?.[key])) {
    return response.data[key];
  }
  return [];
}

function getVariantProductId(variant) {
  const product = variant.productId || variant.product;

  if (typeof product === "string") return product;

  return product?._id || "";
}

function ProductVariants() {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [variantResponse, productResponse] = await Promise.all([
        getProductVariants(),
        getDashboardProducts(),
      ]);

      setVariants(extractArray(variantResponse, "variants"));
      setProducts(extractArray(productResponse, "products"));
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to load variants or products. Check your login and API routes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingVariant(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (variant) => {
    setEditingVariant(variant);

    setForm({
      productId: getVariantProductId(variant),
      size: variant.size || "",
      color: variant.color || "",
      sku: variant.sku || "",
      sellingPrice: String(variant.sellingPrice ?? ""),
      stockQuantity: String(variant.stockQuantity ?? 0),
      active: variant.active !== false,
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingVariant(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.productId ||
      !form.size.trim() ||
      !form.color.trim() ||
      !form.sku.trim() ||
      form.sellingPrice === "" ||
      form.stockQuantity === ""
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const price = Number(form.sellingPrice);
    const stock = Number(form.stockQuantity);

    if (!Number.isFinite(price) || price < 0) {
      setError("Selling price must be zero or greater.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock quantity must be a whole number of zero or greater.");
      return;
    }

    const payload = {
      productId: form.productId,
      size: form.size.trim(),
      color: form.color.trim(),
      sku: form.sku.trim(),
      sellingPrice: price,
      stockQuantity: stock,
      active: form.active,
    };

    try {
      setSaving(true);

      if (editingVariant) {
        await updateProductVariant(editingVariant._id, payload);
        setSuccess("Variant updated successfully.");
      } else {
        await createProductVariant(payload);
        setSuccess("Variant created successfully.");
      }

      setModalOpen(false);
      setEditingVariant(null);
      setForm(EMPTY_FORM);

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Unable to save the variant.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product variant?")) return;

    setError("");
    setSuccess("");

    try {
      await deleteProductVariant(id);

      setVariants((current) => current.filter((variant) => variant._id !== id));

      setSuccess("Variant deleted successfully.");
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Unable to delete the variant.");
    }
  };

  const productName = (variant) => {
    const product = variant.productId || variant.product;

    if (typeof product === "object" && product?.name) {
      return product.name;
    }

    const id = typeof product === "string" ? product : product?._id;

    return products.find((item) => item._id === id)?.name || "Product";
  };

  if (loading) {
    return (
      <div className="p-6 text-[#544339]">Loading product variants...</div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4EE] p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#544339] sm:text-3xl">
              Product Variants
            </h1>
            <p className="mt-2 text-sm text-[#8A6C5F]">
              Manage sizes, colours, prices and stock.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={fetchData}
              className="rounded-lg border border-[#D2C5B8] px-4 py-3 text-sm text-[#544339] hover:bg-[#E0D9CF]"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="rounded-lg bg-[#544339] px-5 py-3 text-sm text-white hover:bg-[#8A6C5F]"
            >
              + Add Variant
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {error && !modalOpen && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-[#E0D9CF] bg-white shadow-sm">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-[#E0D9CF]/50 text-[#544339]">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Size</th>
                <th className="px-5 py-4">Colour</th>
                <th className="px-5 py-4">SKU</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E0D9CF]">
              {variants.map((variant) => (
                <tr key={variant._id} className="hover:bg-[#F8F4EE]">
                  <td className="px-5 py-4 font-medium text-[#544339]">
                    {productName(variant)}
                  </td>

                  <td className="px-5 py-4">{variant.size || "-"}</td>
                  <td className="px-5 py-4">{variant.color || "-"}</td>
                  <td className="px-5 py-4 text-[#8A6C5F]">
                    {variant.sku || "-"}
                  </td>

                  <td className="px-5 py-4">
                    ₹{Number(variant.sellingPrice || 0).toLocaleString("en-IN")}
                  </td>

                  <td className="px-5 py-4">{variant.stockQuantity ?? 0}</td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        variant.active !== false
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {variant.active !== false ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => openEditModal(variant)}
                        className="font-medium text-[#8A6C5F] hover:text-[#544339]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(variant._id)}
                        className="font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {variants.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-[#8A6C5F]"
                  >
                    No variants found. Click Add Variant to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-[#8A6C5F]">
          Total variants: {variants.length}
        </p>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#544339]">
                  {editingVariant ? "Edit Variant" : "Add Variant"}
                </h2>
                <p className="mt-1 text-sm text-[#8A6C5F]">
                  Select an existing product and enter variant details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-2xl text-[#8A6C5F]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#544339]">
                    Product *
                  </label>

                  <select
                    name="productId"
                    value={form.productId}
                    onChange={handleChange}
                    required
                    disabled={Boolean(editingVariant)}
                    className="w-full rounded-lg border border-[#D2C5B8] bg-white px-4 py-3 text-sm outline-none focus:border-[#8A6C5F] disabled:bg-gray-100"
                  >
                    <option value="">Select product</option>

                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name}
                      </option>
                    ))}
                  </select>

                  {products.length === 0 && (
                    <p className="mt-2 text-xs text-red-600">
                      Products could not be loaded. Check the product API and
                      your dashboard permissions.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#544339]">
                    Size *
                  </label>
                  <input
                    name="size"
                    value={form.size}
                    onChange={handleChange}
                    placeholder="M, L, XL"
                    required
                    className="w-full rounded-lg border border-[#D2C5B8] px-4 py-3 outline-none focus:border-[#8A6C5F]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#544339]">
                    Colour *
                  </label>
                  <input
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    placeholder="Black, Red"
                    required
                    className="w-full rounded-lg border border-[#D2C5B8] px-4 py-3 outline-none focus:border-[#8A6C5F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#544339]">
                    SKU *
                  </label>
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="DRESS-BLK-M-001"
                    required
                    className="w-full rounded-lg border border-[#D2C5B8] px-4 py-3 outline-none focus:border-[#8A6C5F]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#544339]">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={form.sellingPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="1499"
                    required
                    className="w-full rounded-lg border border-[#D2C5B8] px-4 py-3 outline-none focus:border-[#8A6C5F]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#544339]">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={form.stockQuantity}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    required
                    className="w-full rounded-lg border border-[#D2C5B8] px-4 py-3 outline-none focus:border-[#8A6C5F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-3 text-sm text-[#544339]">
                    <input
                      type="checkbox"
                      name="active"
                      checked={form.active}
                      onChange={handleChange}
                      className="h-4 w-4 accent-[#544339]"
                    />
                    Variant is active
                  </label>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-[#D2C5B8] px-5 py-3 text-sm text-[#544339] hover:bg-[#F8F4EE] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || products.length === 0}
                  className="rounded-lg bg-[#544339] px-6 py-3 text-sm font-medium text-white hover:bg-[#8A6C5F] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingVariant
                      ? "Update Variant"
                      : "Create Variant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductVariants;
