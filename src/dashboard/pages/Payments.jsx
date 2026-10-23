import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const PAYMENT_URL = "http://localhost:8000/api/dashboard/payment";
const ORDER_URL = "http://localhost:8000/api/dashboard/order";

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const money = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const getStatus = (item) =>
  String(
    item.paymentStatus ||
      item.status ||
      item.orderId?.paymentStatus ||
      item.order?.paymentStatus ||
      "pending",
  ).toLowerCase();

const getOrder = (item) => item.orderId || item.order || null;

const getOrderId = (item) => {
  const order = getOrder(item);

  if (order && typeof order === "object") {
    return String(order._id || order.orderId || "—");
  }

  return String(order || item.orderNumber || "—");
};

const getPaymentId = (item) =>
  String(item.paymentId || item.transactionId || item._id || getOrderId(item));

const getCustomer = (item) => {
  const order = getOrder(item);

  const customer =
    item.customerId ||
    item.customer ||
    order?.customerId ||
    order?.customer ||
    null;

  if (customer && typeof customer === "object") {
    return customer.name || customer.fullName || customer.email || "Customer";
  }

  return item.customerName || "Customer";
};

const getMethod = (item) => {
  const order = getOrder(item);

  return (
    item.paymentMethod ||
    item.method ||
    item.provider ||
    order?.paymentMethod ||
    "Not specified"
  );
};

const getAmount = (item) => {
  const order = getOrder(item);

  return Number(
    item.amount ??
      item.totalAmount ??
      item.transactionAmount ??
      order?.totalAmount ??
      0,
  );
};

