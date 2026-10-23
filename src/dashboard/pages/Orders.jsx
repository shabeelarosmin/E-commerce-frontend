import { useEffect, useMemo, useState } from "react";
import {
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
} from "../../api/orderApi";

const formatPrice = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
};

const getOrderStatus = (order) =>
  String(order?.orderStatus || order?.status || "placed").toLowerCase();

// Customer name: populated customerId first, then shipping address
const getOrderCustomer = (order) => {
  const customer =
    order?.customerId || order?.customer || order?.userId || order?.user;

  if (customer && typeof customer === "object") {
    const name = [customer.name, customer.fullName, customer.firstName]
      .filter(Boolean)
      .join(" ");

    if (name) return name;

    if (customer.email) return customer.email;
  }

  const address = order?.shippingAddress || {};

  return (
    address.name ||
    address.fullName ||
    order?.customerName ||
    "Customer name unavailable"
  );
};

const getOrderAmount = (order) =>
  order?.totalAmount ??
  order?.total ??
  order?.grandTotal ??
  order?.finalAmount ??
  0;

const getOrderItems = (order) =>
  Array.isArray(order?.items)
    ? order.items
    : Array.isArray(order?.orderItems)
      ? order.orderItems
      : [];

const getAddress = (order) => {
  const address =
    order?.shippingAddress || order?.deliveryAddress || order?.address || {};

  if (typeof address === "string") return address;

  return [
    address.name,
    address.fullName,
    address.phone,
    address.addressLine,
    address.address,
    address.city,
    address.state,
    address.pincode,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
};

const statusOptions = [
  "placed",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const statusClass = (status) => {
  if (status === "delivered") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "confirmed") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "shipped") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (status === "placed") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
};

const titleCase = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

// Handle different response shapes returned by the API
const extractOrderArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.orders)) return response.orders;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.orders)) return response.data.orders;
  if (Array.isArray(response?.data?.data)) return response.data.data;

  return [];
};

