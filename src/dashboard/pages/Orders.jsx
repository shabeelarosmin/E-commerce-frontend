import { useEffect, useMemo, useState } from "react";
import { getAllOrders, updateOrderStatus } from "../../api/orderApi";

const nextStatus = {
  placed: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
};

const inputClass =
  "w-full rounded-xl border border-[#e6dacb] bg-[#fffefa] px-4 py-3 text-sm text-[#463326] outline-none transition placeholder:text-[#b3a496] focus:border-[#9b774f] focus:ring-4 focus:ring-[#9b774f]/10";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#51392b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6b4b37] focus:outline-none focus:ring-4 focus:ring-[#51392b]/15 disabled:cursor-not-allowed disabled:opacity-60";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      setError("");

      const response = await getAllOrders();
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

  // Confirm status update from the modal
  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;

    const currentStatus = String(
      selectedOrder.orderStatus || "placed",
    ).toLowerCase();

    const status = nextStatus[currentStatus];

    if (!status) return;

    try {
      setUpdatingId(selectedOrder._id);
      setMessage("");
      setError("");

      const response = await updateOrderStatus(selectedOrder._id, status);

      setMessage(
        response?.data?.message ||
          response?.message ||
          "Order status updated successfully.",
      );

      setSelectedOrder(null);
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
      const customerName =
        order.customerId?.name || order.customer?.name || "Customer";

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

    return value
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const statusClass = (status) => {
    const value = String(status || "placed").toLowerCase();

    if (value === "delivered")
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    if (["cancelled", "canceled"].includes(value))
      return "bg-rose-50 text-rose-700 ring-rose-200";

    if (value === "shipped") return "bg-sky-50 text-sky-700 ring-sky-200";

    if (["confirmed", "processing"].includes(value))
      return "bg-blue-50 text-blue-700 ring-blue-200";

    return "bg-amber-50 text-amber-800 ring-amber-200";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#f7f3ed] text-[#806b57]">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#e7d9c8] border-t-[#51392b]" />
        <p className="text-sm">Loading orders...</p>
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
              ÉLORA / SALES MANAGEMENT
            </p>

            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#39291f] sm:text-4xl">
              Orders Management
            </h1>

            <p className="mt-2 text-sm text-[#8d8177]">
              Manage customer orders, payments and fulfilment.
            </p>
          </div>

          <button
            type="button"
            className={buttonClass}
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
          >
            <span className="text-lg">↻</span>
            {refreshing ? "Refreshing..." : "Refresh Orders"}
          </button>
        </header>

        {/* NOTIFICATIONS */}
        {message && (
          <div
            className="flex items-start gap-3 rounded-xl border border-[#d9e7d1] bg-[#f1f7ed] px-4 py-3 text-sm text-[#50754b]"
            role="status"
          >
            <span className="font-bold">✓</span>
            {message}
          </div>
        )}

        {error && (
          <div
            className="flex items-start gap-3 rounded-xl border border-[#edcfca] bg-[#fff3f1] px-4 py-3 text-sm text-[#a23d32]"
            role="alert"
          >
            <span className="font-bold">!</span>
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            symbol="◇"
            title="Total Orders"
            value={orders.length}
            note="All recorded orders"
          />

          <StatCard
            symbol="◷"
            title="Pending Orders"
            value={pendingCount}
            note="Awaiting processing"
          />

          <StatCard
            symbol="₹"
            title="Total Order Value"
            value={money(totalValue)}
            note="Excluding cancelled orders"
            dark
          />
        </section>

        {/* ORDER DIRECTORY */}
        <section className="overflow-hidden rounded-2xl border border-[#e9dfd3] bg-[#fffdf9] shadow-[0_8px_30px_rgba(70,48,30,0.035)]">
          <div className="flex flex-col justify-between gap-5 border-b border-[#eee5da] px-5 py-6 sm:px-8 lg:flex-row lg:items-center">
            <div>
              <p className="mb-2 text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
                ORDER DIRECTORY
              </p>

              <h2 className="font-serif text-2xl text-[#39291f]">All Orders</h2>

              <p className="mt-2 text-sm text-[#958579]">
                {deliveredCount} delivered · {orders.length} total orders
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-[530px]">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#a18e7b]">
                  ⌕
                </span>

                <input
                  type="search"
                  placeholder="Search order ID or customer..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search orders"
                  className={`${inputClass} pl-10`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter orders by status"
                className={`${inputClass} sm:w-44`}
              >
                <option value="all">All statuses</option>

                {[
                  "placed",
                  "pending",
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
          </div>

          {/* EMPTY STATE */}
          {filteredOrders.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#eadcc9] bg-[#f7efe4] font-serif text-3xl text-[#9a774f]">
                ◇
              </span>

              <h3 className="mt-5 font-serif text-xl text-[#51392b]">
                {orders.length === 0 ? "No orders yet" : "No orders found"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-[#958579]">
                {orders.length === 0
                  ? "Customer orders will appear here when they are placed."
                  : "Try a different search term or status filter."}
              </p>

              {(search || statusFilter !== "all") && (
                <button
                  type="button"
                  className="mt-5 rounded-xl border border-[#e5d7c5] px-4 py-2 text-xs font-semibold text-[#654a35] hover:bg-[#f5ede3]"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5 p-4 sm:p-6">
              {filteredOrders.map((order) => {
                const currentStatus = String(
                  order.orderStatus || "placed",
                ).toLowerCase();

                const customer = order.customerId || order.customer || {};

                const shippingAddress = order.shippingAddress;
                const items = Array.isArray(order.items) ? order.items : [];

                const next = nextStatus[currentStatus];

                return (
                  <article
                    className="overflow-hidden rounded-2xl border border-[#e9dfd3] bg-white transition hover:border-[#d8c2a7] hover:shadow-[0_8px_25px_rgba(70,48,30,0.05)]"
                    key={order._id}
                  >
                    {/* ORDER HEADER */}
                    <div className="flex flex-col justify-between gap-4 border-b border-[#eee5da] bg-[#fcf8f2] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                      <div>
                        <p className="text-[10px] font-extrabold tracking-[1.8px] text-[#a17b50]">
                          ORDER REFERENCE
                        </p>

                        <h3 className="mt-2 font-serif text-xl text-[#39291f]">
                          #
                          {String(order._id || "")
                            .slice(-8)
                            .toUpperCase()}
                        </h3>

                        <p className="mt-1 text-sm text-[#8d8177]">
                          {customer.name || "Customer"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusClass(currentStatus)}`}
                      >
                        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
                        {formatStatus(currentStatus)}
                      </span>
                    </div>

                    {/* ORDER INFORMATION */}
                    <div className="grid grid-cols-1 gap-4 border-b border-[#eee5da] px-5 py-5 sm:grid-cols-3 sm:px-6">
                      <InfoBlock
                        label="Order Amount"
                        value={money(order.totalAmount)}
                        highlight
                      />

                      <InfoBlock
                        label="Payment Method"
                        value={order.paymentMethod || "Not specified"}
                      />

                      <InfoBlock
                        label="Payment Status"
                        value={formatStatus(order.paymentStatus || "pending")}
                      />
                    </div>

                    {/* ORDER ITEMS */}
                    <div className="px-5 py-5 sm:px-6">
                      <h4 className="font-serif text-lg text-[#51392b]">
                        Order Items
                      </h4>

                      {items.length === 0 ? (
                        <p className="mt-3 text-sm text-[#958579]">
                          No item details available.
                        </p>
                      ) : (
                        <div className="mt-4 divide-y divide-[#f0e8de]">
                          {items.map((item, index) => {
                            const productName =
                              item.productId?.name ||
                              item.variantId?.productId?.name ||
                              item.name ||
                              "Product";

                            const size =
                              item.size || item.variantId?.size || "-";

                            const color =
                              item.color || item.variantId?.color || "-";

                            const price = Number(item.price || 0);
                            const quantity = Number(item.quantity || 0);
                            const subtotal = item.subtotal ?? price * quantity;

                            return (
                              <div
                                className="flex items-center gap-3 py-4"
                                key={item._id || index}
                              >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#eadcc9] bg-[#f7efe4] text-lg text-[#9a774f]">
                                  ✦
                                </span>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-[#51392b]">
                                    {productName}
                                  </p>

                                  <p className="mt-1 text-xs text-[#958579]">
                                    Size: {size} · Color: {color}
                                  </p>

                                  <p className="mt-1 text-xs text-[#8d8177]">
                                    {money(price)} × {quantity}
                                  </p>
                                </div>

                                <strong className="shrink-0 text-sm text-[#51392b]">
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
                      <div className="mx-5 mb-5 rounded-xl border border-[#eee2d2] bg-[#faf6f0] p-4 sm:mx-6">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-[#654a35]">
                          <span className="text-lg text-[#a17b50]">⌖</span>
                          Shipping Address
                        </h4>

                        <div className="mt-3 space-y-1 text-sm leading-6 text-[#8d8177]">
                          {shippingAddress.name && (
                            <p className="font-semibold text-[#51392b]">
                              {shippingAddress.name}
                            </p>
                          )}

                          {shippingAddress.address && (
                            <p>{shippingAddress.address}</p>
                          )}

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
                      </div>
                    )}

                    {/* ACTIONS */}
                    <div className="flex flex-col justify-between gap-4 border-t border-[#eee5da] bg-[#fcf8f2] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                      <div>
                        <p className="text-[10px] font-extrabold tracking-[1.5px] text-[#a17b50]">
                          ORDER STATUS
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#51392b]">
                          {formatStatus(currentStatus)}
                        </p>
                      </div>

                      {next ? (
                        <button
                          type="button"
                          className={buttonClass}
                          onClick={() => setSelectedOrder(order)}
                          disabled={updatingId === order._id}
                        >
                          Mark as {formatStatus(next)} →
                        </button>
                      ) : (
                        <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#edf5e9] px-4 py-3 text-xs font-semibold text-[#50754b]">
                          ✓{" "}
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

          <div className="border-t border-[#eee5da] px-5 py-4 text-xs text-[#958579] sm:px-8">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col items-center justify-between gap-2 border-t border-[#e6dbce] pt-5 text-[10px] font-semibold tracking-[1.5px] text-[#9a8877] sm:flex-row">
          <span>ÉLORA · ORDER MANAGEMENT</span>
          <span>DESIGNED WITH CARE ✦</span>
        </footer>
      </div>

      {/* CENTERED UPDATE STATUS MODAL */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget && !updatingId) {
              setSelectedOrder(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-modal-title"
            className="my-auto w-full max-w-md animate-[modalIn_0.2s_ease-out] rounded-2xl border border-[#e9dfd3] bg-[#fffdf9] p-6 shadow-2xl sm:p-8"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
                  ÉLORA / ORDER MANAGEMENT
                </p>

                <h2
                  id="status-modal-title"
                  className="mt-2 font-serif text-2xl text-[#39291f]"
                >
                  Update Order Status
                </h2>

                <p className="mt-2 text-sm text-[#958579]">
                  Confirm the next stage of this order.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                disabled={Boolean(updatingId)}
                aria-label="Close modal"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e9dfd3] text-xl text-[#806b57] transition hover:bg-[#f5ede3] disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* Order Reference */}
            <div className="mt-6 rounded-xl border border-[#eee5da] bg-[#fcf8f2] p-4">
              <p className="text-xs text-[#958579]">Order Reference</p>

              <p className="mt-1 font-serif text-lg font-semibold text-[#51392b]">
                #
                {String(selectedOrder._id || "")
                  .slice(-8)
                  .toUpperCase()}
              </p>

              <p className="mt-1 text-sm text-[#806b57]">
                {selectedOrder.customerId?.name ||
                  selectedOrder.customer?.name ||
                  "Customer"}
              </p>
            </div>

            {/* Status Transition */}
            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="min-w-0">
                <p className="mb-2 text-xs text-[#958579]">Current Status</p>

                <span
                  className={`inline-flex max-w-full rounded-full px-3 py-2 text-xs font-semibold ring-1 ring-inset ${statusClass(
                    selectedOrder.orderStatus,
                  )}`}
                >
                  {formatStatus(selectedOrder.orderStatus)}
                </span>
              </div>

              <span className="mt-6 text-xl text-[#a17b50]">→</span>

              <div className="min-w-0">
                <p className="mb-2 text-xs text-[#958579]">Next Status</p>

                <span className="inline-flex max-w-full rounded-full bg-[#edf5e9] px-3 py-2 text-xs font-semibold text-[#50754b] ring-1 ring-inset ring-emerald-200">
                  {formatStatus(
                    nextStatus[
                      String(
                        selectedOrder.orderStatus || "placed",
                      ).toLowerCase()
                    ],
                  )}
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-[#806b57]">
              Are you sure you want to update this order&apos;s status?
            </p>

            {/* Modal Buttons */}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                disabled={Boolean(updatingId)}
                className="rounded-xl border border-[#e6dacb] px-5 py-3 text-sm font-semibold text-[#654a35] transition hover:bg-[#f7efe4] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={Boolean(updatingId)}
                className={buttonClass}
              >
                {updatingId === selectedOrder._id
                  ? "Updating..."
                  : `Confirm ${formatStatus(
                      nextStatus[
                        String(
                          selectedOrder.orderStatus || "placed",
                        ).toLowerCase()
                      ],
                    )}`}
              </button>
            </div>
          </div>
        </div>
      )}
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
      <div className="flex items-start justify-between gap-3">
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
            ? "mt-5 break-words font-serif text-3xl text-white"
            : "mt-5 break-words font-serif text-3xl text-[#39291f]"
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

function InfoBlock({ label, value, highlight = false }) {
  return (
    <div>
      <p className="text-xs text-[#958579]">{label}</p>

      <p
        className={`mt-2 break-words text-sm font-semibold ${
          highlight ? "font-serif text-xl text-[#51392b]" : "text-[#654a35]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default Orders;
