import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart, clearCart } from "../../api/cartApi";
import { createOrder } from "../../api/orderApi";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
};

// Read customer details saved during login.
const getSavedAddress = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const savedAddress = user?.address || user?.shippingAddress || {};

    return {
      fullName: user?.name || user?.fullName || "",
      phone: user?.phone || "",
      addressLine:
        savedAddress.addressLine ||
        savedAddress.address ||
        savedAddress.street ||
        "",
      city: savedAddress.city || "",
      state: savedAddress.state || "",
      pincode:
        savedAddress.pinCode ||
        savedAddress.pincode ||
        savedAddress.postalCode ||
        "",
    };
  } catch {
    return { ...emptyAddress };
  }
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#E0D9CF] bg-white px-4 py-3.5 text-sm text-[#544339] outline-none transition placeholder:text-[#B5A69A] focus:border-[#8A6C5F] focus:ring-2 focus:ring-[#8A6C5F]/10";

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.12em] text-[#6B5549]";

function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [address, setAddress] = useState(getSavedAddress);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState("");

  // Keep address fields in sync with the logged-in account on mount.
  useEffect(() => {
    setAddress(getSavedAddress());
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await getCart();
        const result = response?.data ?? response;
        const cartData = result?.cart ?? result?.data ?? result;
        setCart(cartData);
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
      const price = Number(item.price ?? variant.sellingPrice ?? 0);
      return total + price * Number(item.quantity || 1);
    }, 0);

  const formatPrice = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

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
      navigate("/login", {
        state: { from: { pathname: "/checkout" } },
      });
      return;
    }

    if (!items.length) {
      setMessage("Your cart is empty.");
      return;
    }

    const normalizedAddress = {
      fullName: address.fullName.trim(),
      phone: address.phone.trim(),
      addressLine: address.addressLine.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      pincode: address.pincode.trim(),
    };

    if (
      !normalizedAddress.fullName ||
      !normalizedAddress.phone ||
      !normalizedAddress.addressLine ||
      !normalizedAddress.city ||
      !normalizedAddress.state ||
      !normalizedAddress.pincode
    ) {
      setMessage("Please complete all delivery details.");
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
          name: normalizedAddress.fullName,
          phone: normalizedAddress.phone,
          address: normalizedAddress.addressLine,
          city: normalizedAddress.city,
          state: normalizedAddress.state,
          pincode: normalizedAddress.pincode,
        },
        paymentMethod,
      };

      const response = await createOrder(orderData);
      const result = response?.data ?? response;
      const order = result?.order ?? result?.data ?? result;

      // Save the latest delivery details locally for the next checkout.
      // This does not replace saving the address in the backend database.
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");

        if (user) {
          const updatedUser = {
            ...user,
            name: user.name || normalizedAddress.fullName,
            phone: normalizedAddress.phone,
            address: {
              ...(user.address || {}),
              addressLine: normalizedAddress.addressLine,
              city: normalizedAddress.city,
              state: normalizedAddress.state,
              pinCode: normalizedAddress.pincode,
            },
          };

          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch (storageError) {
        console.error("Could not save delivery details locally:", storageError);
      }

      // Clear cart only after successful order creation.
      try {
        if (cart?._id) {
          await clearCart(cart._id);
        } else {
          await clearCart();
        }
      } catch (clearError) {
        console.error("Order created, but cart clearing failed:", clearError);
      }

      navigate("/orders", {
        state: {
          orderId: order?._id,
          message:
            result?.message || "Your order has been placed successfully!",
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
    return (
      <div className="flex min-h-[65vh] items-center justify-center bg-[#F8F4EE]">
        <div className="text-center">
          <LoaderCircle className="mx-auto mb-4 h-9 w-9 animate-spin text-[#8A6C5F]" />
          <p className="text-sm text-[#78675C]">Preparing your checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EE] pb-16 text-[#544339]">
      {/* Page heading */}
      <section className="border-b border-[#E0D9CF] bg-[#F3E8D3]/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link
            to="/cart"
            className="mb-7 inline-flex items-center gap-2 text-sm text-[#8A6C5F] transition hover:text-[#544339]"
          >
            <ArrowLeft size={16} />
            Back to bag
          </Link>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#8A6C5F]">
            ÉLORA / CHECKOUT
          </p>

          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
            Almost yours.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#78675C] sm:text-base">
            A few final details, then your favourites will be on their way to
            you.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-medium text-[#8A6C5F]">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              Your bag
            </span>
            <span className="h-px w-7 bg-[#BFA38A]" />
            <span className="flex items-center gap-2 text-[#544339]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8A6C5F] text-white">
                2
              </span>
              Checkout
            </span>
            <span className="h-px w-7 bg-[#E0D9CF]" />
            <span className="text-[#A99A8F]">Confirmation</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {message && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span className="font-semibold">!</span>
            <p>{message}</p>
          </div>
        )}

        {!items.length ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-[#E0D9CF] bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F3E8D3]">
              <ShoppingBag size={27} className="text-[#8A6C5F]" />
            </div>

            <h2 className="font-serif text-2xl">Your bag is waiting</h2>

            <p className="mt-3 text-sm leading-6 text-[#78675C]">
              Add something you love before heading to checkout.
            </p>

            <Link
              to="/products"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#544339] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#8A6C5F]"
            >
              Explore collection
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder}>
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_390px] lg:gap-12">
              {/* Checkout form */}
              <div className="space-y-6">
                {/* Shipping details */}
                <section className="rounded-2xl border border-[#E0D9CF] bg-white p-5 shadow-sm sm:p-8">
                  <div className="mb-7 flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3E8D3]">
                      <MapPin size={20} className="text-[#8A6C5F]" />
                    </div>

                    <div>
                      <h2 className="font-serif text-2xl">Delivery details</h2>
                      <p className="mt-1 text-sm text-[#928176]">
                        Your saved details are filled in when available. You can
                        edit them before placing your order.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
                    <div className="mb-5 sm:col-span-2">
                      <label className={labelClass} htmlFor="fullName">
                        Full name
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        autoComplete="name"
                        value={address.fullName}
                        onChange={handleAddressChange}
                        placeholder="Enter your full name"
                        required
                        className={inputClass}
                      />
                    </div>

                    <div className="mb-5 sm:col-span-2">
                      <label className={labelClass} htmlFor="phone">
                        Phone number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        value={address.phone}
                        onChange={handleAddressChange}
                        placeholder="10-digit mobile number"
                        required
                        className={inputClass}
                      />
                    </div>

                    <div className="mb-5 sm:col-span-2">
                      <label className={labelClass} htmlFor="addressLine">
                        Street address
                      </label>
                      <textarea
                        id="addressLine"
                        name="addressLine"
                        autoComplete="street-address"
                        rows={3}
                        value={address.addressLine}
                        onChange={handleAddressChange}
                        placeholder="House number, street, landmark..."
                        required
                        className={`${inputClass} resize-y`}
                      />
                    </div>

                    <div className="mb-5">
                      <label className={labelClass} htmlFor="city">
                        City
                      </label>
                      <input
                        id="city"
                        name="city"
                        autoComplete="address-level2"
                        value={address.city}
                        onChange={handleAddressChange}
                        placeholder="Your city"
                        required
                        className={inputClass}
                      />
                    </div>

                    <div className="mb-5">
                      <label className={labelClass} htmlFor="state">
                        State
                      </label>
                      <input
                        id="state"
                        name="state"
                        autoComplete="address-level1"
                        value={address.state}
                        onChange={handleAddressChange}
                        placeholder="Your state"
                        required
                        className={inputClass}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="pincode">
                        PIN code
                      </label>
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={address.pincode}
                        onChange={handleAddressChange}
                        placeholder="6-digit PIN code"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                </section>

                {/* Payment */}
                <section className="rounded-2xl border border-[#E0D9CF] bg-white p-5 shadow-sm sm:p-8">
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3E8D3]">
                      <CreditCard size={20} className="text-[#8A6C5F]" />
                    </div>

                    <div>
                      <h2 className="font-serif text-2xl">Payment method</h2>
                      <p className="mt-1 text-sm text-[#928176]">
                        Choose how you would like to pay.
                      </p>
                    </div>
                  </div>

                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${
                      paymentMethod === "COD"
                        ? "border-[#8A6C5F] bg-[#F8F4EE]"
                        : "border-[#E0D9CF] hover:border-[#BFA38A]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 accent-[#8A6C5F]"
                    />

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                      <Package size={19} className="text-[#8A6C5F]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Cash on Delivery</p>
                      <p className="mt-1 text-xs text-[#928176]">
                        Pay when your order arrives.
                      </p>
                    </div>

                    <span className="rounded-full bg-[#E0D9CF]/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6B5549]">
                      COD
                    </span>
                  </label>

                  <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#928176]">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 shrink-0 text-[#8A6C5F]"
                    />
                    <p>
                      Your order details are handled securely. Online payment is
                      not enabled in this checkout.
                    </p>
                  </div>
                </section>
              </div>

              {/* Order summary */}
              <aside className="lg:sticky lg:top-6">
                <section className="overflow-hidden rounded-2xl border border-[#E0D9CF] bg-white shadow-sm">
                  <div className="border-b border-[#E0D9CF] bg-[#F3E8D3]/40 px-5 py-6 sm:px-7">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8A6C5F]">
                      ÉLORA / YOUR SELECTION
                    </p>
                    <h2 className="mt-2 font-serif text-2xl">Order summary</h2>
                    <p className="mt-1 text-sm text-[#928176]">
                      {items.length} {items.length === 1 ? "item" : "items"} in
                      your bag
                    </p>
                  </div>

                  <div className="max-h-[360px] space-y-5 overflow-y-auto p-5 sm:px-7">
                    {items.map((item, index) => {
                      const variant = item.variantId || item.variant || {};
                      const product = item.productId || item.product || {};
                      const price = Number(
                        item.price ?? variant.sellingPrice ?? 0,
                      );
                      const quantity = Number(item.quantity || 1);
                      const imagePath =
                        product.images?.[0] ||
                        item.productId?.images?.[0] ||
                        item.product?.images?.[0] ||
                        "";

                      const imageUrl = imagePath
                        ? imagePath.startsWith("http")
                          ? imagePath
                          : `http://localhost:8000${imagePath}`
                        : "";

                      return (
                        <div
                          key={
                            item._id || `${product._id || "product"}-${index}`
                          }
                          className="flex gap-4"
                        >
                          <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F8F4EE]">
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={product.name || item.name || "Product"}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-5">
                              {product.name || item.name || "Product"}
                            </h3>

                            <p className="mt-1 text-xs text-[#928176]">
                              Size: {item.size || variant.size || "-"}
                              {" · "}
                              Color: {item.color || variant.color || "-"}
                            </p>

                            <p className="mt-2 text-xs text-[#78675C]">
                              Qty: {quantity}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-semibold">
                            {formatPrice(price * quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-[#E0D9CF] px-5 py-6 sm:px-7">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-3 text-[#78675C]">
                        <span>Subtotal</span>
                        <span>{formatPrice(totalAmount)}</span>
                      </div>

                      <div className="flex justify-between gap-3 text-[#78675C]">
                        <span>Delivery</span>
                        <span className="font-medium text-[#6D8060]">
                          Calculated by store
                        </span>
                      </div>
                    </div>

                    <div className="my-5 border-t border-dashed border-[#E0D9CF]" />

                    <div className="flex items-center justify-between gap-3">
                      <span className="font-serif text-xl">Total</span>
                      <span className="text-2xl font-semibold tracking-tight">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>

                    <p className="mt-2 text-right text-[11px] text-[#928176]">
                      Final delivery charges depend on your store setup.
                    </p>

                    <button
                      type="submit"
                      disabled={placingOrder}
                      className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-[#544339] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#8A6C5F] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {placingOrder ? (
                        <>
                          <LoaderCircle size={17} className="animate-spin" />
                          Placing order...
                        </>
                      ) : (
                        <>
                          Place my order
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <Link
                      to="/cart"
                      className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-[#8A6C5F] transition hover:text-[#544339]"
                    >
                      <ArrowLeft size={14} />
                      Return to bag
                    </Link>

                    <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#E0D9CF] pt-5 text-[10px] uppercase tracking-[0.12em] text-[#928176]">
                      <LockKeyhole size={13} />
                      Secure checkout
                    </div>
                  </div>
                </section>

                <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#E0D9CF] bg-white/60 p-4">
                  <Truck size={19} className="mt-0.5 shrink-0 text-[#8A6C5F]" />
                  <div>
                    <p className="text-xs font-semibold">
                      Thoughtfully packed, made for you
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#928176]">
                      Please double-check your delivery details before placing
                      your order.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default Checkout;
