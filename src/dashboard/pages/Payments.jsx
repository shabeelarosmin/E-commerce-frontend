import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/dashboard/payment";

const money = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const getStatus = (payment) =>
  String(payment.paymentStatus || payment.status || "pending").toLowerCase();

const getAmount = (payment) =>
  Number(
    payment.amount ??
      payment.totalAmount ??
      payment.orderId?.totalAmount ??
      payment.order?.totalAmount ??
      0,
  );

const getPaymentMethod = (payment) =>
  payment.paymentMethod ||
  payment.method ||
  payment.provider ||
  "Not specified";

const getOrderId = (payment) => {
  const order = payment.orderId || payment.order;

  if (order && typeof order === "object") {
    return order._id || order.orderId || "—";
  }

  return order || payment.orderNumber || "—";
};

const getCustomerName = (payment) => {
  const customer =
    payment.customerId ||
    payment.customer ||
    payment.orderId?.customerId ||
    payment.order?.customerId;

  if (customer && typeof customer === "object") {
    return customer.name || customer.fullName || "Customer";
  }

  return payment.customerName || "Customer";
};

const formatStatus = (status) => {
  const value = String(status || "pending");
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const isSuccessful = (payment) =>
  ["paid", "success", "successful", "completed"].includes(getStatus(payment));

const isFailed = (payment) =>
  ["failed", "failure", "cancelled", "canceled"].includes(getStatus(payment));

const isPending = (payment) =>
  ["pending", "processing", "initiated"].includes(getStatus(payment));

const getStatusStyle = (payment) => {
  if (isSuccessful(payment)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (isFailed(payment)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (isPending(payment)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-600";
};

function StatCard({ icon, label, value, note, dark = false }) {
  return (
    <article
      className={`rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${
        dark
          ? "border-[#513a2b] bg-[#513a2b] text-white"
          : "border-[#e9ddce] bg-[#fffdfa] text-[#33271f]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-xs font-medium ${
              dark ? "text-[#e0c9a8]" : "text-stone-500"
            }`}
          >
            {label}
          </p>

          <h2 className="mt-5 font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            {value}
          </h2>
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
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

function SectionHeading({ eyebrow, title, description, children }) {
  return (
    <div className="flex flex-col justify-between gap-5 border-b border-[#eee5d9] bg-[#fffdfa] px-5 py-6 sm:px-7 lg:flex-row lg:items-center">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9b7951]">
          {eyebrow}
        </p>

        <h2 className="mt-2 font-serif text-2xl font-normal text-[#33271f]">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm text-stone-500">{description}</p>
        )}
      </div>

      {children}
    </div>
  );
}

function StatusBadge({ payment }) {
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusStyle(
        payment,
      )}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {formatStatus(getStatus(payment))}
    </span>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5eee3] font-serif text-3xl text-[#9b7951]">
        ₹
      </div>

      <h3 className="mt-5 font-serif text-xl text-[#33271f]">{title}</h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
        {description}
      </p>
    </div>
  );
}

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [error, setError] = useState("");

  const fetchPayments = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      }

      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const responseData = response.data?.data ?? response.data;

      const paymentList = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.payments)
          ? responseData.payments
          : [];

      setPayments(paymentList);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Payments could not be loaded. Please check your login and API route.",
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
    (total, payment) =>
      isSuccessful(payment) ? total + getAmount(payment) : total,
    0,
  );

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const paymentId = String(
        payment.paymentId || payment.transactionId || payment._id || "",
      ).toLowerCase();

      const orderId = String(getOrderId(payment)).toLowerCase();
      const customerName = getCustomerName(payment).toLowerCase();
      const method = getPaymentMethod(payment).toLowerCase();

      const matchesSearch =
        !query ||
        paymentId.includes(query) ||
        orderId.includes(query) ||
        customerName.includes(query) ||
        method.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "successful" && isSuccessful(payment)) ||
        (statusFilter === "pending" && isPending(payment)) ||
        (statusFilter === "failed" && isFailed(payment)) ||
        (statusFilter === "other" &&
          !isSuccessful(payment) &&
          !isPending(payment) &&
          !isFailed(payment));

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  if (loading) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[#f7f3ed]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e8dfd2] border-t-[#8b6b45]" />

        <p className="text-sm font-medium tracking-wide text-stone-500">
          Loading payments...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-4 py-6 text-[#33271f] sm:px-6 lg:px-8 lg:py-9">
      <div className="mx-auto max-w-[1600px] space-y-7">
        {/* PAGE HEADER */}
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#9b7951]">
              ÉLORA / FINANCE
            </p>

            <h1 className="font-serif text-3xl font-normal tracking-tight text-[#33271f] sm:text-4xl">
              Payments Management
            </h1>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Track transactions and review payment records for your store.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchPayments(true)}
            disabled={refreshing}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#513a2b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#39291f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className={refreshing ? "animate-spin" : ""}>↻</span>
            {refreshing ? "Refreshing..." : "Refresh Payments"}
          </button>
        </header>

        <div className="border-b border-[#e9dfd2]" />

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 sm:flex-row sm:items-center"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold">
              !
            </span>

            <p className="flex-1">{error}</p>

            <button
              type="button"
              onClick={() => fetchPayments(true)}
              className="self-start font-semibold underline underline-offset-4 sm:self-center"
            >
              Retry
            </button>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon="₹"
            label="Successful Value"
            value={money(successfulValue)}
            note="Value of successful payments"
          />

          <StatCard
            icon="✦"
            label="Successful Payments"
            value={successfulCount}
            note="Completed payment records"
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

        {/* TRANSACTION DIRECTORY */}
        <section className="overflow-hidden rounded-2xl border border-[#e9ddce] bg-[#fffdfa] shadow-sm">
          <SectionHeading
            eyebrow="TRANSACTION DIRECTORY"
            title="All Payments"
            description={`${filteredPayments.length} payments shown out of ${payments.length}.`}
          >
            <div className="flex w-fit items-center gap-2 self-start rounded-lg bg-[#f5eee3] px-3 py-2 text-xs font-medium text-stone-600 lg:self-center">
              <span className="h-2 w-2 rounded-full bg-[#a88a61]" />
              {payments.length} total records
            </div>
          </SectionHeading>

          {/* SEARCH AND FILTER */}
          <div className="flex flex-col gap-3 border-b border-[#eee5d9] p-4 sm:p-5 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
              </svg>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search payment ID, order, customer..."
                aria-label="Search payments"
                className="min-h-12 w-full rounded-xl border border-[#e8dfd2] bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#a88a61] focus:ring-2 focus:ring-[#a88a61]/15"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter payment status"
              className="min-h-12 rounded-xl border border-[#e8dfd2] bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-[#a88a61] focus:ring-2 focus:ring-[#a88a61]/15 lg:min-w-44"
            >
              <option value="all">All statuses</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="other">Other statuses</option>
            </select>
          </div>

          {/* EMPTY STATE */}
          {filteredPayments.length === 0 ? (
            <div>
              <EmptyState
                title={
                  payments.length === 0
                    ? "No payment records"
                    : "No payments found"
                }
                description={
                  payments.length === 0
                    ? "Payment records will appear when the API returns them."
                    : "Try another search term or change the status filter."
                }
              />

              {(search || statusFilter !== "all") && (
                <div className="-mt-7 pb-8 text-center">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg border border-[#dfd0ba] px-4 py-2 text-sm font-semibold text-[#705638] transition hover:bg-[#f5eee3]"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* PAYMENTS TABLE */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#f8f4ed]">
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
                  {filteredPayments.map((payment, index) => {
                    const paymentId =
                      payment.paymentId ||
                      payment.transactionId ||
                      payment._id ||
                      "—";

                    return (
                      <tr
                        key={
                          payment._id ||
                          payment.paymentId ||
                          payment.transactionId ||
                          index
                        }
                        className="transition hover:bg-[#faf6f0]"
                      >
                        <td className="px-5 py-4">
                          <span
                            title={String(paymentId)}
                            className="inline-block max-w-32 truncate rounded-md bg-[#f5eee3] px-2.5 py-1.5 font-mono text-xs text-[#765a3c]"
                          >
                            {String(paymentId).slice(-12)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            title={String(getOrderId(payment))}
                            className="inline-block max-w-32 truncate font-mono text-xs text-stone-500"
                          >
                            {String(getOrderId(payment))}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8d7c0] bg-[#f4e9d9] text-xs font-semibold uppercase text-[#705638]">
                              {getCustomerName(payment).charAt(0)}
                            </span>

                            <span className="font-medium text-[#33271f]">
                              {getCustomerName(payment)}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-sm text-stone-600">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#eee5d9] text-xs text-[#8b6b45]">
                              ◈
                            </span>
                            {getPaymentMethod(payment)}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-semibold text-[#33271f]">
                          {money(getAmount(payment))}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge payment={payment} />
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(payment)}
                            className="whitespace-nowrap rounded-lg border border-[#dfd0ba] px-3.5 py-2 text-xs font-semibold text-[#705638] transition hover:border-[#513a2b] hover:bg-[#513a2b] hover:text-white"
                          >
                            View Details ↗
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLE FOOTER */}
          <div className="flex flex-col justify-between gap-2 border-t border-[#eee5d9] px-5 py-4 text-xs text-stone-500 sm:flex-row sm:items-center sm:px-7">
            <p>
              Showing{" "}
              <span className="font-semibold text-[#33271f]">
                {filteredPayments.length}
              </span>{" "}
              of {payments.length} payment records
            </p>

            <p className="tracking-wide">ÉLORA · SECURE TRANSACTIONS</p>
          </div>
        </section>

        {/* PAYMENT DETAILS MODAL */}
        {selectedPayment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#211810]/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedPayment(null)}
            role="presentation"
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-modal-title"
              onClick={(event) => event.stopPropagation()}
              className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-[#eee5d9] bg-[#fffdfa] shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#eee5d9] bg-[#faf6f0] px-6 py-6 sm:px-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9b7951]">
                    TRANSACTION INFORMATION
                  </p>

                  <h2
                    id="payment-modal-title"
                    className="mt-2 font-serif text-2xl font-normal text-[#33271f]"
                  >
                    Payment Details
                  </h2>

                  <p className="mt-1 text-sm text-stone-500">
                    Review the selected transaction.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  aria-label="Close payment details"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8dfd2] text-xl text-stone-500 transition hover:bg-[#513a2b] hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="px-6 py-6 sm:px-8">
                <div className="rounded-2xl bg-[#513a2b] p-6 text-white">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#e0c9a8]">
                    Transaction Amount
                  </p>

                  <p className="mt-3 font-serif text-4xl font-normal tracking-tight">
                    {money(getAmount(selectedPayment))}
                  </p>

                  <div className="mt-4">
                    <StatusBadge payment={selectedPayment} />
                  </div>
                </div>

                <div className="mt-5 divide-y divide-[#eee5d9]">
                  {[
                    [
                      "Payment ID",
                      selectedPayment.paymentId ||
                        selectedPayment.transactionId ||
                        selectedPayment._id ||
                        "—",
                    ],
                    ["Order ID", String(getOrderId(selectedPayment))],
                    ["Customer", getCustomerName(selectedPayment)],
                    ["Payment Method", getPaymentMethod(selectedPayment)],
                    ["Status", formatStatus(getStatus(selectedPayment))],
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
                      className="flex flex-col gap-1.5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                    >
                      <span className="shrink-0 text-sm text-stone-500">
                        {label}
                      </span>

                      <strong className="break-all text-left text-sm font-medium text-[#33271f] sm:max-w-[65%] sm:text-right">
                        {String(value)}
                      </strong>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="mt-5 w-full rounded-xl bg-[#513a2b] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#39291f]"
                >
                  Close Details
                </button>
              </div>
            </section>
          </div>
        )}

        {/* FOOTER */}
        <footer className="flex flex-col justify-between gap-2 border-t border-[#e9dfd2] pt-5 pb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-stone-400 sm:flex-row sm:items-center">
          <span>ÉLORA · PAYMENT MANAGEMENT</span>
          <span>Designed with care ✦</span>
        </footer>
      </div>
    </main>
  );
}

export default Payments;
