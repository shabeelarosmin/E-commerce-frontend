import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, UserRound, ShoppingBag, Menu, X } from "lucide-react";

function Navbar() {
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleSearch = (e) => {
    e.preventDefault();

    const query = search.trim();

    if (query) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
      setSearch("");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#E0D9CF] bg-[#F8F4EE]/95 backdrop-blur-md">
      {/* Announcement bar */}
      <div className="bg-[#544339] px-4 py-2 text-center text-[10px] tracking-[2px] text-white sm:text-xs">
        EFFORTLESS STYLE, EVERY DAY
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Mobile menu */}
          <button
            type="button"
            onClick={() => setMobileMenu(!mobileMenu)}
            className="text-[#544339] md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenu ? <X size={23} /> : <Menu size={23} />}
          </button>

          {/* Logo */}
          <Link to="/" className="shrink-0">
            <span className="font-serif text-3xl tracking-[5px] text-[#544339] sm:text-4xl">
              ÉLORA
            </span>
            <span className="mt-1 block text-center text-[8px] tracking-[3px] text-[#8A6C5F]">
              YOUR EVERYDAY ELEGANCE
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-7 md:flex">
            <Link
              to="/"
              className="text-xs tracking-[1.5px] text-[#544339] transition hover:text-[#8A6C5F]"
            >
              HOME
            </Link>

            <Link
              to="/products"
              className="text-xs tracking-[1.5px] text-[#544339] transition hover:text-[#8A6C5F]"
            >
              SHOP ALL
            </Link>

            <Link
              to="/products?category=new"
              className="text-xs tracking-[1.5px] text-[#544339] transition hover:text-[#8A6C5F]"
            >
              NEW ARRIVALS
            </Link>
          </nav>

          {/* Search, profile, cart */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Desktop search */}
            <form
              onSubmit={handleSearch}
              className="hidden h-10 items-center border-b border-[#BFA38A] lg:flex"
            >
              <Search size={17} className="text-[#8A6C5F]" />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-32 bg-transparent px-2 text-sm text-[#544339] outline-none placeholder:text-[#A39183] xl:w-44"
                aria-label="Search products"
              />

              <button
                type="submit"
                className="text-xs tracking-wider text-[#544339] hover:text-[#8A6C5F]"
              >
                SEARCH
              </button>
            </form>

            {/* Mobile search */}
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="text-[#544339] lg:hidden"
              aria-label="Search products"
            >
              <Search size={21} strokeWidth={1.5} />
            </button>

            {/* Profile */}
            <Link
              to={token ? "/profile" : "/login"}
              className="flex flex-col items-center gap-1 text-[#544339] transition hover:text-[#8A6C5F]"
              aria-label="Profile"
            >
              <UserRound size={21} strokeWidth={1.5} />
              <span className="hidden text-[9px] tracking-wider sm:block">
                PROFILE
              </span>
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex flex-col items-center gap-1 text-[#544339] transition hover:text-[#8A6C5F]"
              aria-label="Shopping cart"
            >
              <ShoppingBag size={21} strokeWidth={1.5} />
              <span className="hidden text-[9px] tracking-wider sm:block">
                CART
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <form
          onSubmit={handleSearch}
          className="mb-4 flex h-10 items-center border-b border-[#BFA38A] lg:hidden"
        >
          <Search size={17} className="text-[#8A6C5F]" />

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your style..."
            className="w-full bg-transparent px-3 text-sm text-[#544339] outline-none placeholder:text-[#A39183]"
            aria-label="Search products"
          />

          <button
            type="submit"
            className="text-xs tracking-wider text-[#544339]"
          >
            GO
          </button>
        </form>

        {/* Mobile navigation */}
        {mobileMenu && (
          <nav className="flex flex-col border-t border-[#E0D9CF] py-3 md:hidden">
            <Link
              to="/"
              onClick={() => setMobileMenu(false)}
              className="py-3 text-xs tracking-[2px] text-[#544339]"
            >
              HOME
            </Link>

            <Link
              to="/products"
              onClick={() => setMobileMenu(false)}
              className="py-3 text-xs tracking-[2px] text-[#544339]"
            >
              SHOP ALL
            </Link>

            <Link
              to="/products?category=new"
              onClick={() => setMobileMenu(false)}
              className="py-3 text-xs tracking-[2px] text-[#544339]"
            >
              NEW ARRIVALS
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Navbar;
