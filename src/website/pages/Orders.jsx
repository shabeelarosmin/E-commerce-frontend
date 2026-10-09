import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCustomerOrders, cancelOrder } from "../../api/orderApi";

function Orders() {
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(location.state?.message || "");
  const [cancellingId, setCancellingId] = useState("");

  const fetchOrders = async () => {
    try {
      const response = await getCustomerOrders();
      const data = response.data || [];

      setOrders(Array.isArray(data) ? data : [data]);
    } catch (error) {
      if (error.response?.status === 404) {
        setOrders([]);
      } else {
        setMessage(error.response?.data?.message || "Failed to load orders.");
      }
    } finally {
      setLoading(false);
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

      const response = await cancelOrder(orderId);

      setMessage(response.message || "Order cancelled successfully.");

      await fetchOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancellingId("");
    }
  };

  if (loading) {
    return <h2 style={{ padding: "20px" }}>Loading orders...</h2>;
  }

  return (
    <div style={{ maxWidth: "900px", margin: "30px auto", padding: "20px" }}>
      <h1>My Orders</h1>

      {message && <p role="status">{message}</p>}

      {orders.length === 0 ? (
        <>
          <p>No orders found.</p>
          <Link to="/products">Continue Shopping</Link>
        </>
      ) : (
        orders.map((order) => (
          <div
            key={order._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3>Order ID: {order._id}</h3>

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

            {(order.items || []).map((item, index) => {
              const product =
                item.productId && typeof item.productId === "object"
                  ? item.productId
                  : null;

              const variant =
                item.variantId && typeof item.variantId === "object"
                  ? item.variantId
                  : null;

              return (
                <div key={item._id || index}>
                  <p>
                    {product?.name || item.name || "Product"} — Size:{" "}
                    {item.size || variant?.size || "-"} — Color:{" "}
                    {item.color || variant?.color || "-"}
                  </p>

                  <p>
                    ₹{item.price} × {item.quantity} = ₹{item.subtotal}
                  </p>
                </div>
              );
            })}

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

            {["placed", "confirmed"].includes(order.orderStatus) && (
              <button
                type="button"
                onClick={() => handleCancelOrder(order._id)}
                disabled={cancellingId === order._id}
                style={{
                  marginTop: "12px",
                  padding: "10px 15px",
                  cursor: "pointer",
                }}
              >
                {cancellingId === order._id ? "Cancelling..." : "Cancel Order"}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Orders;
