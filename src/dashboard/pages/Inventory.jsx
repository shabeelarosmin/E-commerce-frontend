import { useEffect, useMemo, useState } from "react";
import {
  getProductVariants,
  updateProductVariant,
} from "../../api/productVariantApi";

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#51392b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6b4b37] focus:outline-none focus:ring-4 focus:ring-[#51392b]/15 disabled:cursor-not-allowed disabled:opacity-50";

const buttonSecondary =
  "inline-flex items-center justify-center rounded-xl border border-[#e4d6c5] bg-[#fffdf9] px-3 py-2 text-xs font-semibold text-[#654a35] transition hover:bg-[#f5ede2] disabled:opacity-50";

const fieldClass =
  "w-full rounded-xl border border-[#e6dacb] bg-[#fffefa] px-4 py-3 text-sm text-[#463326] outline-none transition placeholder:text-[#b3a496] focus:border-[#9b774f] focus:ring-4 focus:ring-[#9b774f]/10";

function Inventory() {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [stockInput, setStockInput] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchInventory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      setError("");

      const response = await getProductVariants();
      const data = response?.data?.data ?? response?.data ?? response;

      setVariants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load inventory. Please check your login and API connection.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const getProductName = (variant) => {
    const product = variant.ProductId || variant.productId || variant.product;

    return product && typeof product === "object"
      ? product.name || "Product"
      : "Product";
  };

  const getStock = (variant) => Number(variant.stockQuantity || 0);

  const getStockStatus = (variant) => {
    const stock = getStock(variant);

    if (stock <= 0) {
      return {
        label: "Out of Stock",
        className: "bg-rose-50 text-rose-700 ring-rose-200",
      };
    }

    if (stock <= 5) {
      return {
        label: "Low Stock",
        className: "bg-amber-50 text-amber-800 ring-amber-200",
      };
    }

    return {
      label: "In Stock",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  };

  const totalStock = variants.reduce(
    (total, variant) => total + getStock(variant),
    0,
  );

  const lowStockCount = variants.filter(
    (variant) => getStock(variant) > 0 && getStock(variant) <= 5,
  ).length;

  const outOfStockCount = variants.filter(
    (variant) => getStock(variant) <= 0,
  ).length;

  const filteredVariants = useMemo(() => {
    const query = search.trim().toLowerCase();

    return variants.filter((variant) => {
      const searchableText = [
        getProductName(variant),
        variant.sku,
        variant.size,
        variant.color,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const stock = getStock(variant);
      const matchesSearch = !query || searchableText.includes(query);

      const matchesFilter =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && stock > 5) ||
        (stockFilter === "low-stock" && stock > 0 && stock <= 5) ||
        (stockFilter === "out-of-stock" && stock <= 0);

      return matchesSearch && matchesFilter;
    });
  }, [variants, search, stockFilter]);

  const startStockEdit = (variant) => {
    setEditingId(variant._id);
    setStockInput(String(getStock(variant)));
    setMessage("");
    setError("");
  };

  const cancelStockEdit = () => {
    setEditingId(null);
    setStockInput("");
  };

  const saveStock = async (variant) => {
    const newStock = Number(stockInput);

    if (
      stockInput.trim() === "" ||
      !Number.isInteger(newStock) ||
      newStock < 0
    ) {
      setError("Stock quantity must be zero or a positive whole number.");
      return;
    }

    const productRef =
      variant.ProductId || variant.productId || variant.product;

    const productId =
      productRef && typeof productRef === "object"
        ? productRef._id
        : productRef;

    const payload = {
      productId,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      sellingPrice: Number(variant.sellingPrice),
      stockQuantity: newStock,
    };

    try {
      setSavingId(variant._id);
      setMessage("");
      setError("");

      await updateProductVariant(variant._id, payload);

      setVariants((current) =>
        current.map((item) =>
          item._id === variant._id
            ? { ...item, stockQuantity: newStock }
            : item,
        ),
      );

      setMessage(`Stock updated successfully for SKU ${variant.sku || "N/A"}.`);

      cancelStockEdit();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update stock. Please check the backend update service.",
      );
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#f7f3ed] text-[#806b57]">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#e7d9c8] border-t-[#51392b]" />
        <p className="text-sm">Loading inventory...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-4 py-6 sm:px-6 lg:px-9 lg:py-9">
      <div className="mx-auto max-w-[1600px] space-y-7">
        {/* HEADER */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-[10px] font-extrabold tracking-[2.5px] text-[#a17b50]">
              ÉLORA / STOCK MANAGEMENT
            </p>

            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#39291f] sm:text-4xl">
              Inventory Management
            </h1>

            <p className="mt-2 text-sm text-[#8d8177]">
              Monitor stock levels and keep your fashion collection organised.
            </p>
          </div>

          <button
            type="button"
            className={buttonPrimary}
            disabled={refreshing}
            onClick={() => fetchInventory(true)}
          >
            <span className="text-lg">↻</span>
            {refreshing ? "Refreshing..." : "Refresh Inventory"}
          </button>
        </header>

        {/* ALERTS */}
        {message && (
          <div
            className="flex items-start gap-3 rounded-xl border border-[#d9e7d1] bg-[#f1f7ed] px-4 py-3 text-sm text-[#50754b]"
            role="status"
          >
            <span className="font-bold">✓</span>
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div
            className="flex items-start gap-3 rounded-xl border border-[#edcfca] bg-[#fff3f1] px-4 py-3 text-sm text-[#a23d32]"
            role="alert"
          >
            <span className="font-bold">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <StatCard
            symbol="◈"
            title="Total Variants"
            value={variants.length}
            note="Tracked size and color options"
          />

          <StatCard
            symbol="▦"
            title="Total Stock Units"
            value={totalStock.toLocaleString("en-IN")}
            note="Units across all variants"
          />

          <StatCard
            symbol="⚠"
            title="Low Stock"
            value={lowStockCount}
            note="Variants with 1–5 units"
            warning
          />

          <StatCard
            symbol="◇"
            title="Out of Stock"
            value={outOfStockCount}
            note="Variants with zero units"
            dark
          />
        </section>

        {/* INVENTORY TABLE */}
        <section className="overflow-hidden rounded-2xl border border-[#e9dfd3] bg-[#fffdf9] shadow-[0_8px_30px_rgba(70,48,30,0.035)]">
          <div className="border-b border-[#eee5da] px-5 py-6 sm:px-8">
            <p className="mb-2 text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
              STOCK OVERVIEW
            </p>

            <h2 className="font-serif text-2xl text-[#39291f]">
              All Inventory
            </h2>

            <p className="mt-2 text-sm text-[#958579]">
              View stock levels and update individual variants.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#a18e7b]">
                  ⌕
                </span>

                <input
                  type="search"
                  className={`${fieldClass} pl-10`}
                  placeholder="Search product, SKU, size or color..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search inventory"
                />
              </div>

              <select
                className={fieldClass}
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
                aria-label="Filter inventory by stock"
              >
                <option value="all">All stock levels</option>
                <option value="in-stock">In stock (&gt; 5)</option>
                <option value="low-stock">Low stock (1–5)</option>
                <option value="out-of-stock">Out of stock (0)</option>
              </select>
            </div>
          </div>

          {filteredVariants.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#eadcc9] bg-[#f7efe4] font-serif text-3xl text-[#9a774f]">
                ◈
              </span>

              <h3 className="mt-5 font-serif text-xl text-[#51392b]">
                {variants.length === 0
                  ? "No inventory records"
                  : "No matching variants"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-[#958579]">
                {variants.length === 0
                  ? "Add product variants to begin tracking inventory."
                  : "Try a different search term or stock filter."}
              </p>

              {(search || stockFilter !== "all") && (
                <button
                  type="button"
                  className="mt-5 rounded-xl border border-[#e5d7c5] px-4 py-2 text-xs font-semibold text-[#654a35] hover:bg-[#f5ede3]"
                  onClick={() => {
                    setSearch("");
                    setStockFilter("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead>
                  <tr className="bg-[#faf6f0]">
                    {[
                      "Product",
                      "Variant",
                      "SKU",
                      "Price",
                      "Stock",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[1.2px] text-[#8e7864]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0e8de]">
                  {filteredVariants.map((variant) => {
                    const status = getStockStatus(variant);
                    const isEditing = editingId === variant._id;
                    const isSaving = savingId === variant._id;

                    return (
                      <tr
                        key={variant._id}
                        className="transition hover:bg-[#fcf8f2]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#eadcc9] bg-[#f7efe4] text-lg text-[#9a774f]">
                              ✦
                            </span>

                            <div>
                              <p className="font-semibold text-[#51392b]">
                                {getProductName(variant)}
                              </p>

                              <p className="mt-1 text-[10px] text-[#a09284]">
                                Product variant
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-[#51392b]">
                            {variant.size || "—"}
                          </p>

                          <p className="mt-1 text-xs text-[#958579]">
                            {variant.color || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-block rounded-lg border border-[#eee2d2] bg-[#faf6f0] px-2.5 py-1.5 font-mono text-xs text-[#76583d]">
                            {variant.sku || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-[#51392b]">
                          ₹
                          {Number(variant.sellingPrice || 0).toLocaleString(
                            "en-IN",
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {isEditing ? (
                            <input
                              className="w-24 rounded-lg border border-[#cbb293] bg-white px-3 py-2 text-sm text-[#51392b] outline-none focus:ring-4 focus:ring-[#9b774f]/10"
                              type="number"
                              min="0"
                              step="1"
                              value={stockInput}
                              onChange={(event) =>
                                setStockInput(event.target.value)
                              }
                              aria-label={`New stock for ${variant.sku || "variant"}`}
                            />
                          ) : (
                            <span className="text-sm font-semibold text-[#51392b]">
                              {getStock(variant)}{" "}
                              <span className="text-xs font-normal text-[#958579]">
                                units
                              </span>
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 ring-inset ${status.className}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {status.label}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  className={buttonPrimary}
                                  disabled={isSaving}
                                  onClick={() => saveStock(variant)}
                                >
                                  {isSaving ? "Saving..." : "Save"}
                                </button>

                                <button
                                  type="button"
                                  className={buttonSecondary}
                                  disabled={isSaving}
                                  onClick={cancelStockEdit}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className={buttonSecondary}
                                onClick={() => startStockEdit(variant)}
                              >
                                Update Stock
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-[#eee5da] px-5 py-4 text-xs text-[#958579] sm:px-8">
            Showing {filteredVariants.length} of {variants.length} variants
          </div>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col items-center justify-between gap-2 border-t border-[#e6dbce] pt-5 text-[10px] font-semibold tracking-[1.5px] text-[#9a8877] sm:flex-row">
          <span>ÉLORA · INVENTORY MANAGEMENT</span>
          <span>DESIGNED WITH CARE ✦</span>
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  symbol,
  title,
  value,
  note,
  dark = false,
  warning = false,
}) {
  const cardClass = dark
    ? "border-[#51392b] bg-[#51392b] text-white"
    : "border-[#e9dfd3] bg-[#fffdf9] text-[#39291f]";

  const iconClass = dark
    ? "bg-white/10 text-[#e7c79e]"
    : warning
      ? "bg-amber-50 text-amber-700"
      : "bg-[#f5ede2] text-[#9a774f]";

  return (
    <article
      className={`rounded-2xl border p-5 shadow-[0_8px_25px_rgba(70,48,30,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(70,48,30,0.07)] sm:p-6 ${cardClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={`text-sm font-medium ${
            dark ? "text-white/70" : "text-[#8d8177]"
          }`}
        >
          {title}
        </p>

        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${iconClass}`}
        >
          {symbol}
        </span>
      </div>

      <h2 className="mt-5 break-words font-serif text-3xl">{value}</h2>

      <p
        className={`mt-2 text-xs ${dark ? "text-white/55" : "text-[#a09284]"}`}
      >
        {note}
      </p>
    </article>
  );
}

export default Inventory;
