import { useLocation, useNavigate, NavLink } from "react-router-dom";

const menuGroups = [
  {
    title: "OVERVIEW",
    items: [{ label: "Dashboard Home", path: "/dashboard", icon: "⌂" }],
  },
  {
    title: "CATALOG",
    items: [
      { label: "Products", path: "/dashboard/products", icon: "✦" },
      {
        label: "Product Variants",
        path: "/dashboard/product-variants",
        icon: "◈",
      },
      { label: "Categories", path: "/dashboard/categories", icon: "◇" },
      { label: "Inventory", path: "/dashboard/inventory", icon: "▦" },
    ],
  },
  {
    title: "SALES",
    items: [
      { label: "Orders", path: "/dashboard/orders", icon: "▣" },
      { label: "Customers", path: "/dashboard/customers", icon: "♙" },
      { label: "Payments", path: "/dashboard/payments", icon: "₹" },
      { label: "Reports", path: "/dashboard/reports", icon: "▤" },
    ],
  },
];

const pageTitles = {
  "/dashboard": "Dashboard Overview",
  "/dashboard/products": "Products Management",
  "/dashboard/product-variants": "Product Variants",
  "/dashboard/categories": "Categories Management",
  "/dashboard/inventory": "Inventory Management",
  "/dashboard/orders": "Orders Management",
  "/dashboard/customers": "Customers Management",
  "/dashboard/payments": "Payments Management",
  "/dashboard/reports": "Sales Reports",
};

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  let adminUser = {};

  try {
    adminUser = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    adminUser = {};
  }

  const adminName = adminUser.name || "Administrator";
  const adminEmail = adminUser.email || "Admin Account";

  const currentTitle = pageTitles[location.pathname] || "Admin Dashboard";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-symbol">A</div>

          <div>
            <h2>ÉLORA</h2>
            <span>FASHION STORE</span>
          </div>
        </div>

        <div className="dashboard-sidebar-divider" />

        <nav className="dashboard-navigation">
          {menuGroups.map((group) => (
            <div className="dashboard-menu-group" key={group.title}>
              <p className="dashboard-menu-heading">{group.title}</p>

              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/dashboard"}
                  className={({ isActive }) =>
                    `dashboard-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="dashboard-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="dashboard-sidebar-footer">
          <p>Great fashion builds confidence.</p>
          <span>ÉLORA · ADMIN</span>
        </div>
      </aside>

      <div className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-title">
            <span>ÉLORA / ADMIN</span>
            <h2>{currentTitle}</h2>
          </div>

          <div className="dashboard-admin-profile">
            <div className="dashboard-admin-avatar">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div className="dashboard-admin-info">
              <strong>{adminName}</strong>
              <span>{adminEmail}</span>
            </div>

            <button
              type="button"
              className="dashboard-logout-button"
              onClick={handleLogout}
            >
              Logout ↗
            </button>
          </div>
        </header>

        <main className="dashboard-main-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
