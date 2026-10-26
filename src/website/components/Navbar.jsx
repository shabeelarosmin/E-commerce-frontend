import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  UserRound,
  ShoppingBag,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  LogOut,
  Heart,
} from "lucide-react";

function Navbar() {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    Boolean(localStorage.getItem("token")),
  );

  const navigate = useNavigate();

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("token")));
    };

    window.addEventListener("auth-change", syncAuth);
    window.addEventListener("storage", syncAuth);
    window.addEventListener("focus", syncAuth);

    return () => {
      window.removeEventListener("auth-change", syncAuth);
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
    };
  }, []);

  const closeMenus = () => {
    setMobileMenu(false);
    setSearchOpen(false);
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const query = search.trim();

    if (!query) return;

    navigate(`/products?search=${encodeURIComponent(query)}`);

    setSearch("");
    closeMenus();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    closeMenus();

    window.dispatchEvent(new Event("auth-change"));

    navigate("/", { replace: true });
  };

  const navItems = [
    { label: "HOME", to: "/" },
    { label: "SHOP ALL", to: "/products" },
    { label: "MY ORDERS", to: "/orders" },
    { label: "CATEGORIES", to: "/categories" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#E7DED3] bg-[#FCFAF6]/95 text-[#544339] shadow-[0_3px_20px_rgba(84,67,57,0.04)] backdrop-blur-xl">
      {/* Announcement bar */}
      <div className="flex items-center justify-center gap-2 bg-[#544339] px-3 py-2 text-center text-[9px] uppercase tracking-[2px] text-[#F8F4EE] sm:tracking-[3px]">
        <Sparkles size={11} className="text-[#C9AC91]" strokeWidth={1.3} />

        <span>Thoughtfully selected · Effortlessly elegant</span>

        <Sparkles size={11} className="text-[#C9AC91]" strokeWidth={1.3} />
      </div>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-7 lg:px-12">
        <div className="flex min-h-[82px] items-center justify-between gap-2 sm:min-h-[94px]">
          {/* Logo and mobile menu */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenu((prev) => !prev);
                setSearchOpen(false);
              }}
              className="mr-1 rounded-full p-2 transition hover:bg-[#F0E8DE] md:hidden"
              aria-label={mobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenu}
            >
              {mobileMenu ? (
                <X size={21} strokeWidth={1.5} />
              ) : (
                <Menu size={21} strokeWidth={1.5} />
              )}
            </button>

            <Link
              to="/"
              onClick={closeMenus}
              aria-label="ÉLORA Home"
              className="group flex items-center gap-2 sm:gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#c5a46d]/60 bg-[#493426] font-serif text-lg text-[#f5e4c3] sm:h-14 sm:w-14">
                É
              </div>

              <span className="flex flex-col items-start">
                <span className="font-serif text-[24px] font-bold leading-none tracking-[2px] text-[#493426] transition-colors group-hover:text-[#8A6C5F] sm:text-[35px] sm:tracking-[3px] lg:text-[39px]">
                  ÉLORA
                </span>

                <span className="mt-1.5 whitespace-nowrap text-[6px] font-semibold uppercase tracking-[1.2px] text-[#967D6D] sm:text-[8px] sm:tracking-[2.5px]">
                  Your everyday elegance
                </span>
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden items-center justify-center gap-5 md:flex lg:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={closeMenus}
                className="group relative whitespace-nowrap py-3 text-[9px] font-medium tracking-[1.3px] transition-colors hover:text-[#98765F] lg:text-[10px] lg:tracking-[1.8px]"
              >
                {item.label}

                <span className="absolute bottom-0 left-0 h-px w-0 bg-[#98765F] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right-side actions */}
          <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-1.5">
            {/* Search */}
            <button
              type="button"
              onClick={() => {
                setSearchOpen((prev) => !prev);
                setMobileMenu(false);
              }}
              className={`rounded-full p-2 transition hover:bg-[#F0E8DE] sm:p-3 ${
                searchOpen ? "bg-[#F0E8DE]" : ""
              }`}
              aria-label={searchOpen ? "Close search" : "Search products"}
              aria-expanded={searchOpen}
            >
              {searchOpen ? (
                <X size={19} strokeWidth={1.5} />
              ) : (
                <Search size={19} strokeWidth={1.5} />
              )}
            </button>

            {/* Favourites */}
            <Link
              to={isLoggedIn ? "/favourites" : "/login"}
              onClick={closeMenus}
              className="flex items-center justify-center rounded-full p-2 transition hover:bg-[#F0E8DE] sm:p-3"
              aria-label="My Favourites"
              title="Favourites"
            >
              <Heart size={20} strokeWidth={1.5} />
            </Link>

            {/* Profile */}
            <Link
              to={isLoggedIn ? "/profile" : "/login"}
              onClick={closeMenus}
              className="flex items-center justify-center rounded-full p-2 transition hover:bg-[#F0E8DE] sm:p-3"
              aria-label="My Account"
              title="My Account"
            >
              <UserRound size={20} strokeWidth={1.5} />
            </Link>

            {/* Shopping bag */}
            <Link
              to="/cart"
              onClick={closeMenus}
              className="flex items-center justify-center rounded-full p-2 transition hover:bg-[#F0E8DE] sm:p-3"
              aria-label="Shopping bag"
              title="Shopping bag"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
            </Link>

            {/* Sign In / Sign Out - always last */}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#544339] bg-[#544339] px-2.5 py-2.5 text-[9px] font-semibold tracking-wide text-[#F8F4EE] transition hover:border-[#8A6C5F] hover:bg-[#8A6C5F] sm:ml-2 sm:gap-2 sm:px-4 sm:text-[10px] sm:tracking-[1px]"
              >
                <LogOut size={14} />
                <span>SIGN OUT</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={closeMenus}
                className="ml-1 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#544339] bg-[#544339] px-2.5 py-2.5 text-[9px] font-semibold tracking-wide text-[#F8F4EE] transition hover:border-[#8A6C5F] hover:bg-[#8A6C5F] sm:ml-2 sm:gap-2 sm:px-4 sm:text-[10px] sm:tracking-[1px]"
              >
                <span>SIGN IN</span>
                <ArrowRight size={14} strokeWidth={1.6} />
              </Link>
            )}
          </div>
        </div>

        {/* Expandable search */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            searchOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <form
              onSubmit={handleSearch}
              className="mx-auto flex max-w-2xl items-center gap-3 border-t border-[#E7DED3] py-4"
            >
              <Search
                size={18}
                strokeWidth={1.5}
                className="shrink-0 text-[#98765F]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Discover something beautiful..."
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-[#B3A294]"
                aria-label="Search products"
              />

              <button
                type="submit"
                disabled={!search.trim()}
                className="flex items-center gap-2 text-[10px] font-semibold tracking-[1.5px] transition hover:text-[#98765F] disabled:opacity-40"
              >
                SEARCH <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Mobile navigation */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            mobileMenu
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <nav className="border-t border-[#E7DED3] py-2 md:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={closeMenus}
                  className="group flex items-center justify-between border-b border-[#E7DED3]/70 py-4 text-[10px] font-medium tracking-[2px] transition-colors last:border-b-0 hover:text-[#98765F]"
                >
                  {item.label}

                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              ))}

              {/* Mobile quick links */}
              <div className="grid grid-cols-2 gap-3 border-t border-[#E7DED3] py-4">
                <Link
                  to={isLoggedIn ? "/favourites" : "/login"}
                  onClick={closeMenus}
                  className="flex items-center justify-center gap-2 border border-[#E7DED3] px-3 py-3 text-[10px] tracking-wide transition hover:bg-[#F0E8DE]"
                >
                  <Heart size={17} />
                  FAVOURITES
                </Link>

                <Link
                  to={isLoggedIn ? "/profile" : "/login"}
                  onClick={closeMenus}
                  className="flex items-center justify-center gap-2 border border-[#E7DED3] px-3 py-3 text-[10px] tracking-wide transition hover:bg-[#F0E8DE]"
                >
                  <UserRound size={17} />
                  MY ACCOUNT
                </Link>

                <Link
                  to="/cart"
                  onClick={closeMenus}
                  className="flex items-center justify-center gap-2 border border-[#E7DED3] px-3 py-3 text-[10px] tracking-wide transition hover:bg-[#F0E8DE]"
                >
                  <ShoppingBag size={17} />
                  MY BAG
                </Link>

                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 border border-[#544339] bg-[#544339] px-3 py-3 text-[10px] font-semibold tracking-wide text-[#F8F4EE] transition hover:bg-[#8A6C5F]"
                  >
                    <LogOut size={14} />
                    SIGN OUT
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMenus}
                    className="flex items-center justify-center gap-2 border border-[#544339] bg-[#544339] px-3 py-3 text-[10px] font-semibold tracking-wide text-[#F8F4EE] transition hover:bg-[#8A6C5F]"
                  >
                    SIGN IN
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
