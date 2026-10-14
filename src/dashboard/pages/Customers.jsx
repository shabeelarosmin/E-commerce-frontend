import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/dashboard/customer";

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

      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

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
          "Customers load ചെയ്യാൻ കഴിഞ്ഞില്ല. Login, API route എന്നിവ പരിശോധിക്കുക.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const name = customer.name || customer.fullName || "";
      const email = customer.email || "";
      const phone = customer.phone || customer.mobile || "";

      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        String(phone).toLowerCase().includes(query);

      const active = customer.active !== false;

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

  const getCustomerName = (customer) =>
    customer.name || customer.fullName || "Unnamed Customer";

  const getInitials = (customer) => {
    const name = getCustomerName(customer);

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  const getAddress = (customer) => {
    const address = customer.address;

    if (typeof address === "string") {
      return address;
    }

    if (address && typeof address === "object") {
      return [
        address.address,
        address.city,
        address.state,
        address.pincode || address.postalCode,
      ]
        .filter(Boolean)
        .join(", ");
    }

    return [
      customer.street,
      customer.city,
      customer.state,
      customer.pincode || customer.postalCode,
    ]
      .filter(Boolean)
      .join(", ");
  };

  if (loading) {
    return (
      <div className="fashion-loading">
        <span className="fashion-spinner" />
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <main className="customers-page">
      {/* HEADER */}
      <header className="products-header">
        <div>
          <p className="fashion-eyebrow">ÉLORA/ CUSTOMER RELATIONS</p>
          <h1>Customers Management</h1>
          <p className="fashion-subtitle">
            View your customers and their contact information.
          </p>
        </div>

        <button
          type="button"
          className="fashion-button"
          onClick={() => fetchCustomers(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh Customers"}
        </button>
      </header>

      {error && (
        <div className="fashion-alert error" role="alert">
          {error}
        </div>
      )}

      {/* SUMMARY */}
      <section className="fashion-stats">
        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">♙</span>
          <p>Total Customers</p>
          <h2>{customers.length}</h2>
          <span className="fashion-stat-note">All registered customers</span>
        </article>

        <article className="fashion-stat-card">
          <span className="fashion-stat-icon">✦</span>
          <p>Active Customers</p>
          <h2>{activeCount}</h2>
          <span className="fashion-stat-note">Currently active accounts</span>
        </article>

        <article className="fashion-stat-card dark-stat">
          <span className="fashion-stat-icon">◇</span>
          <p>Inactive Customers</p>
          <h2>{inactiveCount}</h2>
          <span className="fashion-stat-note">Inactive accounts</span>
        </article>
      </section>

      {/* CUSTOMER DIRECTORY */}
      <section className="fashion-card">
        <div className="fashion-section-heading">
          <div>
            <p className="fashion-eyebrow">CUSTOMER DIRECTORY</p>
            <h2>All Customers</h2>
            <p>
              {filteredCustomers.length} customers shown out of{" "}
              {customers.length}.
            </p>
          </div>
        </div>

        <div className="customers-filters">
          <input
            type="search"
            placeholder="Search name, email or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search customers"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter customer status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="fashion-empty">
            <span>♙</span>
            <h3>
              {customers.length === 0
                ? "No customers yet"
                : "No customers found"}
            </h3>
            <p>
              {customers.length === 0
                ? "Registered customers will appear here."
                : "Try a different search or status filter."}
            </p>
          </div>
        ) : (
          <div className="fashion-table-wrap">
            <table className="fashion-table customers-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td>
                      <div className="customer-name-cell">
                        <span className="customer-avatar">
                          {getInitials(customer)}
                        </span>

                        <div>
                          <strong>{getCustomerName(customer)}</strong>
                          <span className="customer-id">
                            ID: {String(customer._id || "").slice(-6)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="customer-contact">
                        <span>{customer.email || "No email"}</span>
                        <span>
                          {customer.phone || customer.mobile || "No phone"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="customer-address">
                        {getAddress(customer) || "Address not provided"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          customer.active !== false
                            ? "customer-status active"
                            : "customer-status inactive"
                        }
                      >
                        {customer.active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="fashion-button secondary small-button"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CUSTOMER DETAILS MODAL */}
      {selectedCustomer && (
        <div
          className="customer-modal-backdrop"
          onClick={() => setSelectedCustomer(null)}
          role="presentation"
        >
          <section
            className="customer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="customer-modal-header">
              <div>
                <p className="fashion-eyebrow">CUSTOMER PROFILE</p>
                <h2 id="customer-modal-title">
                  {getCustomerName(selectedCustomer)}
                </h2>
              </div>

              <button
                type="button"
                className="customer-close-button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close customer details"
              >
                ×
              </button>
            </div>

            <div className="customer-detail-avatar">
              {getInitials(selectedCustomer)}
            </div>

            <div className="customer-detail-row">
              <span>Email</span>
              <strong>{selectedCustomer.email || "Not provided"}</strong>
            </div>

            <div className="customer-detail-row">
              <span>Phone</span>
              <strong>
                {selectedCustomer.phone ||
                  selectedCustomer.mobile ||
                  "Not provided"}
              </strong>
            </div>

            <div className="customer-detail-row">
              <span>Address</span>
              <strong>{getAddress(selectedCustomer) || "Not provided"}</strong>
            </div>

            <div className="customer-detail-row">
              <span>Status</span>
              <strong>
                {selectedCustomer.active !== false ? "Active" : "Inactive"}
              </strong>
            </div>

            <button
              type="button"
              className="fashion-button customer-modal-done"
              onClick={() => setSelectedCustomer(null)}
            >
              Close Details
            </button>
          </section>
        </div>
      )}

      <footer className="fashion-footer">
        <span>ÉLORA · CUSTOMER MANAGEMENT</span>
        <span>Designed with care ✦</span>
      </footer>
    </main>
  );
}

export default Customers;
