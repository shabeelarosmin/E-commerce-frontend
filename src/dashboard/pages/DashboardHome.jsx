import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getAdminProducts } from "../../api/productApi";
import { getAllOrders } from "../../api/orderApi";
import { getProductVariants } from "../../api/productVariantApi";

function DashboardHome() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const results = await Promise.allSettled([
        getAdminProducts(),
        getAllOrders(),
        getProductVariants(),
      ]);

      const getList = (result) => {
        if (result.status !== "fulfilled") return [];

        const response = result.value;
        const data = response?.data?.data ?? response?.data ?? response;

        return Array.isArray(data) ? data : [];
      };

      setProducts(getList(results[0]));
      setOrders(getList(results[1]));
      setVariants(getList(results[2]));

      if (results.every((result) => result.status === "rejected")) {
        setError(
          "Unable to load dashboard data. Please check your login and API connection.",
        );
      } else if (results.some((result) => result.status === "rejected")) {
        setError(
          "Some dashboard information could not be loaded. Please check the API connection."
        );
      }
    } catch {
      setError("Unable to load the dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const money = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const totalOrderValue = orders.reduce((total, order) => {
    const status = String(order.orderStatus || "").toLowerCase();

    if (["cancelled", "canceled"].includes(status)) return total;

    return total + Number(order.totalAmount || order.totalPrice || 0);
  }, 0);

  const pendingOrders = orders.filter((order) =>
    ["placed", "pending"].includes(
      String(order.orderStatus || "").toLowerCase(),
    ),
  ).length;

  const lowStockVariants = variants.filter(
    (variant) => Number(variant.stockQuantity || 0) <= 5,
  );

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    )
    .slice(0, 5);

  const statusStyle = (status) => {
    const value = String(status || "placed").toLowerCase();

    if (value === "delivered")
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    if (["cancelled", "canceled"].includes(value))
      return "bg-rose-50 text-rose-700 ring-rose-200";

    if (value === "shipped") return "bg-sky-50 text-sky-700 ring-sky-200";

    if (["confirmed", "processing"].includes(value))
      return "bg-blue-50 text-blue-700 ring-blue-200";

    return "bg-amber-50 text-amber-800 ring-amber-200";
  };

  const statusLabel = (status) => {
    const value = String(status || "placed");
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const panelClass =
    "overflow-hidden rounded-2xl border border-[#e9dfd3] bg-[#fffdf9] shadow-[0_8px_30px_rgba(70,48,30,0.035)]";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#f7f3ed] text-[#806b57]">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#e7d9c8] border-t-[#51392b]" />
        <p className="text-sm">Preparing your dashboard...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-4 py-6 sm:px-6 lg:px-9 lg:py-9">
      <div className="mx-auto max-w-[1600px] space-y-7">
        {/* PAGE HEADER */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-[10px] font-extrabold tracking-[2.5px] text-[#a17b50]">
              ÉLORA / ADMINISTRATION
            </p>

            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#39291f] sm:text-4xl">
              Dashboard Overview
            </h1>

            <p className="mt-2 text-sm text-[#8d8177]">
              Welcome back! Here is an overview of your fashion store.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#51392b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6b4b37] focus:outline-none focus:ring-4 focus:ring-[#51392b]/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-lg">↻</span>
            {refreshing ? "Refreshing..." : "Refresh Dashboard"}
          </button>
        </header>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-[#edcfca] bg-[#fff3f1] px-4 py-3 text-sm text-[#a23d32]"
          >
            <span className="font-bold">!</span>
            <span>{error}</span>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <StatCard
            symbol="✦"
            caption="CATALOG"
            title="Total Products"
            value={products.length}
            note="Products in your store"
            link="/dashboard/products"
            linkText="Manage products"
          />

          <StatCard
            symbol="◇"
            caption="SALES"
            title="Total Orders"
            value={orders.length}
            note={`${pendingOrders} awaiting confirmation`}
            link="/dashboard/orders"
            linkText="View orders"
          />

          <StatCard
            symbol="◈"
            caption="INVENTORY"
            title="Product Variants"
            value={variants.length}
            note="Sizes and color options"
            link="/dashboard/product-variants"
            linkText="Manage variants"
          />

          <StatCard
            symbol="₹"
            caption="ORDER VALUE"
            title="Total Order Value"
            value={money(totalOrderValue)}
            note="Excluding cancelled orders"
            link="/dashboard/orders"
            linkText="View sales"
            dark
          />
        </section>

        {/* RECENT ORDERS + INVENTORY */}
        <section className="grid grid-cols-1 items-start gap-6 2xl:grid-cols-[1.65fr_1fr]">
          {/* RECENT ORDERS */}
          <div className={panelClass}>
            <div className="flex items-center justify-between gap-4 border-b border-[#eee5da] px-5 py-6 sm:px-7">
              <div>
                <p className="mb-2 text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
                  LATEST ACTIVITY
                </p>

                <h2 className="font-serif text-2xl text-[#39291f]">
                  Recent Orders
                </h2>

                <p className="mt-2 text-sm text-[#958579]">
                  Keep track of your latest customer orders.
                </p>
              </div>

              <Link
                to="/dashboard/orders"
                className="shrink-0 text-xs font-bold text-[#8d6844] transition hover:text-[#51392b]"
              >
                View all →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <EmptyState
                symbol="◇"
                title="No orders yet"
                description="New orders will appear here."
              />
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="bg-[#faf6f0]">
                      {["Order", "Customer", "Amount", "Status"].map(
                        (heading) => (
                          <th
                            key={heading}
                            className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[1.2px] text-[#8e7864]"
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#f0e8de]">
                    {recentOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="transition hover:bg-[#fcf8f2]"
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-bold text-[#76583d]">
                            #
                            {String(order._id || "")
                              .slice(-6)
                              .toUpperCase()}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-[#51392b]">
                            {order.customerId?.name ||
                              order.customer?.name ||
                              "Customer"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-[#51392b]">
                            {money(order.totalAmount || order.totalPrice)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 ring-inset ${statusStyle(order.orderStatus)}`}
                          >
                            {statusLabel(order.orderStatus)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* INVENTORY ALERT */}
          <aside className={panelClass}>
            <div className="flex items-start justify-between gap-3 border-b border-[#eee5da] px-5 py-6 sm:px-7">
              <div>
                <p className="mb-2 text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
                  STOCK OVERVIEW
                </p>

                <h2 className="font-serif text-2xl text-[#39291f]">
                  Inventory Alert
                </h2>

                <p className="mt-2 text-sm text-[#958579]">
                  Variants with five or fewer units.
                </p>
              </div>

              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5ede2] text-xl text-[#9a774f]">
                ◈
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#eee5da] bg-[#faf6f0] px-5 py-4 sm:px-7">
              <span className="text-sm text-[#806b57]">Low-stock variants</span>

              <span
                className={`font-serif text-2xl ${
                  lowStockVariants.length > 0
                    ? "text-[#b65c46]"
                    : "text-[#50754b]"
                }`}
              >
                {lowStockVariants.length}
              </span>
            </div>

            {lowStockVariants.length === 0 ? (
              <div className="m-5 flex items-center gap-3 rounded-xl border border-[#dce8d6] bg-[#f3f8ef] p-4 sm:m-7">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e0ecd9] text-lg text-[#50754b]">
                  ✓
                </span>

                <div>
                  <p className="text-sm font-semibold text-[#50754b]">
                    Stock looks good
                  </p>
                  <p className="mt-1 text-xs text-[#7b9274]">
                    No low-stock variants found.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#f0e8de] px-5 sm:px-7">
                {lowStockVariants.slice(0, 5).map((variant) => {
                  const stock = Number(variant.stockQuantity || 0);

                  return (
                    <div
                      className="flex items-center gap-3 py-4"
                      key={variant._id}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#eadcc9] bg-[#f7efe4] text-[#9a774f]">
                        ✦
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#51392b]">
                          {variant.ProductId?.name ||
                            variant.productId?.name ||
                            "Product variant"}
                        </p>

                        <p className="mt-1 text-xs text-[#958579]">
                          {[variant.size, variant.color]
                            .filter(Boolean)
                            .join(" · ") || "Variant"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${
                          stock === 0
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {stock === 0 ? "Out of stock" : `${stock} left`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-5 pt-0 sm:px-7 sm:pb-7">
              <Link
                to="/dashboard/product-variants"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfd1c0] bg-[#fffdf9] px-4 py-3 text-sm font-semibold text-[#654b37] transition hover:bg-[#f5ede2]"
              >
                Manage inventory →
              </Link>
            </div>
          </aside>
        </section>

        {/* QUICK ACTIONS */}
        <section>
          <div className="mb-5">
            <p className="mb-2 text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
              QUICK ACCESS
            </p>

            <h2 className="font-serif text-2xl text-[#39291f] sm:text-3xl">
              Manage Your Store
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            <QuickLink
              to="/dashboard/products"
              symbol="✦"
              title="Products"
              description="Add and manage your clothing catalog."
            />

            <QuickLink
              to="/dashboard/product-variants"
              symbol="◈"
              title="Product Variants"
              description="Update sizes, colors, prices and stock."
            />

            <QuickLink
              to="/dashboard/orders"
              symbol="◇"
              title="Orders"
              description="Review orders and update their status."
            />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col items-center justify-between gap-2 border-t border-[#e6dbce] pt-5 text-[10px] font-semibold tracking-[1.5px] text-[#9a8877] sm:flex-row">
          <span>ÉLORA · FASHION ADMIN</span>
          <span>DESIGNED WITH CARE ✦</span>
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  symbol,
  caption,
  title,
  value,
  note,
  link,
  linkText,
  dark = false,
}) {
  return (
    <article
      className={
        dark
          ? "rounded-2xl border border-[#51392b] bg-[#51392b] p-5 text-white shadow-[0_8px_25px_rgba(70,48,30,0.10)] sm:p-6"
          : "rounded-2xl border border-[#e9dfd3] bg-[#fffdf9] p-5 shadow-[0_8px_25px_rgba(70,48,30,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(70,48,30,0.07)] sm:p-6"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${
            dark ? "bg-white/10 text-[#e7c79e]" : "bg-[#f5ede2] text-[#9a774f]"
          }`}
        >
          {symbol}
        </span>

        <span
          className={`text-[9px] font-extrabold tracking-[1.5px] ${
            dark ? "text-white/50" : "text-[#b19a81]"
          }`}
        >
          {caption}
        </span>
      </div>

      <p
        className={`mt-5 text-sm font-medium ${
          dark ? "text-white/70" : "text-[#8d8177]"
        }`}
      >
        {title}
      </p>

      <h2
        className={`mt-2 break-words font-serif text-3xl ${
          dark ? "text-white" : "text-[#39291f]"
        }`}
      >
        {value}
      </h2>

      <p
        className={`mt-2 text-xs ${dark ? "text-white/55" : "text-[#a09284]"}`}
      >
        {note}
      </p>

      <Link
        to={link}
        className={`mt-5 inline-flex items-center gap-2 text-xs font-bold transition ${
          dark
            ? "text-[#e7c79e] hover:text-white"
            : "text-[#8d6844] hover:text-[#51392b]"
        }`}
      >
        {linkText} →
      </Link>
    </article>
  );
}

function EmptyState({ symbol, title, description }) {
  return (
    <div className="px-5 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#eadcc9] bg-[#f7efe4] font-serif text-2xl text-[#9a774f]">
        {symbol}
      </span>

      <h3 className="mt-4 font-serif text-xl text-[#51392b]">{title}</h3>

      <p className="mt-2 text-sm text-[#958579]">{description}</p>
    </div>
  );
}

function QuickLink({ to, symbol, title, description }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-[#e9dfd3] bg-[#fffdf9] p-5 transition hover:-translate-y-1 hover:border-[#d8c2a7] hover:shadow-[0_12px_30px_rgba(70,48,30,0.07)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#eadcc9] bg-[#f7efe4] text-xl text-[#9a774f] transition group-hover:bg-[#51392b] group-hover:text-white">
          {symbol}
        </span>

        <span className="text-lg text-[#b19a81] transition group-hover:translate-x-1 group-hover:text-[#51392b]">
          ↗
        </span>
      </div>

      <h3 className="mt-5 font-serif text-xl text-[#51392b]">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-[#958579]">{description}</p>

      <p className="mt-5 text-xs font-bold text-[#8d6844]">
        Open page <span className="ml-1">→</span>
      </p>
    </Link>
  );
}

export default DashboardHome;
