import { useEffect, useMemo, useState } from "react";
import {
  getProductVariants,
  updateProductVariant,
} from "../../api/productVariantApi";

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
      if (isRefresh) setRefreshing(true);
      setError("");

      const response = await getProductVariants();
      const data = response?.data?.data ?? response?.data ?? response;

      setVariants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Inventory load ചെയ്യാൻ കഴിഞ്ഞില്ല. Login, API എന്നിവ പരിശോധിക്കുക.",
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

    if (product && typeof product === "object") {
      return product.name || "Product";
    }

    return "Product";
  };

  const getStock = (variant) => Number(variant.stockQuantity || 0);

  const getStockStatus = (variant) => {
    const stock = getStock(variant);

    if (stock <= 0) {
      return { label: "Out of Stock", className: "inventory-status out" };
    }

    if (stock <= 5) {
      return { label: "Low Stock", className: "inventory-status low" };
    }

    return { label: "In Stock", className: "inventory-status available" };
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
      setError("Stock quantity പൂജ്യം അല്ലെങ്കിൽ positive integer ആയിരിക്കണം.");
      return;
    }

    const productRef = variant.ProductId || variant.productId;
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

      setMessage(`Stock updated successfully for SKU ${variant.sku}.`);
      cancelStockEdit();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Stock update ചെയ്യാൻ കഴിഞ്ഞില്ല. Backend update service പരിശോധിക്കുക.",
      );
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="fashion-loading">
        <span className="fashion-spinner" />
        <p>Loading inventory...</p>
      </div>
    );
  }

  return (
    <main className="inventory-page">
      <header className="products-header">
        <div>
          <p className="fashion-eyebrow">ÉLORA / STOCK MANAGEMENT</p>
          <h1>Inventory Management</h1>
          <p className="fashion-subtitle">
            Monitor stock levels and keep your fashion collection organised.
          </p>
        </div>

        <button
          type="button"
          className="fashion-button"
          disabled={refreshing}
          onClick={() => fetchInventory(true)}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh Inventory"}
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

      {/* INVENTORY SUMMARY */}
      <section className="fashion-stats">
        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">◈</span>
          <p>Total Variants</p>
          <h2>{variants.length}</h2>
          <span className="fashion-stat-note">
            Tracked size and color options
          </span>
        </article>

        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">▦</span>
          <p>Total Stock Units</p>
          <h2>{totalStock.toLocaleString("en-IN")}</h2>
          <span className="fashion-stat-note">Units across all variants</span>
        </article>

        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">⚠</span>
          <p>Low Stock</p>
          <h2>{lowStockCount}</h2>
          <span className="fashion-stat-note">Variants with 1–5 units</span>
        </article>

        <article className="fashion-stat-card dark-stat">
          <span className="fashion-stat-icon">◇</span>
          <p>Out of Stock</p>
          <h2>{outOfStockCount}</h2>
          <span className="fashion-stat-note">Variants with zero units</span>
        </article>
      </section>

      {/* INVENTORY TABLE */}
      <section className="fashion-card">
        <div className="fashion-section-heading">
          <div>
            <p className="fashion-eyebrow">STOCK OVERVIEW</p>
            <h2>All Inventory</h2>
            <p>View stock levels and update individual variants.</p>
          </div>
        </div>

        <div className="inventory-filters">
          <input
            type="search"
            placeholder="Search product, SKU, size or color..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search inventory"
          />

          <select
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

        {filteredVariants.length === 0 ? (
          <div className="fashion-empty">
            <span>◈</span>
            <h3>
              {variants.length === 0
                ? "No inventory records"
                : "No matching variants"}
            </h3>
            <p>
              {variants.length === 0
                ? "Add product variants to begin tracking inventory."
                : "Try a different search term or stock filter."}
            </p>
          </div>
        ) : (
          <div className="fashion-table-wrap">
            <table className="fashion-table inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredVariants.map((variant) => {
                  const status = getStockStatus(variant);
                  const isEditing = editingId === variant._id;
                  const isSaving = savingId === variant._id;

                  return (
                    <tr key={variant._id}>
                      <td>
                        <div className="fashion-product-name">
                          <span className="fashion-product-icon">✦</span>
                          <strong>{getProductName(variant)}</strong>
                        </div>
                      </td>

                      <td>
                        <div className="inventory-variant-info">
                          <strong>{variant.size || "—"}</strong>
                          <span>{variant.color || "—"}</span>
                        </div>
                      </td>

                      <td>
                        <span className="fashion-slug">
                          {variant.sku || "—"}
                        </span>
                      </td>

                      <td className="fashion-price">
                        ₹
                        {Number(variant.sellingPrice || 0).toLocaleString(
                          "en-IN",
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            className="inventory-stock-input"
                            type="number"
                            min="0"
                            step="1"
                            value={stockInput}
                            onChange={(event) =>
                              setStockInput(event.target.value)
                            }
                            aria-label={`New stock for ${variant.sku}`}
                          />
                        ) : (
                          <strong className="inventory-stock-value">
                            {getStock(variant)} units
                          </strong>
                        )}
                      </td>

                      <td>
                        <span className={status.className}>{status.label}</span>
                      </td>

                      <td>
                        <div className="fashion-actions">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className="fashion-button small-button"
                                disabled={isSaving}
                                onClick={() => saveStock(variant)}
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </button>

                              <button
                                type="button"
                                className="fashion-button secondary small-button"
                                disabled={isSaving}
                                onClick={cancelStockEdit}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="fashion-button secondary small-button"
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

        <p className="inventory-results">
          Showing {filteredVariants.length} of {variants.length} variants
        </p>
      </section>

      <footer className="fashion-footer">
        <span>ÉLORA · INVENTORY MANAGEMENT</span>
        <span>Designed with care ✦</span>
      </footer>
    </main>
  );
}

export default Inventory;
