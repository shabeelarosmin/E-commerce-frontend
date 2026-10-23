import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  MapPin,
  CreditCard,
  CalendarDays,
  ShoppingBag,
  X,
  XCircle,
  RefreshCw,
  CheckCircle2,
  Clock3,
  Truck,
  Eye,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { getCustomerOrders, cancelOrder } from "../../api/orderApi";

const API_BASE_URL = "http://localhost:8000";

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString("en-IN")}`;

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeStatus = (status = "") =>
  status.toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");

const getStatusStyle = (status = "") => {
  const value = normalizeStatus(status);

  if (value === "delivered") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (["cancelled", "canceled"].includes(value)) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (["shipped", "out_for_delivery"].includes(value)) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (["confirmed", "placed", "pending", "processing"].includes(value)) {
    return "border-[#D9C3A8] bg-[#F3E8D3] text-[#795C45]";
  }

  return "border-[#E0D9CF] bg-[#E0D9CF]/40 text-[#544339]";
};

const trackingSteps = [
  { key: "placed", label: "Order placed", icon: CheckCircle2 },
  { key: "confirmed", label: "Confirmed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const getTrackingStep = (status = "") => {
  const statusSteps = {
    placed: 0,
    pending: 0,
    confirmed: 1,
    processing: 1,
    packed: 1,
    shipped: 2,
    out_for_delivery: 3,
    delivered: 4,
  };

  return statusSteps[normalizeStatus(status)] ?? -1;
};

const getProduct = (item) => {
  if (item?.productId && typeof item.productId === "object") {
    return item.productId;
  }

  if (item?.product && typeof item.product === "object") {
    return item.product;
  }

  return {};
};

const getVariant = (item) => {
  if (item?.variantId && typeof item.variantId === "object") {
    return item.variantId;
  }

  if (item?.variant && typeof item.variant === "object") {
    return item.variant;
  }

  return {};
};

const getProductName = (item) => {
  const product = getProduct(item);
  return product.name || item?.name || item?.productName || "Product";
};

const getProductImage = (item) => {
  const product = getProduct(item);
  const variant = getVariant(item);

  const image =
    product?.images?.[0]?.url ||
    product?.images?.[0]?.image ||
    product?.images?.[0] ||
    product?.image ||
    item?.image ||
    variant?.images?.[0] ||
    variant?.image ||
    "";

  if (!image || typeof image !== "string") return "/placeholder.png";

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
};

function OrderTracking({ status }) {
  const normalizedStatus = normalizeStatus(status);
  const cancelled = ["cancelled", "canceled"].includes(normalizedStatus);
  const currentStep = getTrackingStep(status);

  if (cancelled) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3 text-red-700">
          <XCircle size={23} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Order cancelled</p>
            <p className="mt-1 text-sm leading-6">
              This order is no longer being processed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="border border-[#E0D9CF] bg-white/70 p-4 sm:p-6">
      <div className="mb-6">
        <p className="text-[10px] tracking-[0.2em] text-[#8A6C5F]">
          ORDER JOURNEY
        </p>
        <h3 className="mt-2 font-serif text-2xl">Track your order</h3>
        <p className="mt-2 text-sm text-[#8A6C5F]">
          Current status:{" "}
          <span className="font-semibold capitalize text-[#544339]">
            {status?.replaceAll("_", " ") || "Processing"}
          </span>
        </p>
      </div>

      {currentStep === -1 ? (
        <p className="text-sm leading-6 text-[#8A6C5F]">
          Tracking progress is not available for this status yet.
        </p>
      ) : (
        <div className="space-y-4">
          {trackingSteps.map((step, index) => {
            const StepIcon = step.icon;
            const completed = index <= currentStep;
            const current = index === currentStep;

            return (
              <div key={step.key} className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                    completed
                      ? "border-[#544339] bg-[#544339] text-white"
                      : "border-[#D9C3A8] bg-[#F8F4EE] text-[#A99A8C]"
                  }`}
                >
                  <StepIcon size={17} />
                </div>

                <div className="flex-1 border-b border-[#E0D9CF] pb-4">
                  <p
                    className={`text-sm ${
                      completed
                        ? "font-semibold text-[#544339]"
                        : "text-[#A99A8C]"
                    }`}
                  >
                    {step.label}
                  </p>

                  {current && (
                    <p className="mt-1 text-xs text-[#8A6C5F]">
                      Your order is at this stage.
                    </p>
                  )}
                </div>

                {completed && (
                  <CheckCircle2
                    size={17}
                    className="mt-1 shrink-0 text-[#718565]"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  const status = order.orderStatus || "processing";
  const shipping = order.shippingAddress || {};

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#241A15]/55 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-[#DCCBBB] bg-[#FCFAF6] shadow-[0_25px_100px_rgba(0,0,0,0.3)]"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#E0D9CF] bg-[#FCFAF6]/95 px-5 py-5 backdrop-blur sm:px-7">
          <div className="min-w-0">
            <p className="text-[9px] tracking-[0.25em] text-[#8A6C5F]">
              ÉLORA / ORDER DETAILS
            </p>
            <h2
              id="order-details-title"
              className="mt-2 font-serif text-2xl sm:text-3xl"
            >
              Your order
            </h2>
            <p className="mt-2 break-all text-xs text-[#8A6C5F]">
              Reference: #{order._id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#DCCBBB] transition hover:bg-[#F0E7DD]"
          >
            <X size={19} />
          </button>
        </header>

        <div className="space-y-7 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-[#E0D9CF] bg-[#F8F4EE] p-4">
            <div>
              <p className="text-[10px] tracking-[0.15em] text-[#8A6C5F]">
                ORDER DATE
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <CalendarDays size={15} />
                {formatDate(order.createdAt)}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-2 border px-3 py-2 text-[10px] font-semibold uppercase tracking-wide ${getStatusStyle(status)}`}
            >
              <Clock3 size={14} />
              {status.replaceAll("_", " ")}
            </span>
          </div>

          <OrderTracking status={status} />

          <section>
            <h3 className="mb-4 font-serif text-xl">Items in your order</h3>

            <div className="divide-y divide-[#E0D9CF] border-y border-[#E0D9CF]">
              {(order.items || []).map((item, index) => {
                const product = getProduct(item);
                const variant = getVariant(item);
                const quantity = Number(item.quantity || 0);
                const price = Number(
                  item.price ?? item.sellingPrice ?? variant.sellingPrice ?? 0,
                );
                const subtotal = Number(item.subtotal ?? price * quantity);

                return (
                  <div
                    key={item._id || index}
                    className="flex items-start gap-4 py-4"
                  >
                    <div className="h-24 w-20 shrink-0 overflow-hidden border border-[#E0D9CF] bg-[#F8F4EE]">
                      <img
                        src={getProductImage(item)}
                        alt={getProductName(item)}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/placeholder.png";
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {getProductName(item)}
                      </p>
                      <p className="mt-2 text-xs text-[#8A6C5F]">
                        Size: {item.size || variant.size || "-"}
                        {" · "}
                        Color: {item.color || variant.color || "-"}
                      </p>
                      <p className="mt-1 text-xs text-[#8A6C5F]">
                        Quantity: {quantity}
                      </p>
                      <p className="mt-2 text-sm font-semibold">
                        {formatPrice(subtotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="border border-[#E0D9CF] p-4">
              <div className="mb-3 flex items-center gap-2">
                <CreditCard size={17} className="text-[#8A6C5F]" />
                <h3 className="text-[10px] font-semibold tracking-[0.13em]">
                  PAYMENT DETAILS
                </h3>
              </div>

              <p className="text-sm">
                {order.paymentMethod || "Not specified"}
              </p>
              <p className="mt-2 text-xs text-[#8A6C5F]">
                Payment status:{" "}
                <span className="capitalize text-[#544339]">
                  {order.paymentStatus || "Pending"}
                </span>
              </p>
            </section>

            <section className="border border-[#E0D9CF] p-4">
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={17} className="text-[#8A6C5F]" />
                <h3 className="text-[10px] font-semibold tracking-[0.13em]">
                  DELIVERY ADDRESS
                </h3>
              </div>

              <div className="text-sm leading-6">
                {shipping.name && <p>{shipping.name}</p>}
                {shipping.phone && <p>{shipping.phone}</p>}
                {shipping.address && <p>{shipping.address}</p>}
                {(shipping.city || shipping.state) && (
                  <p>
                    {[shipping.city, shipping.state].filter(Boolean).join(", ")}
                    {shipping.pincode ? ` - ${shipping.pincode}` : ""}
                  </p>
                )}

                {!shipping.name &&
                  !shipping.phone &&
                  !shipping.address &&
                  !shipping.city &&
                  !shipping.state && (
                    <p className="text-[#8A6C5F]">
                      No delivery address available.
                    </p>
                  )}
              </div>
            </section>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[#E0D9CF] pt-5">
            <div>
              <p className="text-[10px] tracking-[0.15em] text-[#8A6C5F]">
                ORDER TOTAL
              </p>
              <p className="mt-1 font-serif text-3xl">
                {formatPrice(order.totalAmount)}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="border border-[#BFA38A] px-5 py-3 text-[10px] font-semibold tracking-[0.13em] transition hover:bg-[#F0E7DD]"
            >
              CLOSE DETAILS
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CancelOrderModal({ order, onConfirm, onClose, loading }) {
  if (!order) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1D120E]/65 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        className="relative w-full max-w-md overflow-hidden border border-red-200 bg-[#FFFCFA] shadow-[0_25px_100px_rgba(0,0,0,0.4)]"
      >
        <div className="h-2 bg-red-600" />

        <div className="p-6 text-center sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600">
            <AlertTriangle size={29} strokeWidth={1.7} />
          </div>

          <p className="mt-5 text-[10px] font-semibold tracking-[0.25em] text-red-600">
            PLEASE CONFIRM
          </p>

          <h2
            id="cancel-order-title"
            className="mt-2 font-serif text-3xl text-[#544339]"
          >
            Cancel this order?
          </h2>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#78675C]">
            Are you sure you want to cancel this order? This action cannot be
            undone once the cancellation is completed.
          </p>

          <div className="mt-6 border border-red-100 bg-red-50/70 p-4 text-left">
            <p className="text-[10px] tracking-[0.15em] text-red-600">
              ORDER REFERENCE
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-[#544339]">
              #{order._id}
            </p>
            <p className="mt-2 text-sm text-[#544339]">
              Order total: {formatPrice(order.totalAmount)}
            </p>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="order-2 border border-[#BFA38A] px-4 py-3.5 text-[10px] font-semibold tracking-[0.12em] text-[#544339] transition hover:bg-[#F0E7DD] disabled:opacity-50 sm:order-1"
            >
              KEEP MY ORDER
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="order-1 inline-flex items-center justify-center gap-2 bg-red-600 px-4 py-3.5 text-[10px] font-semibold tracking-[0.12em] text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:order-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  CANCELLING...
                </>
              ) : (
                <>
                  <XCircle size={15} />
                  YES, CANCEL ORDER
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Orders() {
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(location.state?.message || "");
  const [isError, setIsError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancellingId, setCancellingId] = useState("");

  const fetchOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      setIsError(false);

      const response = await getCustomerOrders();
      const result = response?.data ?? response;

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.orders)
            ? result.orders
            : [];

      setOrders(data);
    } catch (error) {
      if (error.response?.status === 404) {
        setOrders([]);
      } else {
        setIsError(true);
        setMessage(
          error.response?.data?.message || "Failed to load your orders.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async () => {
    if (!cancelTarget?._id) return;

    try {
      setCancellingId(cancelTarget._id);
      setMessage("");
      setIsError(false);

      const response = await cancelOrder(cancelTarget._id);

      setMessage(
        response?.data?.message ||
          response?.message ||
          "Order cancelled successfully.",
      );

      setCancelTarget(null);
      setSelectedOrder(null);

      await fetchOrders();
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.message || "Failed to cancel this order.",
      );
    } finally {
      setCancellingId("");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F8F4EE] px-4">
        <div className="text-center">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[#E0D9CF] border-t-[#544339]" />
          <p className="font-serif text-xl text-[#544339]">
            Preparing your orders
          </p>
          <p className="mt-2 text-xs tracking-wider text-[#8A6C5F]">
            PLEASE WAIT A MOMENT
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EE] px-4 py-10 text-[#544339] sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center sm:mb-12">
          <p className="text-[10px] tracking-[0.35em] text-[#8A6C5F]">
            YOUR ÉLORA EXPERIENCE
          </p>
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl">My Orders</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#8A6C5F]">
            Every order, thoughtfully brought together in one place.
          </p>
          <div className="mx-auto mt-6 h-px w-16 bg-[#BFA38A]" />
        </header>

        {message && (
          <div
            role="status"
            className={`mb-6 flex items-start gap-3 border p-4 text-sm ${
              isError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[#D9C3A8] bg-[#F3E8D3] text-[#544339]"
            }`}
          >
            <span className="flex-1">{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
              className="text-current opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-[#8A6C5F]">
              ORDER HISTORY
            </p>
            <h2 className="mt-1 font-serif text-2xl">
              {orders.length} {orders.length === 1 ? "Order" : "Orders"}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 border border-[#BFA38A] px-4 py-2.5 text-[10px] tracking-[0.12em] transition hover:bg-[#E0D9CF]/40 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            REFRESH
          </button>
        </div>

        {orders.length === 0 ? (
          <section className="border border-[#E0D9CF] bg-[#FCFAF6] px-6 py-14 text-center sm:py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E0D9CF]/40 text-[#8A6C5F]">
              <ShoppingBag size={32} strokeWidth={1.2} />
            </div>
            <h2 className="mt-6 font-serif text-3xl">Nothing here just yet</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#8A6C5F]">
              Your next favourite find could be waiting for you. Explore our
              collection and discover your style.
            </p>
            <Link
              to="/products"
              className="mt-7 inline-flex items-center justify-center gap-3 bg-[#544339] px-7 py-4 text-[10px] tracking-[0.17em] text-[#F8F4EE] transition hover:bg-[#6B5145]"
            >
              EXPLORE COLLECTION <ArrowRight size={15} />
            </Link>
          </section>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = order.orderStatus || "processing";
              const normalized = normalizeStatus(status);
              const canCancel = ["placed", "confirmed"].includes(normalized);

              return (
                <article
                  key={order._id}
                  className="border border-[#E0D9CF] bg-[#FCFAF6] shadow-[0_8px_30px_rgba(84,67,57,0.04)] transition hover:border-[#CBB49E]"
                >
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#F0E7DD] text-[#8A6C5F]">
                        <Package size={22} strokeWidth={1.4} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] tracking-[0.2em] text-[#8A6C5F]">
                          ORDER REFERENCE
                        </p>
                        <p className="mt-1 break-all text-sm font-semibold">
                          #{order._id}
                        </p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-[#8A6C5F]">
                          <CalendarDays size={13} />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <span
                        className={`inline-flex w-fit items-center gap-2 border px-3 py-2 text-[10px] font-semibold uppercase tracking-wide ${getStatusStyle(status)}`}
                      >
                        {status.replaceAll("_", " ")}
                      </span>

                      <p className="font-serif text-2xl">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-[#E0D9CF] bg-[#F8F4EE]/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <p className="text-xs text-[#8A6C5F]">
                      {(order.items || []).length}{" "}
                      {(order.items || []).length === 1 ? "item" : "items"} ·{" "}
                      {order.paymentMethod || "Payment not specified"}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(order)}
                          className="inline-flex items-center justify-center gap-2 border border-red-200 bg-white px-4 py-3 text-[10px] font-semibold tracking-[0.1em] text-red-700 transition hover:border-red-400 hover:bg-red-50"
                        >
                          <XCircle size={15} />
                          CANCEL ORDER
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center justify-center gap-2 bg-[#544339] px-5 py-3 text-[10px] font-semibold tracking-[0.12em] text-white transition hover:bg-[#6B5145]"
                      >
                        <Eye size={15} />
                        VIEW DETAILS
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-xs text-[#8A6C5F] transition hover:text-[#544339]"
          >
            <ArrowLeft size={14} />
            Back to profile
          </Link>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-xs text-[#8A6C5F] transition hover:text-[#544339]"
          >
            Continue shopping
            <ArrowRight size={14} />
          </Link>
        </div>

        <p className="mt-9 text-center text-[9px] tracking-[0.25em] text-[#BFA38A]">
          ÉLORA · YOUR EVERYDAY ELEGANCE
        </p>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {cancelTarget && (
        <CancelOrderModal
          order={cancelTarget}
          loading={cancellingId === cancelTarget._id}
          onClose={() => {
            if (!cancellingId) setCancelTarget(null);
          }}
          onConfirm={handleCancelOrder}
        />
      )}
    </main>
  );
}

export default Orders;