const getDate = (item) => {
  const order = getOrder(item);
  const date = item.createdAt || item.paymentDate || order?.createdAt;

  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isSuccessful = (item) =>
  ["paid", "success", "successful", "completed"].includes(getStatus(item));

const isFailed = (item) =>
  ["failed", "failure", "cancelled", "canceled"].includes(getStatus(item));

const isPending = (item) =>
  ["pending", "processing", "initiated"].includes(getStatus(item));

const formatStatus = (status) =>
  String(status || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function StatusBadge({ item }) {
  let style = "border-stone-200 bg-stone-100 text-stone-600";

  if (isSuccessful(item)) {
    style = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (isFailed(item)) {
    style = "border-rose-200 bg-rose-50 text-rose-700";
  } else if (isPending(item)) {
    style = "border-amber-200 bg-amber-50 text-amber-700";
  }

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {formatStatus(getStatus(item))}
    </span>
  );
}

function StatCard({ label, value, note, icon, dark = false }) {
  return (
    <article
      className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
        dark
          ? "border-[#513a2b] bg-[#513a2b] text-white"
          : "border-[#e9ddce] bg-[#fffdfa] text-[#33271f]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs ${dark ? "text-[#e0c9a8]" : "text-stone-500"}`}
          >
            {label}
          </p>

          <h2 className="mt-5 font-serif text-3xl">{value}</h2>
        </div>

        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            dark ? "bg-white/10 text-[#e6d0a7]" : "bg-[#f5eee3] text-[#87683f]"
          }`}
        >
          {icon}
        </span>
      </div>

      <p
        className={`mt-3 text-xs ${dark ? "text-stone-300" : "text-stone-500"}`}
      >
        {note}
      </p>
    </article>
  );
}

function readArray(response) {
  const data = response?.data?.data ?? response?.data;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.payments)) return data.payments;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function normalizeOrderAsPayment(order) {
  return {
    ...order,
    orderId: order,
    paymentStatus: order.paymentStatus || "pending",
    paymentMethod: order.paymentMethod || "Not specified",
    amount: order.totalAmount || 0,
    _source: "order",
  };
}

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [error, setError] = useState("");

  const fetchPayments = async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      let paymentRecords = [];
      let paymentApiError = null;

      try {
        const response = await axios.get(PAYMENT_URL, authConfig());

        paymentRecords = readArray(response);
      } catch (err) {
        paymentApiError = err;
      }

      // Fetch orders as well, so COD orders are not omitted
      // when a separate payment record has not been created.
      let orders = [];

      try {
        const orderResponse = await axios.get(ORDER_URL, authConfig());

        orders = readArray(orderResponse);
      } catch (orderError) {
        // Payment records can still be displayed if orders
        // cannot be loaded.
        console.error(
          "Could not load orders for payment fallback:",
          orderError.response?.data || orderError.message,
        );
      }

      // Payment API records are preferred.
      // Add orders only when their order ID is not already present.
      const paymentOrderIds = new Set(
        paymentRecords.map(getOrderId).filter((id) => id && id !== "—"),
      );

      const missingOrderPayments = orders
        .filter((order) => {
          const id = String(order._id || order.orderId || "");

          return id && !paymentOrderIds.has(id);
        })
        .map(normalizeOrderAsPayment);

      const combined = [...paymentRecords, ...missingOrderPayments];

      // Remove duplicate records using payment ID or order ID.
      const uniqueRecords = [];
      const seen = new Set();

      for (const item of combined) {
        const orderId = getOrderId(item);
        const paymentId = getPaymentId(item);

        const key =
          orderId !== "—" ? `order:${orderId}` : `payment:${paymentId}`;

        if (seen.has(key)) continue;

        seen.add(key);
        uniqueRecords.push(item);
      }

      uniqueRecords.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.paymentDate || 0).getTime();

        const dateB = new Date(b.createdAt || b.paymentDate || 0).getTime();

        return dateB - dateA;
      });

      setPayments(uniqueRecords);

      if (paymentApiError && orders.length === 0) {
        throw paymentApiError;
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load payment records. Check the payment and order APIs.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const successfulCount = payments.filter(isSuccessful).length;
  const pendingCount = payments.filter(isPending).length;
  const failedCount = payments.filter(isFailed).length;

  const successfulValue = payments.reduce(
    (total, item) => (isSuccessful(item) ? total + getAmount(item) : total),
    0,
  );

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((item) => {
      const matchesSearch =
        !query ||
        getPaymentId(item).toLowerCase().includes(query) ||
        getOrderId(item).toLowerCase().includes(query) ||
        getCustomer(item).toLowerCase().includes(query) ||
        getMethod(item).toLowerCase().includes(query);

      const status = getStatus(item);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "successful" && isSuccessful(item)) ||
        (statusFilter === "pending" && isPending(item)) ||
        (statusFilter === "failed" && isFailed(item)) ||
        (statusFilter === "other" &&
          !isSuccessful(item) &&
          !isPending(item) &&
          !isFailed(item));

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  if (loading) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[#f7f3ed]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e8dfd2] border-t-[#8b6b45]" />
        <p className="text-sm text-stone-500">Loading payments...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-4 py-6 text-[#33271f] sm:px-6 lg:px-8 lg:py-9">
      <div className="mx-auto max-w-[1600px] space-y-7">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#9b7951]">
              ÉLORA / FINANCE
            </p>

            <h1 className="font-serif text-3xl sm:text-4xl">
              Payments Management
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              View payment records and payments associated with orders.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchPayments(true)}
            disabled={refreshing}
            className="rounded-xl bg-[#513a2b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#39291f] disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "↻ Refresh Payments"}
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={() => fetchPayments(true)}
              className="mt-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="₹"
            label="Successful Value"
            value={money(successfulValue)}
            note="Value marked successful or paid"
          />

          <StatCard
            icon="✦"
            label="Successful Payments"
            value={successfulCount}
            note="Successful transaction records"
          />

          <StatCard
            icon="◷"
            label="Pending Payments"
            value={pendingCount}
            note="Awaiting payment confirmation"
          />

          <StatCard
            icon="◇"
            label="Failed Payments"
            value={failedCount}
            note="Failed or cancelled records"
            dark
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e9ddce] bg-[#fffdfa] shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-[#eee5d9] px-5 py-6 sm:flex-row sm:items-center sm:px-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9b7951]">
                TRANSACTION DIRECTORY
              </p>

              <h2 className="mt-2 font-serif text-2xl">All Payments</h2>

              <p className="mt-2 text-sm text-stone-500">
                {filteredPayments.length} payments shown out of{" "}
                {payments.length}.
              </p>
            </div>

            <span className="w-fit rounded-lg bg-[#f5eee3] px-3 py-2 text-xs text-stone-600">
              ● {payments.length} total records
            </span>
          </div>

          <div className="flex flex-col gap-3 border-b border-[#eee5d9] p-4 sm:flex-row sm:p-5">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search payment ID, order, customer..."
              aria-label="Search payments"
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#e8dfd2] bg-white px-4 py-3 text-sm outline-none focus:border-[#a88a61]"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter payment status"
              className="min-h-12 rounded-xl border border-[#e8dfd2] bg-white px-4 py-3 text-sm outline-none focus:border-[#a88a61] sm:min-w-44"
            >
              <option value="all">All statuses</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="other">Other statuses</option>
            </select>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="font-serif text-4xl text-[#9b7951]">₹</div>

              <h3 className="mt-4 font-serif text-xl">
                {payments.length === 0
                  ? "No payment records found"
                  : "No matching payments"}
              </h3>

              <p className="mt-2 text-sm text-stone-500">
                Try changing the search or status filter.
              </p>

              {(search || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="mt-4 rounded-lg border border-[#dfd0ba] px-4 py-2 text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-[#f8f4ed]">
                  <tr>
                    {[
                      "Payment ID",
                      "Order ID",
                      "Customer",
                      "Method",
                      "Amount",
                      "Status",
                      "Details",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8c6c4e]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#eee5d9]">
                  {filteredPayments.map((item, index) => (
                    <tr
                      key={`${getOrderId(item)}-${index}`}
                      className="transition hover:bg-[#faf6f0]"
                    >
                      <td className="px-5 py-4">
                        <span
                          title={getPaymentId(item)}
                          className="inline-block max-w-32 truncate rounded-md bg-[#f5eee3] px-2.5 py-1.5 font-mono text-xs"
                        >
                          {getPaymentId(item).slice(-12)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          title={getOrderId(item)}
                          className="inline-block max-w-36 truncate font-mono text-xs text-stone-500"
                        >
                          {getOrderId(item)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8d7c0] bg-[#f4e9d9] text-xs font-semibold uppercase">
                            {getCustomer(item).charAt(0)}
                          </span>

                          <span className="font-medium">
                            {getCustomer(item)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-stone-600">
                        {getMethod(item)}
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {money(getAmount(item))}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge item={item} />
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(item)}
                          className="whitespace-nowrap rounded-lg border border-[#dfd0ba] px-3.5 py-2 text-xs font-semibold text-[#705638] transition hover:bg-[#513a2b] hover:text-white"
                        >
                          View Details ↗
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col justify-between gap-2 border-t border-[#eee5d9] px-5 py-4 text-xs text-stone-500 sm:flex-row sm:items-center sm:px-7">
            <p>
              Showing {filteredPayments.length} of {payments.length} payment
              records
            </p>

            <p>ÉLORA · SECURE TRANSACTIONS</p>
          </div>
        </section>

        {selectedPayment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#211810]/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedPayment(null)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-details-heading"
              onClick={(event) => event.stopPropagation()}
              className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#eee5d9] bg-[#fffdfa] shadow-2xl"
            >
              <header className="flex items-start justify-between gap-4 border-b border-[#eee5d9] bg-[#faf6f0] px-6 py-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9b7951]">
                    TRANSACTION INFORMATION
                  </p>

                  <h2
                    id="payment-details-heading"
                    className="mt-2 font-serif text-2xl"
                  >
                    Payment Details
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  aria-label="Close details"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e8dfd2] text-xl hover:bg-[#513a2b] hover:text-white"
                >
                  ×
                </button>
              </header>

              <div className="px-6 py-6">
                <div className="rounded-2xl bg-[#513a2b] p-6 text-white">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#e0c9a8]">
                    Transaction Amount
                  </p>

                  <p className="mt-3 font-serif text-4xl">
                    {money(getAmount(selectedPayment))}
                  </p>

                  <div className="mt-4">
                    <StatusBadge item={selectedPayment} />
                  </div>
                </div>

                <div className="mt-5 divide-y divide-[#eee5d9]">
                  {[
                    ["Payment ID", getPaymentId(selectedPayment)],
                    ["Order ID", getOrderId(selectedPayment)],
                    ["Customer", getCustomer(selectedPayment)],
                    ["Payment Method", getMethod(selectedPayment)],
                    [
                      "Payment Status",
                      formatStatus(getStatus(selectedPayment)),
                    ],
                    ["Order Date", getDate(selectedPayment)],
                    [
                      "Transaction Reference",
                      selectedPayment.transactionReference ||
                        selectedPayment.reference ||
                        selectedPayment.transactionId ||
                        "Not available",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-col gap-1.5 py-4 sm:flex-row sm:justify-between sm:gap-6"
                    >
                      <span className="text-sm text-stone-500">{label}</span>

                      <strong className="break-all text-sm font-medium sm:max-w-[65%] sm:text-right">
                        {String(value)}
                      </strong>
                    </div>
                  ))}
                </div>

                {selectedPayment.items?.length > 0 && (
                  <div className="mt-5 rounded-xl border border-[#e9ddce] p-4">
                    <h3 className="font-serif text-lg">Order Items</h3>

                    <div className="mt-3 space-y-3">
                      {selectedPayment.items.map((item, index) => (
                        <div
                          key={item._id || item.variantId || index}
                          className="flex justify-between gap-4 border-b border-[#eee5d9] pb-3 last:border-0 last:pb-0"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {item.name ||
                                item.productId?.name ||
                                item.product?.name ||
                                "Product"}
                            </p>

                            <p className="mt-1 text-xs text-stone-500">
                              Qty: {item.quantity || 1}
                              {item.size ? ` · Size: ${item.size}` : ""}
                              {item.color ? ` · Colour: ${item.color}` : ""}
                            </p>
                          </div>

                          <p className="whitespace-nowrap text-sm font-semibold">
                            {money(
                              item.subtotal ??
                                Number(item.price || 0) *
                                  Number(item.quantity || 1),
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="mt-6 w-full rounded-xl bg-[#513a2b] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#39291f]"
                >
                  Close Details
                </button>
              </div>
            </section>
          </div>
        )}

        <footer className="flex flex-col justify-between gap-2 border-t border-[#e9dfd2] pt-5 pb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-stone-400 sm:flex-row sm:items-center">
          <span>ÉLORA · PAYMENT MANAGEMENT</span>
          <span>Designed with care ✦</span>
        </footer>
      </div>
    </main>
  );
}

export default Payments;
