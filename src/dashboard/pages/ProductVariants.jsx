import { useEffect, useState } from "react";
import {
  getProductVariants,
  deleteProductVariant,
} from "../../api/productVariantApi";

function ProductVariants() {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVariants = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getProductVariants();

      const data = Array.isArray(response)
        ? response
        : response?.data || response?.variants || [];

      setVariants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to load product variants.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this variant?",
    );

    if (!confirmed) return;

    try {
      await deleteProductVariant(id);
      setVariants((previous) =>
        previous.filter((variant) => variant._id !== id),
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete variant.");
    }
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
              Manage product sizes, colours, prices and stock.
            </p>
          </div>

          <button
            onClick={fetchVariants}
            className="rounded-lg bg-[#544339] px-5 py-3 text-sm text-white transition hover:bg-[#8A6C5F]"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-[#E0D9CF] bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[#E0D9CF]/50 text-[#544339]">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Size</th>
                <th className="px-5 py-4">Colour</th>
                <th className="px-5 py-4">SKU</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E0D9CF]">
              {variants.map((variant) => (
                <tr key={variant._id} className="transition hover:bg-[#F8F4EE]">
                  <td className="px-5 py-4 font-medium text-[#544339]">
                    {variant.productId?.name ||
                      variant.product?.name ||
                      "Product"}
                  </td>

                  <td className="px-5 py-4 text-[#544339]">
                    {variant.size || "-"}
                  </td>

                  <td className="px-5 py-4 text-[#544339]">
                    {variant.color || "-"}
                  </td>

                  <td className="px-5 py-4 text-[#8A6C5F]">
                    {variant.sku || "-"}
                  </td>

                  <td className="px-5 py-4 text-[#544339]">
                    ₹{Number(variant.sellingPrice || 0).toLocaleString("en-IN")}
                  </td>

                  <td className="px-5 py-4 text-[#544339]">
                    {variant.stockQuantity ?? 0}
                  </td>

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
                    <button
                      onClick={() => handleDelete(variant._id)}
                      className="font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {variants.length === 0 && !error && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-[#8A6C5F]"
                  >
                    No product variants found.
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
    </div>
  );
}

export default ProductVariants;
