import { useEffect, useMemo, useState } from "react";
import { getAllOrders, updateOrderStatus } from "../../api/orderApi";

const nextStatus = {
  placed: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);

      setError("");

      const response = await getAllOrders();

      // API returns { data: [...] } or a direct array.
      const data = response?.data?.data ?? response?.data ?? response;

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (order) => {
    const currentStatus = String(order.orderStatus || "placed").toLowerCase();
    const status = nextStatus[currentStatus];

    if (!status) return;

    const confirmed = window.confirm(
      `Change order status from "${currentStatus}" to "${status}"?`,
    );

    if (!confirmed) return;

    try {
      setUpdatingId(order._id);
      setMessage("");
      setError("");

      const response = await updateOrderStatus(order._id, status);

      setMessage(
        response?.message ||
          response?.data?.message ||
          "Order status updated successfully.",
      );

      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setUpdatingId("");
    }
  };

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const customerName = order.customerId?.name || "Customer";
      const orderId = String(order._id || "").toLowerCase();
      const currentStatus = String(order.orderStatus || "placed").toLowerCase();

      const matchesSearch =
        !query ||
        orderId.includes(query) ||
        customerName.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || currentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalValue = orders.reduce((total, order) => {
    const cancelled = ["cancelled", "canceled"].includes(
      String(order.orderStatus || "").toLowerCase(),
    );

    return cancelled ? total : total + Number(order.totalAmount || 0);
  }, 0);

  const pendingCount = orders.filter((order) =>
    ["placed", "pending"].includes(
      String(order.orderStatus || "").toLowerCase(),
    ),
  ).length;

  const deliveredCount = orders.filter(
    (order) => String(order.orderStatus || "").toLowerCase() === "delivered",
  ).length;

  const money = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatStatus = (status) => {
    const value = String(status || "placed");
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const statusClass = (status) => {
    const value = String(status || "placed").toLowerCase();

    if (value === "delivered") return "order-status delivered";
    if (["cancelled", "canceled"].includes(value)) {
      return "order-status cancelled";
    }
    if (value === "shipped") return "order-status shipped";
    if (["confirmed", "processing"].includes(value)) {
      return "order-status confirmed";
    }

    return "order-status placed";
  };

  if (loading) {
    return (
      <div className="fashion-loading">
        <span className="fashion-spinner" />
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* HEADER */}
      <header className="products-header">
        <div>
          <p className="fashion-eyebrow">ÉLORA / SALES MANAGEMENT</p>
          <h1>Orders Management</h1>
          <p className="fashion-subtitle">
            Manage customer orders, payments and fulfilment.
          </p>
        </div>

        <button
          type="button"
          className="fashion-button"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh Orders"}
        </button>
      </header>

      {/* NOTIFICATIONS */}
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
          <span className="fashion-stat-icon">◇</span>
          <p>Total Orders</p>
          <h2>{orders.length}</h2>
          <span className="fashion-stat-note">All recorded orders</span>
        </article>

        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">◷</span>
          <p>Pending Orders</p>
          <h2>{pendingCount}</h2>
          <span className="fashion-stat-note">Awaiting processing</span>
        </article>

        <article className="fashion-stat-card dark-stat">
          <span className="fashion-stat-icon">₹</span>
          <p>Total Order Value</p>
          <h2>{money(totalValue)}</h2>
          <span className="fashion-stat-note">Excluding cancelled orders</span>
        </article>
      </section>

      {/* ORDER DIRECTORY */}
      <section className="fashion-card orders-directory">
        <div className="fashion-section-heading">
          <div>
            <p className="fashion-eyebrow">ORDER DIRECTORY</p>
            <h2>All Orders</h2>
            <p>
              {deliveredCount} orders delivered · {orders.length} orders total
            </p>
          </div>
        </div>

        {/* SEARCH & FILTER */}
        <div className="orders-filters">
          <input
            type="search"
            placeholder="Search order ID or customer..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search orders"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter orders by status"
          >
            <option value="all">All statuses</option>
            {[
              "placed",
              "confirmed",
              "processing",
              "shipped",
              "delivered",
              "cancelled",
            ].map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        {/* ORDERS LIST */}
        {filteredOrders.length === 0 ? (
          <div className="fashion-empty">
            <span>◇</span>
            <h3>{orders.length === 0 ? "No orders yet" : "No orders found"}</h3>
            <p>
              {orders.length === 0
                ? "Customer orders will appear here when they are placed."
                : "Try a different search term or status filter."}
            </p>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => {
              const currentStatus = String(
                order.orderStatus || "placed",
              ).toLowerCase();

              const customer = order.customerId || {};
              const shippingAddress = order.shippingAddress;
              const items = Array.isArray(order.items) ? order.items : [];
              const next = nextStatus[currentStatus];

              return (
                <article className="order-card" key={order._id}>
                  {/* ORDER HEADER */}
                  <div className="order-card-header">
                    <div>
                      <p className="fashion-eyebrow">ORDER REFERENCE</p>
                      <h3>#{String(order._id).slice(-8).toUpperCase()}</h3>
                      <p className="order-customer-name">
                        {customer.name || "Customer"}
                      </p>
                    </div>

                    <span className={statusClass(currentStatus)}>
                      {formatStatus(currentStatus)}
                    </span>
                  </div>

                  {/* ORDER INFORMATION */}
                  <div className="order-info-grid">
                    <div>
                      <span className="order-info-label">Order Amount</span>
                      <strong className="order-total-price">
                        {money(order.totalAmount)}
                      </strong>
                    </div>

                    <div>
                      <span className="order-info-label">Payment Method</span>
                      <strong>{order.paymentMethod || "Not specified"}</strong>
                    </div>

                    <div>
                      <span className="order-info-label">Payment Status</span>
                      <span className="order-payment">
                        {formatStatus(order.paymentStatus || "pending")}
                      </span>
                    </div>
                  </div>

                  {/* ITEMS */}
                  <div className="order-items-section">
                    <h4>Order Items</h4>

                    {items.length === 0 ? (
                      <p className="order-muted">No item details available.</p>
                    ) : (
                      <div className="order-items-list">
                        {items.map((item, index) => {
                          const productName =
                            item.productId?.name ||
                            item.variantId?.productId?.name ||
                            item.name ||
                            "Product";

                          const size = item.size || item.variantId?.size || "-";

                          const color =
                            item.color || item.variantId?.color || "-";

                          const price = Number(item.price || 0);
                          const quantity = Number(item.quantity || 0);
                          const subtotal = item.subtotal ?? price * quantity;

                          return (
                            <div
                              className="order-item-row"
                              key={item._id || index}
                            >
                              <div className="order-item-symbol">✦</div>

                              <div className="order-item-details">
                                <strong>{productName}</strong>
                                <span>
                                  Size: {size} · Color: {color}
                                </span>
                                <span>
                                  {money(price)} × {quantity}
                                </span>
                              </div>

                              <strong className="order-item-subtotal">
                                {money(subtotal)}
                              </strong>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SHIPPING ADDRESS */}
                  {shippingAddress && (
                    <div className="order-shipping-section">
                      <h4>
                        <span>⌖</span> Shipping Address
                      </h4>

                      <p>
                        <strong>{shippingAddress.name}</strong>
                      </p>
                      <p>{shippingAddress.address}</p>
                      <p>
                        {[shippingAddress.city, shippingAddress.state]
                          .filter(Boolean)
                          .join(", ")}
                        {shippingAddress.pincode
                          ? ` - ${shippingAddress.pincode}`
                          : ""}
                      </p>

                      {shippingAddress.phone && (
                        <p>Phone: {shippingAddress.phone}</p>
                      )}
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="order-card-footer">
                    <div>
                      <span className="order-info-label">Order Status</span>
                      <strong>{formatStatus(currentStatus)}</strong>
                    </div>

                    {next ? (
                      <button
                        type="button"
                        className="fashion-button"
                        onClick={() => handleStatusUpdate(order)}
                        disabled={updatingId === order._id}
                      >
                        {updatingId === order._id
                          ? "Updating..."
                          : `Mark as ${formatStatus(next)} →`}
                      </button>
                    ) : (
                      <span className="order-complete-label">
                        {["delivered", "cancelled", "canceled"].includes(
                          currentStatus,
                        )
                          ? "Order completed"
                          : "No next status configured"}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="orders-result-count">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
      </section>

      <footer className="fashion-footer">
        <span>ÉLORA · ORDER MANAGEMENT</span>
        <span>Designed with care ✦</span>
      </footer>
    </div>
  );
}

export default Orders;
