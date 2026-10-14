import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/dashboard/payment";

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

      if (isRefresh) setRefreshing(true);

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
          "Payments load ചെയ്യാൻ കഴിഞ്ഞില്ല. Login, API route എന്നിവ പരിശോധിക്കുക.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

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

  const money = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

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

  const statusClass = (payment) => {
    if (isSuccessful(payment)) return "payment-status successful";
    if (isFailed(payment)) return "payment-status failed";
    if (isPending(payment)) return "payment-status pending";

    return "payment-status other";
  };

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
      const status = getStatus(payment);

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

  if (loading) {
    return (
      <div className="fashion-loading">
        <span className="fashion-spinner" />
        <p>Loading payments...</p>
      </div>
    );
  }

  return (
    <main className="payments-page">
      {/* PAGE HEADER */}
      <header className="products-header">
        <div>
          <p className="fashion-eyebrow">ÉLORA / FINANCE</p>
          <h1>Payments Management</h1>
          <p className="fashion-subtitle">
            Track transactions and review payment records for your store.
          </p>
        </div>

        <button
          type="button"
          className="fashion-button"
          onClick={() => fetchPayments(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh Payments"}
        </button>
      </header>

      {error && (
        <div className="fashion-alert error" role="alert">
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <section className="fashion-stats">
        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">₹</span>
          <p>Successful Value</p>
          <h2>{money(successfulValue)}</h2>
          <span className="fashion-stat-note">
            Value of successful payments
          </span>
        </article>

        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">✓</span>
          <p>Successful Payments</p>
          <h2>{successfulCount}</h2>
          <span className="fashion-stat-note">Completed payment records</span>
        </article>

        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">◷</span>
          <p>Pending Payments</p>
          <h2>{pendingCount}</h2>
          <span className="fashion-stat-note">
            Awaiting payment confirmation
          </span>
        </article>

        <article className="fashion-stat-card dark-stat">
          <span className="fashion-stat-icon">◇</span>
          <p>Failed Payments</p>
          <h2>{failedCount}</h2>
          <span className="fashion-stat-note">Failed or cancelled records</span>
        </article>
      </section>

      {/* PAYMENT DIRECTORY */}
      <section className="fashion-card">
        <div className="fashion-section-heading">
          <div>
            <p className="fashion-eyebrow">TRANSACTION DIRECTORY</p>
            <h2>All Payments</h2>
            <p>
              {filteredPayments.length} payments shown out of {payments.length}.
            </p>
          </div>
        </div>

        <div className="payments-filters">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search payment ID, order, customer..."
            aria-label="Search payments"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter payment status"
          >
            <option value="all">All statuses</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="other">Other statuses</option>
          </select>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="fashion-empty">
            <span>₹</span>
            <h3>
              {payments.length === 0
                ? "No payment records"
                : "No payments found"}
            </h3>
            <p>
              {payments.length === 0
                ? "Payment records will appear when the API returns them."
                : "Try a different search term or status filter."}
            </p>
          </div>
        ) : (
          <div className="fashion-table-wrap">
            <table className="fashion-table payments-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      <span className="fashion-slug">
                        {String(
                          payment.paymentId ||
                            payment.transactionId ||
                            payment._id ||
                            "—",
                        ).slice(-12)}
                      </span>
                    </td>

                    <td>
                      <span className="fashion-slug">
                        {String(getOrderId(payment))}
                      </span>
                    </td>

                    <td>
                      <strong className="payment-customer">
                        {getCustomerName(payment)}
                      </strong>
                    </td>

                    <td>{getPaymentMethod(payment)}</td>

                    <td className="fashion-price">
                      {money(getAmount(payment))}
                    </td>

                    <td>
                      <span className={statusClass(payment)}>
                        {formatStatus(getStatus(payment))}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="fashion-button secondary small-button"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="payments-result-count">
          Showing {filteredPayments.length} of {payments.length} payment records
        </p>
      </section>

      {/* PAYMENT DETAILS MODAL */}
      {selectedPayment && (
        <div
          className="payment-modal-backdrop"
          onClick={() => setSelectedPayment(null)}
          role="presentation"
        >
          <section
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="payment-modal-header">
              <div>
                <p className="fashion-eyebrow">TRANSACTION INFORMATION</p>
                <h2 id="payment-modal-title">Payment Details</h2>
              </div>

              <button
                type="button"
                className="payment-close-button"
                onClick={() => setSelectedPayment(null)}
                aria-label="Close payment details"
              >
                ×
              </button>
            </div>

            <div className="payment-detail-amount">
              {money(getAmount(selectedPayment))}
            </div>

            <div className="payment-detail-row">
              <span>Payment ID</span>
              <strong>
                {selectedPayment.paymentId ||
                  selectedPayment.transactionId ||
                  selectedPayment._id ||
                  "—"}
              </strong>
            </div>

            <div className="payment-detail-row">
              <span>Order ID</span>
              <strong>{String(getOrderId(selectedPayment))}</strong>
            </div>

            <div className="payment-detail-row">
              <span>Customer</span>
              <strong>{getCustomerName(selectedPayment)}</strong>
            </div>

            <div className="payment-detail-row">
              <span>Payment Method</span>
              <strong>{getPaymentMethod(selectedPayment)}</strong>
            </div>

            <div className="payment-detail-row">
              <span>Status</span>
              <strong>{formatStatus(getStatus(selectedPayment))}</strong>
            </div>

            <div className="payment-detail-row">
              <span>Transaction Reference</span>
              <strong>
                {selectedPayment.transactionReference ||
                  selectedPayment.reference ||
                  selectedPayment.transactionId ||
                  "Not available"}
              </strong>
            </div>

            <button
              type="button"
              className="fashion-button payment-modal-done"
              onClick={() => setSelectedPayment(null)}
            >
              Close Details
            </button>
          </section>
        </div>
      )}

      <footer className="fashion-footer">
        <span>ÉLORA · PAYMENT MANAGEMENT</span>
        <span>Designed with care ✦</span>
      </footer>
    </main>
  );
}

export default Payments;
