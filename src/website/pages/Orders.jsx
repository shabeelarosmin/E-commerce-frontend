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
  XCircle,
  RefreshCw,
  CheckCircle2,
  Clock3,
  Truck,
} from "lucide-react";
import { getCustomerOrders, cancelOrder } from "../../api/orderApi";

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString("en-IN")}`;

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyle = (status = "") => {
  const value = status.toLowerCase();

  if (value === "delivered") {
    return "bg-green-50 text-green-800 border-green-200";
  }

  if (value === "cancelled" || value === "canceled") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (value === "shipped" || value === "out_for_delivery") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (value === "confirmed" || value === "placed") {
    return "bg-[#F3E8D3] text-[#795C45] border-[#D9C3A8]";
  }

  return "bg-[#E0D9CF]/40 text-[#544339] border-[#E0D9CF]";
};

const trackingSteps = [
  { key: "placed", label: "Order Placed", icon: CheckCircle2 },
  { key: "confirmed", label: "Confirmed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const getTrackingStep = (status = "") => {
  const value = status.toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");

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

  return statusSteps[value] ?? -1;
};

function OrderTracking({ status }) {
  const normalizedStatus = (status || "")
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  const cancelled = ["cancelled", "canceled"].includes(normalizedStatus);
  const currentStep = getTrackingStep(normalizedStatus);

  if (cancelled) {
    return (
      <div className="my-6 border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-3 text-red-700">
          <XCircle size={22} />
          <div>
            <p className="font-medium">Order Cancelled</p>
            <p className="mt-1 text-xs">
              This order is no longer being processed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="my-6 border border-[#E0D9CF] bg-white/60 p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.18em] text-[#8A6C5F]">
            ORDER JOURNEY
          </p>
          <h3 className="mt-1 font-serif text-xl">Track your order</h3>
        </div>

        <span className="border border-[#D9C3A8] bg-[#F3E8D3] px-3 py-2 text-[10px] uppercase tracking-wide text-[#795C45]">
          {status?.replaceAll("_", " ") || "Processing"}
        </span>
      </div>

      {currentStep === -1 ? (
        <p className="text-sm text-[#8A6C5F]">
          Tracking progress is not available for this status yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-5">
          {trackingSteps.map((step, index) => {
            const StepIcon = step.icon;
            const completed = index <= currentStep;
            const current = index === currentStep;

            return (
              <div key={step.key} className="relative">
                <div className="flex items-center sm:flex-col sm:items-center sm:text-center">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      completed
                        ? "border-[#544339] bg-[#544339] text-white"
                        : "border-[#D9C3A8] bg-[#F8F4EE] text-[#A99A8C]"
                    }`}
                  >
                    <StepIcon size={18} />
                  </div>

                  <div className="ml-3 sm:ml-0 sm:mt-3">
                    <p
                      className={`text-xs ${
                        completed
                          ? "font-semibold text-[#544339]"
                          : "text-[#A99A8C]"
                      }`}
                    >
                      {step.label}
                    </p>

                    {current && (
                      <p className="mt-1 text-[10px] text-[#8A6C5F]">
                        Current status
                      </p>
                    )}
                  </div>
                </div>

                {index < trackingSteps.length - 1 && (
                  <div
                    className={`hidden h-px sm:absolute sm:left-[calc(50%+25px)] sm:top-5 sm:block sm:w-[calc(100%-30px)] ${
                      index < currentStep ? "bg-[#544339]" : "bg-[#E0D9CF]"
                    }`}
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

const API_BASE_URL = "http://localhost:8000";

const getProductImage = (item) => {
  const product =
    item?.productId && typeof item.productId === "object"
      ? item.productId
      : item?.product && typeof item.product === "object"
        ? item.product
        : null;

  const variant =
    item?.variantId && typeof item.variantId === "object"
      ? item.variantId
      : item?.variant && typeof item.variant === "object"
        ? item.variant
        : null;

  const image =
    product?.images?.[0]?.url ||
    product?.images?.[0]?.image ||
    product?.images?.[0] ||
    product?.image ||
    item?.images?.[0] ||
    item?.image ||
    variant?.images?.[0] ||
    variant?.image ||
    "";

  if (!image || typeof image !== "string") {
    return "/placeholder.png";
  }

  // Full URL already exists
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  // Local backend upload path
  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
};
const getProductName = (item) => {
  const product =
    item?.productId && typeof item.productId === "object"
      ? item.productId
      : item?.product && typeof item.product === "object"
        ? item.product
        : null;

  return product?.name || item?.name || item?.productName || "Product";
};

const getVariant = (item) => {
  if (item?.variantId && typeof item.variantId === "object") {
    return item.variantId;
  }

  if (item?.variant && typeof item.variant === "object") {
    return item.variant;
  }

  return null;
};

function Orders() {
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(location.state?.message || "");
  const [isError, setIsError] = useState(false);
  const [cancellingId, setCancellingId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);

      setIsError(false);

      const response = await getCustomerOrders();
      console.log("CUSTOMER ORDERS:", JSON.stringify(response.data, null, 2));
      const result = response.data;

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

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmed) return;

    try {
      setCancellingId(orderId);
      setMessage("");
      setIsError(false);

      const response = await cancelOrder(orderId);

      setMessage(response.message || "Order cancelled successfully.");

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
        {/* Header */}
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

        {/* Message */}
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

        {/* Orders heading */}
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

        {/* Empty state */}
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
          <div className="space-y-6">
            {orders.map((order) => {
              const status = order.orderStatus || "processing";
              const shipping = order.shippingAddress;

              const canCancel = ["placed", "confirmed"].includes(
                status.toLowerCase(),
              );

              return (
                <article
                  key={order._id}
                  className="overflow-hidden border border-[#E0D9CF] bg-[#FCFAF6] shadow-[0_8px_30px_rgba(84,67,57,0.04)]"
                >
                  {/* Order top bar */}
                  <div className="flex flex-col gap-4 border-b border-[#E0D9CF] bg-[#F3E8D3]/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#E0D9CF]/60 text-[#8A6C5F]">
                        <Package size={19} strokeWidth={1.4} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] tracking-[0.2em] text-[#8A6C5F]">
                          ORDER REFERENCE
                        </p>

                        <p className="mt-1 break-all text-sm font-medium">
                          #{order._id}
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#8A6C5F]">
                          <CalendarDays size={13} />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <span
                        className={`inline-flex items-center gap-2 border px-3 py-2 text-[10px] tracking-wide ${getStatusStyle(status)}`}
                      >
                        {status.toLowerCase() === "delivered" ? (
                          <CheckCircle2 size={14} />
                        ) : status.toLowerCase() === "shipped" ? (
                          <Truck size={14} />
                        ) : (
                          <Clock3 size={14} />
                        )}

                        {status.replaceAll("_", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-7">
                    <OrderTracking status={status} />
                    {/* Items */}
                    <div>
                      <h3 className="mb-5 font-serif text-xl">Order items</h3>

                      <div className="divide-y divide-[#E0D9CF]">
                        {(order.items || []).map((item, index) => {
                          const variant = getVariant(item);
                          const productName = getProductName(item);
                          const image = getProductImage(item);

                          const quantity = Number(item.quantity || 0);

                          const unitPrice = Number(
                            item.price ?? item.sellingPrice ?? 0,
                          );

                          const subtotal = Number(
                            item.subtotal ?? unitPrice * quantity,
                          );

                          return (
                            <div
                              key={item._id || index}
                              className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              {/* Product image + details */}
                              <div className="flex min-w-0 items-start gap-4">
                                <div className="h-28 w-24 shrink-0 overflow-hidden border border-[#E0D9CF] bg-[#F8F4EE]">
                                  <img
                                    src={getProductImage(item)}
                                    alt={getProductName(item)}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                    onError={(event) => {
                                      event.currentTarget.onerror = null;
                                      event.currentTarget.src =
                                        "/placeholder.png";
                                    }}
                                  />
                                </div>

                                <div className="min-w-0 pt-1">
                                  <p className="text-sm font-medium">
                                    {productName}
                                  </p>

                                  <p className="mt-1 text-xs text-[#8A6C5F]">
                                    Size: {item.size || variant?.size || "-"}
                                    {" · "}
                                    Color: {item.color || variant?.color || "-"}
                                  </p>

                                  <p className="mt-1 text-xs text-[#8A6C5F]">
                                    Qty: {quantity}
                                  </p>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="pl-28 sm:pl-0 sm:text-right">
                                <p className="text-sm font-medium">
                                  {formatPrice(subtotal)}
                                </p>

                                <p className="mt-1 text-xs text-[#8A6C5F]">
                                  {formatPrice(unitPrice)} each
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Payment + shipping */}
                    <div className="mt-5 grid gap-4 border-t border-[#E0D9CF] pt-6 md:grid-cols-2">
                      <div className="border border-[#E0D9CF] p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <CreditCard size={16} className="text-[#8A6C5F]" />

                          <h3 className="text-[10px] tracking-[0.15em]">
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
                      </div>

                      {shipping && (
                        <div className="border border-[#E0D9CF] p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <MapPin size={16} className="text-[#8A6C5F]" />

                            <h3 className="text-[10px] tracking-[0.15em]">
                              SHIPPING ADDRESS
                            </h3>
                          </div>

                          <div className="text-sm leading-6">
                            {shipping.name && <p>{shipping.name}</p>}

                            {shipping.address && <p>{shipping.address}</p>}

                            {(shipping.city || shipping.state) && (
                              <p>
                                {[shipping.city, shipping.state]
                                  .filter(Boolean)
                                  .join(", ")}

                                {shipping.pincode
                                  ? ` - ${shipping.pincode}`
                                  : ""}
                              </p>
                            )}

                            {shipping.phone && (
                              <p className="mt-1 text-xs text-[#8A6C5F]">
                                Phone: {shipping.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Total + action */}
                    <div className="mt-6 flex flex-col gap-4 border-t border-[#E0D9CF] pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[9px] tracking-[0.2em] text-[#8A6C5F]">
                          ORDER TOTAL
                        </p>

                        <p className="mt-1 font-serif text-3xl">
                          {formatPrice(order.totalAmount)}
                        </p>
                      </div>

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancellingId === order._id}
                          className="inline-flex items-center justify-center gap-2 self-start border border-red-200 px-5 py-3 text-[10px] tracking-[0.12em] text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
                        >
                          <XCircle size={15} />

                          {cancellingId === order._id
                            ? "CANCELLING..."
                            : "CANCEL ORDER"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Bottom navigation */}
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
    </main>
  );
}

export default Orders;
