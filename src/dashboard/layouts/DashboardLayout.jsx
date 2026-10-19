import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const sidebarContent = (
    <>
      <div className="flex h-[88px] items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c5a46d]/50 bg-[#c5a46d]/10 font-serif text-2xl text-[#d6b77d]">
          É
        </div>

        <div>
          <h1 className="font-serif text-2xl tracking-[0.2em] text-[#f6ead7]">
            ÉLORA
          </h1>
          <p className="mt-1 text-[9px] font-medium tracking-[0.28em] text-[#c5a46d]">
            FASHION STORE
          </p>
        </div>
      </div>

      <div className="mx-6 mt-6 h-px bg-white/10" />

      <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-7">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] text-[#a9957c]">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] transition-all duration-200 ${
                      isActive
                        ? "bg-[#c5a46d] font-semibold text-[#302116] shadow-md shadow-black/10"
                        : "text-[#d2c5b4] hover:bg-white/[0.07] hover:text-white"
                    }`
                  }
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg text-lg transition">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>

                  {location.pathname === item.path && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#493426]" />
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="m-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#c5a46d]" />
          <p className="text-[10px] font-semibold tracking-[0.15em] text-[#d6b77d]">
            ÉLORA ADMIN
          </p>
        </div>
        <p className="font-serif text-sm italic text-[#e3d6c5]">
          Great fashion builds confidence.
        </p>
        <p className="mt-2 text-[10px] text-[#a9957c]">
          Manage your store with elegance.
        </p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#38291f]">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#302116] transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      <div className="min-h-screen lg:pl-[270px]">
        <header className="sticky top-0 z-30 border-b border-[#e9dfd1] bg-[#fffdf9]/95 backdrop-blur-md">
          <div className="flex min-h-[88px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation menu"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e9dfd1] text-xl text-[#493426] hover:bg-[#f3ece1] lg:hidden"
              >
                ☰
              </button>

              <div className="min-w-0">
                <p className="mb-1 text-[9px] font-semibold tracking-[0.22em] text-[#a18455] sm:text-[10px]">
                  ÉLORA <span className="mx-1 text-[#d5c6b3]">/</span> ADMIN
                </p>
                <h2 className="truncate font-serif text-lg font-semibold text-[#38291f] sm:text-2xl">
                  {currentTitle}
                </h2>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 sm:gap-5">
              <div className="hidden text-right sm:block">
                <p className="text-[13px] font-semibold text-[#493426]">
                  {adminName}
                </p>
                <p className="mt-1 max-w-[180px] truncate text-[11px] text-[#978777]">
                  {adminEmail}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#c5a46d]/60 bg-[#493426] font-serif text-lg text-[#f5e4c3]">
                É
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-[#e5d8c5] px-3 py-2.5 text-xs font-semibold text-[#493426] transition hover:border-[#493426] hover:bg-[#493426] hover:text-white sm:px-4 sm:text-sm"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">↗</span>
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-88px)] p-4 sm:p-7 lg:p-9">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>

        <footer className="border-t border-[#e9dfd1] px-5 py-4 sm:px-9">
          <p className="text-center text-[10px] tracking-wide text-[#a09282] sm:text-left">
            © {new Date().getFullYear()} ÉLORA Fashion Store. Crafted with
            elegance.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default DashboardLayout;
