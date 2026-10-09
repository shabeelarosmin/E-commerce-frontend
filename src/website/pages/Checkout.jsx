import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart, clearCart } from "../../api/cartApi";
import { createOrder } from "../../api/orderApi";

const initialAddress = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  marginBottom: "15px",
  boxSizing: "border-box",
};

function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [address, setAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await getCart();
        setCart(response.data || response.cart || null);
      } catch (error) {
        setMessage(error.response?.data?.message || "Failed to load cart.");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const items = cart?.items || [];

  const totalAmount =
    cart?.totalAmount ??
    items.reduce((total, item) => {
      const variant = item.variantId || item.variant || {};
      const price = item.price ?? variant.sellingPrice ?? 0;

      return total + price * (item.quantity || 1);
    }, 0);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    if (!items.length) {
      setMessage("Your cart is empty.");
      return;
    }

    try {
      setPlacingOrder(true);

      const orderItems = items.map((item) => {
        const variant = item.variantId || item.variant || {};
        const product = item.productId || item.product || {};

        return {
          productId: product._id || item.productId,
          variantId: variant._id || item.variantId,
          name: product.name || item.name || "Product",
          size: item.size || variant.size,
          color: item.color || variant.color,
          quantity: Number(item.quantity),
        };
      });

      const orderData = {
        items: orderItems,
        shippingAddress: {
          name: address.fullName,
          phone: address.phone,
          address: address.addressLine,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        paymentMethod,
      };

      const response = await createOrder(orderData);
      const order = response.data;

      // Clear cart only after successful order creation.
      try {
        if (cart?._id) {
          await clearCart(cart._id);
        }
      } catch (clearError) {
        console.error("Order created, but cart clearing failed:", clearError);
      }

      navigate("/orders", {
        state: {
          orderId: order?._id,
          message: response.message || "Order placed successfully!",
        },
      });
    } catch (error) {
      console.error("Place order error:", error.response?.data || error);

      setMessage(
        error.response?.data?.message ||
          "Failed to place order. Please try again.",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <h2 style={{ padding: "20px" }}>Loading checkout...</h2>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "30px auto", padding: "20px" }}>
      <h1>Checkout</h1>

      {message && (
        <p role="alert" style={{ color: "red" }}>
          {message}
        </p>
      )}

      {!items.length ? (
        <>
          <p>Your cart is empty.</p>
          <Link to="/products">Continue Shopping</Link>
        </>
      ) : (
        <form onSubmit={handlePlaceOrder}>
          <h2>Shipping Address</h2>

          <label>Full Name</label>
          <input
            name="fullName"
            value={address.fullName}
            onChange={handleAddressChange}
            required
            style={inputStyle}
          />

          <label>Phone Number</label>
          <input
            name="phone"
            type="tel"
            value={address.phone}
            onChange={handleAddressChange}
            required
            style={inputStyle}
          />

          <label>Address</label>
          <textarea
            name="addressLine"
            value={address.addressLine}
            onChange={handleAddressChange}
            required
            style={inputStyle}
          />

          <label>City</label>
          <input
            name="city"
            value={address.city}
            onChange={handleAddressChange}
            required
            style={inputStyle}
          />

          <label>State</label>
          <input
            name="state"
            value={address.state}
            onChange={handleAddressChange}
            required
            style={inputStyle}
          />

          <label>PIN Code</label>
          <input
            name="pincode"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={address.pincode}
            onChange={handleAddressChange}
            required
            style={inputStyle}
          />

          <hr />

          <h2>Payment Method</h2>

          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={paymentMethod === "COD"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Cash on Delivery (COD)
          </label>

          <hr />

          <h2>Order Summary</h2>

          {items.map((item) => {
            const variant = item.variantId || item.variant || {};
            const product = item.productId || item.product || {};
            const price = item.price ?? variant.sellingPrice ?? 0;
            const quantity = item.quantity || 1;

            return (
              <div
                key={item._id}
                style={{
                  borderBottom: "1px solid #ddd",
                  padding: "10px 0",
                }}
              >
                <strong>{product.name || item.name || "Product"}</strong>

                <p>
                  Size: {item.size || variant.size || "-"} | Color:{" "}
                  {item.color || variant.color || "-"}
                </p>

                <p>
                  ₹{price} × {quantity} = ₹{price * quantity}
                </p>
              </div>
            );
          })}

          <h2>Total: ₹{totalAmount}</h2>

          <button type="submit" disabled={placingOrder}>
            {placingOrder ? "Placing Order..." : "Place Order"}
          </button>

          <p>
            <Link to="/cart">Back to Cart</Link>
          </p>
        </form>
      )}
    </div>
  );
}

export default Checkout;
