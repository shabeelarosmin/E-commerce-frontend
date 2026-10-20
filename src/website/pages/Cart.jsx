import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../../api/cartApi";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Trash2,
  Truck,
} from "lucide-react";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyItem, setBusyItem] = useState("");
  const [clearing, setClearing] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setMessage("");

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

  useEffect(() => {
    fetchCart();
  }, []);

  const items = cart?.items || [];

  const formatPrice = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const getProductDetails = (item) => {
    const variant = item.variantId || item.variant || {};
    const product = item.productId || item.product || {};

    const price = Number(item.price ?? variant.sellingPrice ?? 0);

    const quantity = Number(item.quantity || 1);

    return {
      variant,
      product,
      name: item.name || product.name || "Product",
      price,
      quantity,
      subtotal: Number(item.subtotal ?? price * quantity),
      size: item.size || variant.size || "-",
      color: item.color || variant.color || "-",
      image:
        item.image ||
        product.image ||
        product.images?.[0] ||
        variant.image ||
        "",
    };
  };

  const totalAmount =
    cart?.totalAmount ??
    items.reduce((sum, item) => sum + getProductDetails(item).subtotal, 0);

  const handleUpdateQuantity = async (item, quantity) => {
    if (quantity < 1 || busyItem || clearing) return;

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
    if (busyItem || clearing) return;

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
    if (!cart?._id || busyItem || clearing) return;

    try {
      setClearing(true);
      setMessage("");

      await clearCart(cart._id);
      await fetchCart();
      setMessage("Your shopping bag has been cleared.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to clear cart.");
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8F4EE]">
        <div className="text-center">
          <LoaderCircle className="mx-auto mb-4 h-9 w-9 animate-spin text-[#8A6C5F]" />
          <p className="text-sm text-[#78675C]">
            Preparing your shopping bag...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EE] pb-16 text-[#544339]">
      {/* Header */}
      <section className="border-b border-[#E0D9CF] bg-[#F3E8D3]/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link
            to="/products"
            className="mb-7 inline-flex items-center gap-2 text-sm text-[#8A6C5F] transition hover:text-[#544339]"
          >
            <ArrowLeft size={16} />
            Continue shopping
          </Link>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#8A6C5F]">
            ÉLORA / YOUR SELECTION
          </p>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
                Your shopping bag.
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#78675C] sm:text-base">
                The pieces you love, all in one place.
              </p>
            </div>

            <span className="rounded-full border border-[#BFA38A] bg-white/70 px-4 py-2 text-xs font-medium text-[#8A6C5F]">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {message && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-[#E0D9CF] bg-white p-4 text-sm text-[#6B5549]"
          >
            <span className="mt-0.5 text-[#8A6C5F]">●</span>
            <p>{message}</p>
          </div>
        )}

        {items.length === 0 ? (
          <section className="mx-auto max-w-lg rounded-3xl border border-[#E0D9CF] bg-white px-6 py-14 text-center shadow-sm sm:py-16">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F3E8D3]">
              <ShoppingBag
                size={31}
                strokeWidth={1.4}
                className="text-[#8A6C5F]"
              />
            </div>

            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8A6C5F]">
              A little room for something lovely
            </p>

            <h2 className="font-serif text-3xl">Your bag is empty.</h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#928176]">
              Discover thoughtfully selected styles and find something that
              feels like you.
            </p>

            <Link
              to="/products"
              className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-[#544339] px-7 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-[#8A6C5F]"
            >
              Explore collection
              <ArrowRight size={16} />
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_370px] lg:gap-12">
            {/* Cart items */}
            <section>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-serif text-2xl">Selected pieces</h2>

                <button
                  type="button"
                  onClick={handleClearCart}
                  disabled={clearing || Boolean(busyItem)}
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#8A6C5F] transition hover:text-red-700 disabled:opacity-50"
                >
                  {clearing ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Clear bag
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#E0D9CF] bg-white shadow-sm">
                {items.map((item, index) => {
                  const details = getProductDetails(item);
                  const isBusy = busyItem === String(item._id);

                  return (
                    <article
                      key={item._id || `${details.name}-${index}`}
                      className={`p-4 sm:p-6 ${
                        index !== items.length - 1
                          ? "border-b border-[#E0D9CF]"
                          : ""
                      }`}
                    >
                      <div className="flex gap-4 sm:gap-6">
                        {/* Product image */}
                        <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F3E8D3]/50 sm:h-40 sm:w-32">
                          {details.image ? (
                            <img
                              src={details.image}
                              alt={details.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ShoppingBag
                              size={29}
                              strokeWidth={1.3}
                              className="text-[#BFA38A]"
                            />
                          )}
                        </div>

                        {/* Product information */}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A18B7B]">
                                ÉLORA COLLECTION
                              </p>

                              <h3 className="font-serif text-lg leading-6 sm:text-xl">
                                {details.name}
                              </h3>
                            </div>

                            <p className="shrink-0 text-sm font-semibold sm:text-base">
                              {formatPrice(details.subtotal)}
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#78675C]">
                            <span className="rounded-md bg-[#F8F4EE] px-2.5 py-1.5">
                              Size: {details.size}
                            </span>

                            <span className="rounded-md bg-[#F8F4EE] px-2.5 py-1.5">
                              Color: {details.color}
                            </span>
                          </div>

                          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
                            {/* Quantity control */}
                            <div className="inline-flex items-center rounded-full border border-[#E0D9CF]">
                              <button
                                type="button"
                                aria-label={`Decrease quantity of ${details.name}`}
                                disabled={
                                  isBusy ||
                                  Boolean(busyItem) ||
                                  clearing ||
                                  details.quantity <= 1
                                }
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item,
                                    details.quantity - 1,
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-l-full transition hover:bg-[#F3E8D3] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Minus size={14} />
                              </button>

                              <span className="min-w-8 text-center text-sm font-medium tabular-nums">
                                {isBusy ? (
                                  <LoaderCircle
                                    size={14}
                                    className="mx-auto animate-spin"
                                  />
                                ) : (
                                  details.quantity
                                )}
                              </span>

                              <button
                                type="button"
                                aria-label={`Increase quantity of ${details.name}`}
                                disabled={Boolean(busyItem) || clearing}
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item,
                                    details.quantity + 1,
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-r-full transition hover:bg-[#F3E8D3] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={Boolean(busyItem) || clearing}
                              onClick={() => handleRemoveItem(item)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#928176] transition hover:text-red-700 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-[11px] text-[#928176]">
                        <Check size={13} className="text-[#718263]" />
                        Price: {formatPrice(details.price)} per item
                      </div>
                    </article>
                  );
                })}
              </div>

              <Link
                to="/products"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#8A6C5F] transition hover:text-[#544339]"
              >
                <ArrowLeft size={15} />
                Continue shopping
              </Link>
            </section>

            {/* Order summary */}
            <aside className="lg:sticky lg:top-6">
              <div className="overflow-hidden rounded-2xl border border-[#E0D9CF] bg-white shadow-sm">
                <div className="border-b border-[#E0D9CF] bg-[#F3E8D3]/40 px-6 py-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8A6C5F]">
                    YOUR ORDER
                  </p>
                  <h2 className="mt-2 font-serif text-2xl">Order summary</h2>
                </div>

                <div className="space-y-4 px-6 py-6">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-[#78675C]">
                      Subtotal ({items.length}{" "}
                      {items.length === 1 ? "item" : "items"})
                    </span>
                    <span className="font-medium">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-[#78675C]">Delivery</span>
                    <span className="text-xs font-medium text-[#718263]">
                      Calculated at checkout
                    </span>
                  </div>

                  <div className="border-t border-dashed border-[#E0D9CF]" />

                  <div className="flex items-center justify-between gap-3">
                    <span className="font-serif text-xl">Estimated total</span>
                    <span className="text-2xl font-semibold">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>

                  <p className="text-[11px] leading-5 text-[#928176]">
                    Final delivery charges depend on your store's shipping
                    settings.
                  </p>

                  <Link
                    to="/checkout"
                    className="flex w-full items-center justify-center gap-3 rounded-full bg-[#544339] px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#8A6C5F]"
                  >
                    Proceed to checkout
                    <ArrowRight size={16} />
                  </Link>

                  <div className="flex items-start gap-2 pt-2 text-[11px] leading-5 text-[#928176]">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 shrink-0 text-[#8A6C5F]"
                    />
                    <p>
                      Review your delivery details and order before confirming
                      your purchase.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#E0D9CF] bg-white/60 p-4">
                <Truck size={19} className="mt-0.5 shrink-0 text-[#8A6C5F]" />
                <div>
                  <p className="text-xs font-semibold">Delivery, made simple</p>
                  <p className="mt-1 text-xs leading-5 text-[#928176]">
                    Enter your address at checkout to complete your order.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default Cart;
