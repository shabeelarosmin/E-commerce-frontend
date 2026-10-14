import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getAdminProducts } from "../../api/productApi";
import { getAllOrders } from "../../api/orderApi";
import { getProductVariants } from "../../api/productVariantApi";

function DashboardHome() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        getAdminProducts(),
        getAllOrders(),
        getProductVariants(),
      ]);

      const getList = (result) => {
        if (result.status !== "fulfilled") return [];

        const response = result.value;
        const data = response?.data?.data ?? response?.data ?? response;

        return Array.isArray(data) ? data : [];
      };

      setProducts(getList(results[0]));
      setOrders(getList(results[1]));
      setVariants(getList(results[2]));

      if (results.every((result) => result.status === "rejected")) {
        setError(
          "Dashboard data load ചെയ്യാൻ കഴിഞ്ഞില്ല. Login, API എന്നിവ പരിശോധിക്കുക.",
        );
      } else if (results.some((result) => result.status === "rejected")) {
        setError(
          "ചില dashboard വിവരങ്ങൾ load ആയില്ല. API connection പരിശോധിക്കുക.",
        );
      }
    } catch {
      setError("Dashboard load ചെയ്യാൻ കഴിഞ്ഞില്ല.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const money = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const totalOrderValue = orders.reduce((total, order) => {
    const status = String(order.orderStatus || "").toLowerCase();

    if (["cancelled", "canceled"].includes(status)) return total;

    return total + Number(order.totalAmount || order.totalPrice || 0);
  }, 0);

  const pendingOrders = orders.filter((order) =>
    ["placed", "pending"].includes(
      String(order.orderStatus || "").toLowerCase(),
    ),
  ).length;

  const lowStockVariants = variants.filter((variant) => {
    const stock = Number(variant.stockQuantity || 0);
    return stock <= 5;
  });

  const recentOrders = [...orders]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  const orderStatusClass = (status) => {
    const value = String(status || "placed").toLowerCase();

    if (value === "delivered") return "home-status delivered";
    if (["cancelled", "canceled"].includes(value)) {
      return "home-status cancelled";
    }
    if (value === "shipped") return "home-status shipped";
    if (["confirmed", "processing"].includes(value)) {
      return "home-status confirmed";
    }

    return "home-status placed";
  };

  const statusLabel = (status) => {
    const value = String(status || "placed");
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  if (loading) {
    return (
      <div className="fashion-loading dashboard-loading">
        <span className="fashion-spinner" />
        <p>Preparing your dashboard...</p>
      </div>
    );
  }

  return (
    <main className="admin-home">
      {/* PAGE HEADER */}
      <header className="home-header">
        <div>
          <p className="fashion-eyebrow">ÉLORA / ADMINISTRATION</p>
          <h1>Dashboard Overview</h1>
          <p className="fashion-subtitle">
            Welcome back! Here is an overview of your fashion store.
          </p>
        </div>

        <button
          type="button"
          className="fashion-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          ↻ Refresh Dashboard
        </button>
      </header>

      {error && (
        <div className="fashion-alert error" role="alert">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <section className="home-stats">
        <article className="home-stat-card">
          <div className="home-stat-top">
            <span className="home-stat-icon">✦</span>
            <span className="home-stat-caption">CATALOG</span>
          </div>
          <p>Total Products</p>
          <h2>{products.length}</h2>
          <span className="home-stat-note">Products in your store</span>
          <Link to="/dashboard/products" className="home-stat-link">
            Manage products →
          </Link>
        </article>

        <article className="home-stat-card">
          <div className="home-stat-top">
            <span className="home-stat-icon">◇</span>
            <span className="home-stat-caption">SALES</span>
          </div>
          <p>Total Orders</p>
          <h2>{orders.length}</h2>
          <span className="home-stat-note">
            {pendingOrders} awaiting confirmation
          </span>
          <Link to="/dashboard/orders" className="home-stat-link">
            View orders →
          </Link>
        </article>

        <article className="home-stat-card">
          <div className="home-stat-top">
            <span className="home-stat-icon">◈</span>
            <span className="home-stat-caption">INVENTORY</span>
          </div>
          <p>Product Variants</p>
          <h2>{variants.length}</h2>
          <span className="home-stat-note">Sizes and color options</span>
          <Link to="/dashboard/product-variants" className="home-stat-link">
            Manage variants →
          </Link>
        </article>

        <article className="home-stat-card home-stat-dark">
          <div className="home-stat-top">
            <span className="home-stat-icon">₹</span>
            <span className="home-stat-caption">ORDER VALUE</span>
          </div>
          <p>Total Order Value</p>
          <h2>{money(totalOrderValue)}</h2>
          <span className="home-stat-note">Excluding cancelled orders</span>
          <Link to="/dashboard/orders" className="home-stat-link">
            View sales →
          </Link>
        </article>
      </section>

      {/* MAIN CONTENT */}
      <section className="home-content-grid">
        {/* RECENT ORDERS */}
        <div className="home-panel home-orders-panel">
          <div className="home-panel-header">
            <div>
              <p className="fashion-eyebrow">LATEST ACTIVITY</p>
              <h2>Recent Orders</h2>
              <p>Keep track of your latest customer orders.</p>
            </div>

            <Link to="/dashboard/orders" className="home-text-link">
              View all →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="home-empty">
              <span>◇</span>
              <h3>No orders yet</h3>
              <p>New orders will appear here.</p>
            </div>
          ) : (
            <div className="home-table-wrap">
              <table className="home-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <strong>
                          #{String(order._id).slice(-6).toUpperCase()}
                        </strong>
                      </td>

                      <td>
                        {order.customerId?.name ||
                          order.customer?.name ||
                          "Customer"}
                      </td>

                      <td className="home-table-price">
                        {money(order.totalAmount || order.totalPrice)}
                      </td>

                      <td>
                        <span className={orderStatusClass(order.orderStatus)}>
                          {statusLabel(order.orderStatus)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* INVENTORY SUMMARY */}
        <aside className="home-panel home-inventory-panel">
          <div className="home-panel-header">
            <div>
              <p className="fashion-eyebrow">STOCK OVERVIEW</p>
              <h2>Inventory Alert</h2>
              <p>Variants with five or fewer units.</p>
            </div>
            <span className="home-inventory-icon">◈</span>
          </div>

          <div className="home-inventory-summary">
            <span>Low-stock variants</span>
            <strong>{lowStockVariants.length}</strong>
          </div>

          {lowStockVariants.length === 0 ? (
            <div className="home-stock-ok">
              <span>✓</span>
              <p>No low-stock variants found.</p>
            </div>
          ) : (
            <div className="home-stock-list">
              {lowStockVariants.slice(0, 5).map((variant) => (
                <div className="home-stock-item" key={variant._id}>
                  <div className="home-stock-symbol">✦</div>
                  <div className="home-stock-details">
                    <strong>
                      {variant.ProductId?.name ||
                        variant.productId?.name ||
                        "Product variant"}
                    </strong>
                    <span>
                      {[variant.size, variant.color]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <span
                    className={
                      Number(variant.stockQuantity || 0) === 0
                        ? "home-stock-count out"
                        : "home-stock-count"
                    }
                  >
                    {variant.stockQuantity ?? 0}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/dashboard/product-variants"
            className="home-inventory-link"
          >
            Manage inventory →
          </Link>
        </aside>
      </section>

      {/* QUICK ACTIONS */}
      <section className="home-quick-section">
        <div className="home-quick-heading">
          <p className="fashion-eyebrow">QUICK ACCESS</p>
          <h2>Manage Your Store</h2>
        </div>

        <div className="home-quick-links">
          <Link to="/dashboard/products" className="home-quick-card">
            <span className="home-quick-icon">✦</span>
            <h3>Products</h3>
            <p>Add and manage your clothing catalog.</p>
            <b>Open page ↗</b>
          </Link>

          <Link to="/dashboard/product-variants" className="home-quick-card">
            <span className="home-quick-icon">◈</span>
            <h3>Product Variants</h3>
            <p>Update sizes, colors, prices and stock.</p>
            <b>Open page ↗</b>
          </Link>

          <Link to="/dashboard/orders" className="home-quick-card">
            <span className="home-quick-icon">◇</span>
            <h3>Orders</h3>
            <p>Review orders and update their status.</p>
            <b>Open page ↗</b>
          </Link>
        </div>
      </section>

      <footer className="fashion-footer">
        <span>ÉLORA · FASHION ADMIN</span>
        <span>Designed with care ✦</span>
      </footer>
    </main>
  );
}

export default DashboardHome;
