import { useEffect, useState } from "react";
import { getAllOrders, updateOrderStatus } from "../../api/orderApi";

const nextStatus = {
  placed: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setError("");

      const response = await getAllOrders();
      const data = response.data;

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (order) => {
    const status = nextStatus[order.orderStatus];

    if (!status) return;

    const confirmed = window.confirm(
      `Change order status from "${order.orderStatus}" to "${status}"?`,
    );

    if (!confirmed) return;

    try {
      setUpdatingId(order._id);
      setMessage("");
      setError("");

      const response = await updateOrderStatus(order._id, status);

      setMessage(response.message || "Order status updated successfully.");

      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) {
    return <h2 style={{ padding: "24px" }}>Loading orders...</h2>;
  }

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "30px auto",
        padding: "20px",
      }}
    >
      <h1>Orders Management</h1>

      {message && (
        <p role="status" style={{ color: "green" }}>
          {message}
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={fetchOrders}
        style={{ padding: "10px 16px", marginBottom: "20px" }}
      >
        Refresh Orders
      </button>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div
            key={order._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3>Order ID: {order._id}</h3>

            <p>
              <strong>Customer:</strong> {order.customerId?.name || "Customer"}
            </p>

            <p>
              <strong>Status:</strong> {order.orderStatus}
            </p>

            <p>
              <strong>Payment:</strong> {order.paymentMethod}
            </p>

            <p>
              <strong>Payment Status:</strong> {order.paymentStatus}
            </p>

            <h3>Items</h3>

            {(order.items || []).map((item, index) => (
              <div key={item._id || index}>
                <p>
                  {item.productId?.name || item.name || "Product"} — Size:{" "}
                  {item.size || item.variantId?.size || "-"} — Color:{" "}
                  {item.color || item.variantId?.color || "-"}
                </p>

                <p>
                  ₹{item.price} × {item.quantity} = ₹{item.subtotal}
                </p>
              </div>
            ))}

            <h2>Total: ₹{order.totalAmount}</h2>

            {order.shippingAddress && (
              <div>
                <h3>Shipping Address</h3>
                <p>{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                  {order.shippingAddress.pincode}
                </p>
                <p>Phone: {order.shippingAddress.phone}</p>
              </div>
            )}

            {nextStatus[order.orderStatus] && (
              <button
                type="button"
                onClick={() => handleStatusUpdate(order)}
                disabled={updatingId === order._id}
                style={{
                  marginTop: "12px",
                  padding: "10px 16px",
                  cursor: "pointer",
                  background: "#1677ff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                }}
              >
                {updatingId === order._id
                  ? "Updating..."
                  : `Mark as ${nextStatus[order.orderStatus]}`}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Orders;
