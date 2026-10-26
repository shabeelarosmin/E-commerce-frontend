import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/dashboard/customer";

const getAdminAuthConfig = () => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin login required. Please log in again.");
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [error, setError] = useState("");

  const fetchCustomers = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      }

      const response = await axios.get(API_URL, getAdminAuthConfig());

      const responseData = response.data?.data ?? response.data;

      const customerList = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.customers)
          ? responseData.customers
          : [];

      setCustomers(customerList);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load customers.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedCustomer(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getCustomerName = (customer) =>
    customer.name || customer.fullName || "Unnamed Customer";

  const getInitials = (customer) =>
    getCustomerName(customer)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");

  const getAddress = (customer) => {
    const address = customer.address;

    if (typeof address === "string") {
      return address;
    }

    if (address && typeof address === "object") {
      return [
        address.addressLine,
        address.address,
        address.street,
        address.city,
        address.state,
        address.pincode || address.postalCode,
      ]
        .filter(Boolean)
        .join(", ");
    }

    return [
      customer.addressLine,
      customer.street,
      customer.city,
      customer.state,
      customer.pincode || customer.postalCode,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const name = getCustomerName(customer).toLowerCase();
      const email = (customer.email || "").toLowerCase();
      const phone = String(customer.phone || customer.mobile || "");
      const active = customer.active !== false;

      const matchesSearch =
        !query ||
        name.includes(query) ||
        email.includes(query) ||
        phone.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const activeCount = customers.filter(
    (customer) => customer.active !== false,
  ).length;

  const inactiveCount = customers.length - activeCount;

  const inputClass =
    "w-full rounded-xl border border-[#e6dacb] bg-[#fffefa] px-4 py-3 text-sm text-[#463326] outline-none transition placeholder:text-[#b3a496] focus:border-[#9b774f] focus:ring-4 focus:ring-[#9b774f]/10";

  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#51392b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6b4b37] focus:outline-none focus:ring-4 focus:ring-[#51392b]/15 disabled:cursor-not-allowed disabled:opacity-60";

  const secondaryButton =
    "inline-flex items-center justify-center rounded-lg border border-[#e5d7c5] bg-[#fffdf9] px-3 py-2 text-xs font-semibold text-[#654a35] transition hover:bg-[#f5ede3]";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#f7f3ed] text-[#806b57]">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#e7d9c8] border-t-[#51392b]" />
        <p className="text-sm">Loading customers...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-4 py-6 sm:px-6 lg:px-9 lg:py-9">
      <div className="mx-auto max-w-[1500px] space-y-7">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-[10px] font-extrabold tracking-[2.5px] text-[#a17b50]">
              ÉLORA / CUSTOMER RELATIONS
            </p>

            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#39291f] sm:text-4xl">
              Customers Management
            </h1>

            <p className="mt-2 text-sm text-[#8d8177]">
              View your customers and their contact information.
            </p>
          </div>

          <button
            type="button"
            className={buttonClass}
            onClick={() => fetchCustomers(true)}
            disabled={refreshing}
          >
            <span className="text-lg">↻</span>
            {refreshing ? "Refreshing..." : "Refresh Customers"}
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-[#edcfca] bg-[#fff3f1] px-4 py-3 text-sm text-[#a23d32]"
          >
            <span className="font-bold">!</span>
            <span>{error}</span>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            symbol="♙"
            title="Total Customers"
            value={customers.length}
            note="All registered customers"
          />

          <StatCard
            symbol="✦"
            title="Active Customers"
            value={activeCount}
            note="Currently active accounts"
          />

          <StatCard
            symbol="◇"
            title="Inactive Customers"
            value={inactiveCount}
            note="Inactive accounts"
            dark
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e9dfd3] bg-[#fffdf9] shadow-[0_8px_30px_rgba(70,48,30,0.035)]">
          <div className="flex flex-col justify-between gap-5 border-b border-[#eee5da] px-5 py-6 sm:flex-row sm:items-center sm:px-8">
            <div>
              <p className="mb-2 text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
                CUSTOMER DIRECTORY
              </p>

              <h2 className="font-serif text-2xl text-[#39291f]">
                All Customers
              </h2>

              <p className="mt-2 text-sm text-[#958579]">
                Showing {filteredCustomers.length} of {customers.length}{" "}
                customers
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:max-w-[520px] sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#a18e7b]">
                  ⌕
                </span>

                <input
                  type="search"
                  placeholder="Search name, email or phone..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search customers"
                  className={`${inputClass} pl-10`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter customer status"
                className={`${inputClass} sm:w-40`}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#eadcc9] bg-[#f7efe4] font-serif text-3xl text-[#9a774f]">
                ♙
              </span>

              <h3 className="mt-5 font-serif text-xl text-[#51392b]">
                {customers.length === 0
                  ? "No customers yet"
                  : "No customers found"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-[#958579]">
                {customers.length === 0
                  ? "Registered customers will appear here."
                  : "Try a different search term or status filter."}
              </p>

              {(search || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className={`${secondaryButton} mt-5`}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#faf6f0]">
                    {[
                      "Customer",
                      "Contact",
                      "Address",
                      "Status",
                      "Details",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[1.3px] text-[#8e7864]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0e8de]">
                  {filteredCustomers.map((customer) => {
                    const active = customer.active !== false;

                    return (
                      <tr
                        key={customer._id}
                        className="transition hover:bg-[#fcf8f2]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e7d6c0] bg-[#f4e9d9] font-serif text-sm font-bold text-[#76583d]">
                              {getInitials(customer) || "?"}
                            </span>

                            <div>
                              <p className="text-sm font-semibold text-[#51392b]">
                                {getCustomerName(customer)}
                              </p>

                              <p className="mt-1 text-[10px] tracking-wide text-[#a09284]">
                                ID: {String(customer._id || "").slice(-6)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            <p className="text-sm text-[#594537]">
                              {customer.email || "No email"}
                            </p>
                            <p className="text-xs text-[#9b8b7d]">
                              {customer.phone || customer.mobile || "No phone"}
                            </p>
                          </div>
                        </td>

                        <td className="max-w-[240px] px-5 py-4">
                          <p className="line-clamp-2 text-sm leading-6 text-[#8d8177]">
                            {getAddress(customer) || "Address not provided"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={
                              active
                                ? "inline-flex items-center gap-2 rounded-full bg-[#edf5e9] px-3 py-1.5 text-xs font-semibold text-[#50754b]"
                                : "inline-flex items-center gap-2 rounded-full bg-[#f7e9e5] px-3 py-1.5 text-xs font-semibold text-[#a35b4d]"
                            }
                          >
                            <span
                              className={
                                active
                                  ? "h-1.5 w-1.5 rounded-full bg-[#6d9565]"
                                  : "h-1.5 w-1.5 rounded-full bg-[#bb7566]"
                              }
                            />
                            {active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            className={secondaryButton}
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            View Details <span className="ml-1">↗</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-[#e6dbce] pt-5 text-[10px] font-semibold tracking-[1.5px] text-[#9a8877] sm:flex-row">
          <span>ÉLORA · CUSTOMER MANAGEMENT</span>
          <span>DESIGNED WITH CARE ✦</span>
        </footer>
      </div>

      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#24170f]/55 p-4 backdrop-blur-[3px]"
          onClick={() => setSelectedCustomer(null)}
          role="presentation"
        >
          <section
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#e9dfd3] bg-[#fffdf9] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#eee5da] px-6 py-6 sm:px-8">
              <div>
                <p className="mb-2 text-[10px] font-extrabold tracking-[2px] text-[#a17b50]">
                  CUSTOMER PROFILE
                </p>

                <h2
                  id="customer-modal-title"
                  className="font-serif text-2xl text-[#39291f]"
                >
                  {getCustomerName(selectedCustomer)}
                </h2>

                <p className="mt-2 text-xs text-[#a09284]">
                  Customer ID: {String(selectedCustomer._id || "").slice(-6)}
                </p>
              </div>

              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e8dccc] text-2xl leading-none text-[#76583d] transition hover:bg-[#f5ede3]"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close customer details"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-7 sm:px-8">
              <div className="mb-7 flex flex-col items-center rounded-xl bg-[#f7f0e6] px-5 py-7 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#dfc8a9] bg-[#ead8bf] font-serif text-2xl font-semibold text-[#654a35]">
                  {getInitials(selectedCustomer) || "?"}
                </span>

                <h3 className="mt-4 font-serif text-xl text-[#51392b]">
                  {getCustomerName(selectedCustomer)}
                </h3>

                <span
                  className={
                    selectedCustomer.active !== false
                      ? "mt-3 rounded-full bg-[#e6f0e1] px-3 py-1 text-xs font-semibold text-[#50754b]"
                      : "mt-3 rounded-full bg-[#f5e5e1] px-3 py-1 text-xs font-semibold text-[#a35b4d]"
                  }
                >
                  {selectedCustomer.active !== false
                    ? "Active Account"
                    : "Inactive Account"}
                </span>
              </div>

              <div>
                <DetailRow
                  label="Email Address"
                  value={selectedCustomer.email || "Not provided"}
                />

                <DetailRow
                  label="Phone Number"
                  value={
                    selectedCustomer.phone ||
                    selectedCustomer.mobile ||
                    "Not provided"
                  }
                />

                <DetailRow
                  label="Address"
                  value={getAddress(selectedCustomer) || "Not provided"}
                />

                <DetailRow
                  label="Account Status"
                  value={
                    selectedCustomer.active !== false ? "Active" : "Inactive"
                  }
                />
              </div>

              <button
                type="button"
                className={`${buttonClass} mt-7 w-full`}
                onClick={() => setSelectedCustomer(null)}
              >
                Close Details
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({ symbol, title, value, note, dark = false }) {
  return (
    <article
      className={
        dark
          ? "rounded-2xl border border-[#51392b] bg-[#51392b] p-5 text-white shadow-[0_8px_25px_rgba(70,48,30,0.10)] sm:p-6"
          : "rounded-2xl border border-[#e9dfd3] bg-[#fffdf9] p-5 shadow-[0_8px_25px_rgba(70,48,30,0.035)] sm:p-6"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={
            dark
              ? "text-sm font-medium text-white/70"
              : "text-sm font-medium text-[#8d8177]"
          }
        >
          {title}
        </p>

        <span
          className={
            dark
              ? "flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl text-[#e7c79e]"
              : "flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5ede2] text-xl text-[#9a774f]"
          }
        >
          {symbol}
        </span>
      </div>

      <h2
        className={
          dark
            ? "mt-5 font-serif text-4xl text-white"
            : "mt-5 font-serif text-4xl text-[#39291f]"
        }
      >
        {value}
      </h2>

      <p
        className={
          dark ? "mt-2 text-xs text-white/60" : "mt-2 text-xs text-[#a09284]"
        }
      >
        {note}
      </p>
    </article>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-[#eee5da] py-4 sm:grid-cols-[130px_1fr] sm:gap-4">
      <span className="text-xs font-medium text-[#9b8b7d]">{label}</span>

      <strong className="break-words text-sm font-medium leading-6 text-[#51392b]">
        {value}
      </strong>
    </div>
  );
}

export default Customers;
