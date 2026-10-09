import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../../api/cartApi";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyItem, setBusyItem] = useState("");

  const fetchCart = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await getCart();

      setCart(response.data || response.cart || null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const getItems = () => {
    if (!cart) return [];
    return cart.items || [];
  };

  const handleUpdateQuantity = async (item, quantity) => {
    if (quantity < 1) return;

    try {
      setBusyItem(String(item._id));
      setMessage("");

      await updateCartItem(cart._id, item._id, quantity);
      await fetchCart();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update quantity.");
    } finally {
      setBusyItem("");
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      setBusyItem(String(item._id));
      setMessage("");

      await removeCartItem(cart._id, item._id);
      await fetchCart();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to remove item.");
    } finally {
      setBusyItem("");
    }
  };

  const handleClearCart = async () => {
    if (!cart?._id) return;

    try {
      setMessage("");

      await clearCart(cart._id);
      await fetchCart();
      setMessage("Cart cleared successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to clear cart.");
    }
  };

  if (loading) {
    return <h2>Loading cart...</h2>;
  }

  const items = getItems();

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Cart</h1>

      {message && <p role="status">{message}</p>}

      {!cart || items.length === 0 ? (
        <div>
          <p>Your cart is empty.</p>
          <Link to="/products">Continue Shopping</Link>
        </div>
      ) : (
        <>
          {items.map((item) => {
            const variant = item.variantId || item.variant || {};
            const product = item.productId || item.product || {};

            const name = item.name || product.name || "Product";

            const price = item.price ?? variant.sellingPrice ?? 0;

            const quantity = item.quantity || 1;

            return (
              <div
                key={item._id}
                style={{
                  border: "1px solid #ddd",
                  padding: "15px",
                  marginBottom: "15px",
                }}
              >
                <h3>{name}</h3>

                <p>Size: {item.size || variant.size || "-"}</p>

                <p>Color: {item.color || variant.color || "-"}</p>

                <p>Price: ₹{price}</p>

                <p>Subtotal: ₹{item.subtotal ?? price * quantity}</p>

                <button
                  disabled={busyItem === String(item._id) || quantity <= 1}
                  onClick={() => handleUpdateQuantity(item, quantity - 1)}
                >
                  -
                </button>

                <span style={{ margin: "0 12px" }}>{quantity}</span>

                <button
                  disabled={busyItem === String(item._id)}
                  onClick={() => handleUpdateQuantity(item, quantity + 1)}
                >
                  +
                </button>

                <button
                  style={{ marginLeft: "15px" }}
                  disabled={busyItem === String(item._id)}
                  onClick={() => handleRemoveItem(item)}
                >
                  Remove
                </button>
              </div>
            );
          })}

          <h2>
            Total: ₹
            {cart.totalAmount ??
              items.reduce(
                (sum, item) =>
                  sum +
                  (item.subtotal ?? (item.price || 0) * (item.quantity || 1)),
                0,
              )}
          </h2>

          <button onClick={handleClearCart}>Clear Cart</button>

          <Link to="/checkout" style={{ marginLeft: "15px" }}>
            Proceed to Checkout
          </Link>
        </>
      )}
    </div>
  );
}

export default Cart;