const extractSingleOrder = (response) =>
  response?.order ||
  response?.data?.order ||
  response?.data?.data ||
  response?.data ||
  response;

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("placed");

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  // FETCH ALL ORDERS
  const fetchOrders = async () => {
    try {
      setPageError("");

      const response = await getAllOrders();

      console.log("ALL ORDERS API RESPONSE:", response);

      const records = extractOrderArray(response);
      setOrders(records);
    } catch (error) {
      console.error("Fetch orders error:", error);

      setPageError(error?.response?.data?.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // SEARCH AND FILTER
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const orderId = getId(order?._id || order?.id);
      const customer = getOrderCustomer(order);
      const status = getOrderStatus(order);

      const matchesSearch =
        !query ||
        orderId.toLowerCase().includes(query) ||
        customer.toLowerCase().includes(query) ||
        String(order?.orderNumber || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // OPEN ORDER DETAILS
  const openOrderDetails = async (order) => {
    setSelectedOrder(order);
    setSelectedStatus(getOrderStatus(order));
    setStatusMessage("");
    setStatusError("");
    setDetailsLoading(true);

    const orderId = getId(order?._id || order?.id);

    try {
      const response = await getAdminOrderById(orderId);

      console.log("ORDER DETAILS API RESPONSE:", response);

      const detailedOrder = extractSingleOrder(response);

      if (
        detailedOrder &&
        typeof detailedOrder === "object" &&
        detailedOrder._id
      ) {
        setSelectedOrder(detailedOrder);
        setSelectedStatus(getOrderStatus(detailedOrder));
      }
    } catch (error) {
      console.error("Fetch order details error:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // UPDATE ORDER STATUS
  const handleUpdateStatus = async () => {
    const orderId = getId(selectedOrder?._id || selectedOrder?.id);

    if (!orderId) {
      setStatusError("Order ID not found.");
      return;
    }

    if (selectedStatus === getOrderStatus(selectedOrder)) {
      return;
    }

    try {
      setUpdating(true);
      setStatusError("");
      setStatusMessage("");

      await updateOrderStatus(orderId, selectedStatus);

      await fetchOrders();

      // Update selected order from refreshed records
      const updatedOrder = orders.find(
        (order) => getId(order?._id || order?.id) === orderId,
      );

      setSelectedOrder((previous) =>
        previous
          ? {
              ...previous,
              ...(updatedOrder || {}),
              orderStatus: selectedStatus,
            }
          : previous,
      );

      setStatusMessage("Order status updated successfully.");
    } catch (error) {
      console.error("Update order status error:", error);

      setStatusError(
        error?.response?.data?.message ||
          "Unable to update order status. Please try again.",
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F3ED] p-4 text-[#49382E] sm:p-7">
      <section className="mx-auto max-w-[1500px] overflow-hidden rounded-2xl border border-[#E8DCCF] bg-[#FFFCF8] shadow-sm">
        <header className="flex flex-col justify-between gap-5 border-b border-[#E8DCCF] p-6 sm:flex-row sm:items-center sm:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A87845]">
              Order Directory
            </p>

            <h1 className="mt-2 font-serif text-3xl">All Orders</h1>

            <p className="mt-2 text-sm text-[#967E6E]">
              {filteredOrders.length} orders shown · {orders.length} total
              orders
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchOrders();
            }}
            className="border border-[#DDC8B4] px-5 py-3 text-xs transition hover:bg-[#F5EEE4]"
          >
            ↻ Refresh Orders
          </button>
        </header>

        <div className="grid gap-3 border-b border-[#E8DCCF] p-5 md:grid-cols-[1fr_200px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order ID or customer..."
            className="w-full rounded-xl border border-[#E5D6C7] bg-white px-4 py-3 text-sm outline-none focus:border-[#8A6C5F]"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-[#E5D6C7] bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="all">All statuses</option>

            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {titleCase(status)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#967E6E]">
            Loading orders...
          </div>
        ) : pageError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-700">{pageError}</p>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchOrders();
              }}
              className="mt-4 border border-[#DDC8B4] px-5 py-2 text-sm"
            >
              Try again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="font-serif text-xl">No orders found</h2>
            <p className="mt-2 text-sm text-[#967E6E]">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8DCCF]">
            {filteredOrders.map((order) => {
              const orderId = getId(order?._id || order?.id);
              const status = getOrderStatus(order);

              return (
                <article key={orderId} className="p-5 sm:p-7">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A87845]">
                        Order Reference
                      </p>

                      <h2 className="mt-2 font-serif text-xl">
                        #{order?.orderNumber || orderId.slice(-8).toUpperCase()}
                      </h2>

                      <p className="mt-1 text-sm text-[#967E6E]">
                        {getOrderCustomer(order)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs ${statusClass(status)}`}
                    >
                      ● &nbsp; {titleCase(status)}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 border-y border-[#E8DCCF] py-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-[#967E6E]">Order Amount</p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatPrice(getOrderAmount(order))}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#967E6E]">Payment Method</p>
                      <p className="mt-2 text-sm">
                        {titleCase(order?.paymentMethod || "COD")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#967E6E]">Order Date</p>
                      <p className="mt-2 text-sm">
                        {order?.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              "en-IN",
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[#967E6E]">
                      {getOrderItems(order).length} item type(s)
                    </p>

                    <button
                      type="button"
                      onClick={() => openOrderDetails(order)}
                      className="rounded-lg border border-[#DDC8B4] px-5 py-2.5 text-xs transition hover:bg-[#F5EEE4]"
                    >
                      View Details ↗
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer className="border-t border-[#E8DCCF] px-6 py-5 text-xs text-[#967E6E]">
          Showing {filteredOrders.length} of {orders.length} orders · ÉLORA
          Order Management
        </footer>
      </section>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !updating) {
              setSelectedOrder(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-heading"
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#E8DCCF] bg-[#FFFCF8] shadow-2xl"
          >
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-[#E8DCCF] bg-[#FFFCF8] p-5 sm:p-7">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#A87845]">
                  Complete Order Information
                </p>

                <h2
                  id="order-details-heading"
                  className="mt-2 font-serif text-2xl"
                >
                  Order #
                  {selectedOrder?.orderNumber ||
                    getId(selectedOrder?._id || selectedOrder?.id)
                      .slice(-8)
                      .toUpperCase()}
                </h2>

                <p className="mt-1 text-sm text-[#967E6E]">
                  {getOrderCustomer(selectedOrder)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                disabled={updating}
                aria-label="Close details"
                className="rounded-full border border-[#DDC8B4] px-3 py-1.5 disabled:opacity-50"
              >
                ✕
              </button>
            </header>

            <div className="space-y-7 p-5 sm:p-7">
              {detailsLoading && (
                <p className="text-sm text-[#967E6E]">
                  Loading latest order details...
                </p>
              )}

              <section>
                <h3 className="mb-4 font-serif text-lg">Order Summary</h3>

                <div className="grid gap-4 rounded-xl border border-[#E8DCCF] p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#967E6E]">Order ID</p>
                    <p className="mt-1 break-all text-sm">
                      {getId(selectedOrder?._id || selectedOrder?.id) || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#967E6E]">Order Status</p>
                    <p className="mt-1 text-sm font-medium">
                      {titleCase(getOrderStatus(selectedOrder))}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#967E6E]">Order Date</p>
                    <p className="mt-1 text-sm">
                      {selectedOrder?.createdAt
                        ? new Date(selectedOrder.createdAt).toLocaleString(
                            "en-IN",
                          )
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#967E6E]">Total Amount</p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatPrice(getOrderAmount(selectedOrder))}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-4 font-serif text-lg">Order Items</h3>

                {getOrderItems(selectedOrder).length === 0 ? (
                  <p className="rounded-xl border border-[#E8DCCF] p-4 text-sm text-[#967E6E]">
                    No item details were returned by the order API.
                  </p>
                ) : (
                  <div className="divide-y divide-[#E8DCCF] rounded-xl border border-[#E8DCCF] px-4">
                    {getOrderItems(selectedOrder).map((item, index) => {
                      const product = item?.productId || item?.product || {};
                      const variant = item?.variantId || item?.variant || {};

                      const name =
                        item?.productName ||
                        product?.name ||
                        item?.name ||
                        "Product";

                      const size = item?.size || variant?.size;
                      const color = item?.color || variant?.color;
                      const quantity = Number(item?.quantity || 1);

                      const itemPrice = Number(
                        item?.price ??
                          item?.sellingPrice ??
                          variant?.sellingPrice ??
                          variant?.price ??
                          0,
                      );

                      return (
                        <div
                          key={getId(item?._id) || `${name}-${index}`}
                          className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                        >
                          <div>
                            <p className="text-sm font-medium">{name}</p>

                            {(size || color) && (
                              <p className="mt-1 text-xs text-[#967E6E]">
                                {size ? `Size: ${size}` : ""}
                                {size && color ? " · " : ""}
                                {color ? `Colour: ${color}` : ""}
                              </p>
                            )}

                            <p className="mt-1 text-xs text-[#967E6E]">
                              {formatPrice(itemPrice)} × {quantity}
                            </p>
                          </div>

                          <p className="text-sm font-semibold">
                            {formatPrice(
                              item?.subtotal ??
                                item?.total ??
                                itemPrice * quantity,
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-4 font-serif text-lg">
                  Customer & Shipping Address
                </h3>

                <div className="rounded-xl border border-[#E8DCCF] bg-[#FBF7F1] p-4">
                  <p className="text-sm font-medium">
                    {getOrderCustomer(selectedOrder)}
                  </p>

                  <p className="mt-2 break-words text-sm leading-6 text-[#967E6E]">
                    {getAddress(selectedOrder) || "Address not available"}
                  </p>

                  {(selectedOrder?.customerId?.email ||
                    selectedOrder?.customer?.email) && (
                    <p className="mt-2 text-sm text-[#967E6E]">
                      Email:{" "}
                      {selectedOrder?.customerId?.email ||
                        selectedOrder?.customer?.email}
                    </p>
                  )}

                  {(selectedOrder?.customerId?.phone ||
                    selectedOrder?.customer?.phone) && (
                    <p className="mt-2 text-sm text-[#967E6E]">
                      Phone:{" "}
                      {selectedOrder?.customerId?.phone ||
                        selectedOrder?.customer?.phone}
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="mb-4 font-serif text-lg">Payment Information</h3>

                <div className="grid gap-4 rounded-xl border border-[#E8DCCF] p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#967E6E]">Payment Method</p>
                    <p className="mt-1 text-sm">
                      {titleCase(selectedOrder?.paymentMethod || "COD")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#967E6E]">Payment Status</p>
                    <p className="mt-1 text-sm">
                      {titleCase(selectedOrder?.paymentStatus || "pending")}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[#E6D1BD] bg-[#F9F3EC] p-4 sm:p-5">
                <h3 className="font-semibold">Update Order Status</h3>

                <p className="mt-1 text-xs leading-5 text-[#967E6E]">
                  Update the order through the permitted status sequence.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <select
                    value={selectedStatus}
                    onChange={(event) => {
                      setSelectedStatus(event.target.value);
                      setStatusMessage("");
                      setStatusError("");
                    }}
                    disabled={updating}
                    className="min-w-0 flex-1 rounded-lg border border-[#D8C5B2] bg-white px-4 py-3 text-sm outline-none focus:border-[#8A6C5F]"
                  >
                    <option value={getOrderStatus(selectedOrder)}>
                      {titleCase(getOrderStatus(selectedOrder))}
                    </option>

                    {(
                      {
                        placed: ["confirmed"],
                        confirmed: ["shipped"],
                        shipped: ["delivered"],
                        delivered: [],
                        cancelled: [],
                      }[getOrderStatus(selectedOrder)] || []
                    ).map((status) => (
                      <option key={status} value={status}>
                        {titleCase(status)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={
                      updating ||
                      selectedStatus === getOrderStatus(selectedOrder)
                    }
                    className="rounded-lg bg-[#544339] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#8A6C5F] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Update Status"}
                  </button>
                </div>

                {statusMessage && (
                  <p role="status" className="mt-3 text-sm text-green-700">
                    {statusMessage}
                  </p>
                )}

                {statusError && (
                  <p role="alert" className="mt-3 text-sm text-red-700">
                    {statusError}
                  </p>
                )}
              </section>
            </div>

            <footer className="sticky bottom-0 flex justify-end border-t border-[#E8DCCF] bg-[#FBF7F1] p-4 sm:px-7">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                disabled={updating}
                className="rounded-lg border border-[#DDC8B4] px-5 py-3 text-xs transition hover:bg-[#F2E7DB] disabled:opacity-50"
              >
                Close Details
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}

export default OrderManagement;
