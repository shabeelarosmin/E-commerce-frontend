import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getWebsiteProducts } from "../../api/productApi";

const API_BASE_URL = "http://localhost:8000";
const WISHLIST_KEY = "elora-favourites";

function getProductImage(product) {
  const firstImage = Array.isArray(product.images) ? product.images[0] : "";

  const image =
    product.imageUrl ||
    product.image ||
    (typeof firstImage === "string" ? firstImage : firstImage?.url) ||
    "";

  if (!image || typeof image !== "string") return "";
  if (/^https?:\/\//i.test(image)) return image;

  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
}

function getProductId(product) {
  return product._id || product.id;
}

function getProductPrice(product) {
  return Number(
    product.sellingPrice ??
      product.salePrice ??
      product.basePrice ??
      product.price ??
      0,
  );
}

function getOriginalPrice(product) {
  return Number(product.originalPrice ?? product.mrp ?? 0);
}

function getCategoryName(product) {
  if (typeof product.categoryId === "object" && product.categoryId) {
    return product.categoryId.name || "";
  }

  if (typeof product.category === "object" && product.category) {
    return product.category.name || "";
  }

  return (
    product.categoryName ||
    (typeof product.category === "string" ? product.category : "")
  );
}

function getWishlist() {
  try {
    const saved = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false);
  const image = getProductImage(product);

  useEffect(() => {
    setFailed(false);
  }, [image]);

  if (!image || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#EAE0D4] text-[#8A6C5F]">
        <span className="font-serif text-6xl">É</span>
        <span className="mt-3 text-[9px] tracking-[0.35em]">ÉLORA</span>
        <span className="mt-2 max-w-[80%] text-center font-serif text-sm">
          {product.name || "The Collection"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={product.name || "ÉLORA fashion"}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
  );
}

function ProductCard({ product, isWishlisted, onToggleWishlist, onQuickView }) {
  const id = getProductId(product);
  const price = getProductPrice(product);
  const originalPrice = getOriginalPrice(product);
  const category = getCategoryName(product);

  const isNew =
    product.isNew === true || product.label?.toLowerCase() === "new arrival";

  const isFeatured = product.featured === true || product.isFeatured === true;

  const isSale = originalPrice > price && price > 0;

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#EAE0D4]">
        <Link
          to={`/product/${id}`}
          aria-label={`View ${product.name}`}
          className="absolute inset-0"
        >
          <ProductImage product={product} />
        </Link>

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {isNew && (
            <span className="bg-[#544339] px-2.5 py-1.5 text-[8px] tracking-[0.15em] text-[#F8F4EE]">
              NEW ARRIVAL
            </span>
          )}

          {!isNew && isFeatured && (
            <span className="bg-[#F8F4EE]/95 px-2.5 py-1.5 text-[8px] tracking-[0.15em] text-[#544339]">
              ÉLORA EDIT
            </span>
          )}

          {isSale && (
            <span className="bg-[#8A6C5F] px-2.5 py-1.5 text-[8px] tracking-[0.15em] text-white">
              SALE
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleWishlist(id)}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#F8F4EE]/95 text-lg text-[#544339] transition hover:bg-[#544339] hover:text-white"
        >
          {isWishlisted ? "♥" : "♡"}
        </button>

        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F4EE] text-[#544339] shadow-sm transition hover:bg-[#544339] hover:text-white"
          aria-label={`Quick view ${product.name}`}
        >
          ↗
        </button>

        <Link
          to={`/product/${id}`}
          className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-[#544339]/95 py-4 text-center text-[9px] tracking-[0.22em] text-[#F8F4EE] transition-transform duration-300 group-hover:translate-y-0 md:block"
        >
          DISCOVER PIECE
        </Link>
      </div>

      <div className="pt-4">
        {category && (
          <p className="mb-2 text-[9px] uppercase tracking-[0.18em] text-[#967A67]">
            {category}
          </p>
        )}

        <Link to={`/product/${id}`}>
          <h2 className="line-clamp-1 font-serif text-base text-[#544339] transition hover:text-[#8A6C5F] sm:text-lg">
            {product.name}
          </h2>
        </Link>

        <p className="mt-2 line-clamp-2 min-h-10 text-[11px] leading-5 text-[#968476] sm:text-xs">
          {product.description ||
            "A timeless piece, thoughtfully selected for your wardrobe."}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[#544339]">
            ₹{price.toLocaleString("en-IN")}
          </span>

          {isSale && (
            <span className="text-xs text-[#9A8777] line-through">
              ₹{originalPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <Link
          to={`/product/${id}`}
          className="mt-4 inline-flex items-center gap-2 border-b border-[#BFA38A] pb-1 text-[9px] tracking-[0.16em] text-[#8A6C5F] transition hover:border-[#544339] hover:text-[#544339]"
        >
          VIEW DETAILS <span>↗</span>
        </Link>
      </div>
    </article>
  );
}

function QuickView({ product, onClose }) {
  if (!product) return null;

  const price = getProductPrice(product);
  const category = getCategoryName(product);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#30251F]/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        className="relative grid max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-[#F8F4EE] sm:grid-cols-2"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#F8F4EE] text-xl text-[#544339] shadow"
        >
          ×
        </button>

        <div className="aspect-[4/5] min-h-0 bg-[#EAE0D4] sm:aspect-auto">
          <ProductImage product={product} />
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-9">
          <p className="text-[9px] tracking-[0.25em] text-[#967A67]">
            ÉLORA COLLECTION
          </p>

          {category && (
            <p className="mt-5 text-[10px] uppercase tracking-[0.15em] text-[#8A6C5F]">
              {category}
            </p>
          )}

          <h2
            id="quick-view-title"
            className="mt-2 font-serif text-3xl text-[#544339]"
          >
            {product.name}
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#8D7B6D]">
            {product.description ||
              "A timeless piece, thoughtfully selected for your wardrobe."}
          </p>

          <p className="mt-5 text-lg text-[#544339]">
            ₹{price.toLocaleString("en-IN")}
          </p>

          <Link
            to={`/product/${getProductId(product)}`}
            onClick={onClose}
            className="mt-7 inline-flex items-center justify-center gap-3 bg-[#544339] px-5 py-4 text-[9px] tracking-[0.18em] text-[#F8F4EE] transition hover:bg-[#8A6C5F]"
          >
            VIEW PRODUCT DETAILS ↗
          </Link>
        </div>
      </section>
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [wishlist, setWishlist] = useState(getWishlist);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await getWebsiteProducts();

        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.products)
              ? response.products
              : Array.isArray(response?.data?.products)
                ? response.data.products
                : [];

        if (mounted) setProducts(list);
      } catch (err) {
        if (mounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Products load ചെയ്യാൻ കഴിഞ്ഞില്ല.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (!quickViewProduct) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") setQuickViewProduct(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickViewProduct]);

  const categories = useMemo(() => {
    const names = products
      .map(getCategoryName)
      .filter((name) => typeof name === "string" && name.trim())
      .map((name) => name.trim());

    return ["All", ...new Set(names)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "All") {
      result = result.filter(
        (product) => getCategoryName(product) === selectedCategory,
      );
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((product) =>
        [product.name, product.description, getCategoryName(product)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    }

    if (showWishlistOnly) {
      result = result.filter((product) =>
        wishlist.includes(String(getProductId(product))),
      );
    }

    if (sortBy === "price-low") {
      result.sort((a, b) => getProductPrice(a) - getProductPrice(b));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => getProductPrice(b) - getProductPrice(a));
    } else if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
    } else if (sortBy === "featured") {
      result.sort(
        (a, b) =>
          Number(b.featured || b.isFeatured) -
          Number(a.featured || a.isFeatured),
      );
    }

    return result;
  }, [products, search, selectedCategory, sortBy, showWishlistOnly, wishlist]);

  const activeFilterCount =
    Number(selectedCategory !== "All") +
    Number(Boolean(search.trim())) +
    Number(showWishlistOnly);

  function toggleWishlist(id) {
    const key = String(id);

    setWishlist((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategory("All");
    setSortBy("featured");
    setShowWishlistOnly(false);
  }

  return (
    <main className="min-h-screen bg-[#F8F4EE] text-[#544339]">
      {/* Announcement */}
      <div className="bg-[#544339] px-4 py-3 text-center text-[9px] tracking-[0.18em] text-[#F8F4EE] sm:text-[10px]">
        THOUGHTFULLY CURATED · TIMELESS BY DESIGN · ÉLORA
      </div>

      {/* Editorial hero */}
      <header className="relative overflow-hidden border-b border-[#E6DBCF] px-5 py-14 text-center sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute left-0 top-0 h-40 w-40 rounded-full bg-[#EAE0D4]/60 blur-3xl" />

        <p className="relative text-[9px] uppercase tracking-[0.38em] text-[#967A67] sm:text-[10px]">
          The ÉLORA Collection
        </p>

        <h1 className="relative mt-5 font-serif text-4xl font-normal leading-tight tracking-[-0.035em] sm:text-6xl lg:text-7xl">
          Discover Your Style
        </h1>

        <p className="relative mx-auto mt-5 max-w-md text-xs leading-7 text-[#8D7B6D] sm:text-sm">
          Timeless silhouettes. Thoughtful details. Pieces that feel entirely
          your own.
        </p>

        <div className="relative mx-auto mt-7 h-px w-14 bg-[#BFA38A]" />

        <p className="relative mt-5 font-serif text-sm italic text-[#8A6C5F]">
          Elegance in every detail.
        </p>
      </header>

      {/* Product collection */}
      <section className="mx-auto max-w-[1500px] px-5 py-9 sm:px-8 sm:py-12 lg:px-14 lg:py-14">
        {/* Toolbar */}
        <div className="flex flex-col gap-5 border-b border-[#E4D8CB] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em]">
              The Collection
            </p>

            <p className="mt-2 text-[11px] text-[#9A8777]">
              {loading
                ? "Curating your collection..."
                : `${filteredProducts.length} ${
                    filteredProducts.length === 1 ? "piece" : "pieces"
                  } to explore`}
              {activeFilterCount > 0 &&
                ` · ${activeFilterCount} active filter(s)`}
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <label className="flex items-center gap-3 border-b border-[#CDBBAA] pb-2 sm:w-[220px]">
              <span aria-hidden="true" className="text-lg text-[#927A68]">
                ⌕
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search collection..."
                aria-label="Search products"
                className="w-full bg-transparent text-xs outline-none placeholder:text-[#A39385]"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowWishlistOnly((value) => !value)}
              aria-pressed={showWishlistOnly}
              className={`flex items-center gap-2 text-left text-xs transition ${
                showWishlistOnly ? "text-[#8A6C5F]" : "text-[#79695C]"
              }`}
            >
              <span className="text-lg">{showWishlistOnly ? "♥" : "♡"}</span>
              Wishlist ({wishlist.length})
            </button>

            <label className="flex items-center gap-3 border-b border-[#CDBBAA] pb-2 sm:min-w-[175px] sm:border-0 sm:pb-0">
              <span className="shrink-0 text-[10px] text-[#8D7B6D]">
                Sort by
              </span>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort products"
                className="min-w-0 flex-1 cursor-pointer bg-transparent text-xs outline-none"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </label>
          </div>
        </div>

        {/* Category filters */}
        {!loading && !error && categories.length > 1 && (
          <nav
            aria-label="Filter products by category"
            className="mt-7 flex gap-2.5 overflow-x-auto pb-3"
          >
            {categories.map((category) => {
              const active = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={active}
                  className={`shrink-0 border px-4 py-3 text-[9px] uppercase tracking-[0.15em] transition sm:px-5 ${
                    active
                      ? "border-[#544339] bg-[#544339] text-[#F8F4EE]"
                      : "border-[#DCCDBF] text-[#79695C] hover:border-[#544339]"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </nav>
        )}

        {/* Active filters */}
        {activeFilterCount > 0 && !loading && !error && (
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-[10px] text-[#8D7B6D]">Refine your selection</p>

            <button
              type="button"
              onClick={clearFilters}
              className="border-b border-[#BFA38A] pb-1 text-[9px] uppercase tracking-[0.15em] hover:text-[#8A6C5F]"
            >
              Clear filters ×
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[3/4] bg-[#EAE0D4]" />
                <div className="mt-5 h-3 w-3/4 bg-[#EAE0D4]" />
                <div className="mt-3 h-3 w-1/3 bg-[#EAE0D4]" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="py-20 text-center">
            <p className="font-serif text-3xl">A little pause.</p>
            <p className="mt-3 text-sm text-[#8D7B6D]">{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-7 bg-[#544339] px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-white hover:bg-[#8A6C5F]"
            >
              Try Again ↗
            </button>
          </div>
        )}

        {/* Product grid */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:mt-10 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14">
            {filteredProducts.map((product) => (
              <ProductCard
                key={getProductId(product)}
                product={product}
                isWishlisted={wishlist.includes(String(getProductId(product)))}
                onToggleWishlist={toggleWishlist}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="py-24 text-center">
            <p className="font-serif text-3xl">Nothing found, just yet.</p>

            <p className="mx-auto mt-4 max-w-sm text-xs leading-6 text-[#927F70]">
              Try another search or clear your filters to discover more pieces
              from the ÉLORA collection.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-7 border-b border-[#544339] pb-2 text-[10px] uppercase tracking-[0.2em] hover:text-[#9B7E68]"
            >
              Explore All Pieces ↗
            </button>
          </div>
        )}
      </section>

      {/* Brand statement */}
      {!loading && !error && filteredProducts.length > 0 && (
        <section className="border-t border-[#E6DBCF] bg-[#EAE0D4]/40 px-5 py-14 text-center sm:py-20">
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#967A67]">
            The ÉLORA Philosophy
          </p>

          <h2 className="mx-auto mt-5 max-w-2xl font-serif text-3xl leading-snug text-[#544339] sm:text-5xl">
            Less ordinary.
            <br />
            <span className="italic">More you.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-md text-xs leading-7 text-[#8D7B6D] sm:text-sm">
            Thoughtful details and timeless silhouettes, chosen to become part
            of your story.
          </p>

          <Link
            to="/"
            className="mt-7 inline-flex items-center gap-3 border border-[#BFA38A] px-6 py-4 text-[9px] tracking-[0.18em] transition hover:bg-[#544339] hover:text-white"
          >
            BACK TO ÉLORA HOME ↗
          </Link>
        </section>
      )}

      <footer className="border-t border-[#E6DBCF] px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link to="/" className="font-serif text-xl tracking-[0.2em]">
            ÉLORA
          </Link>

          <p className="text-center text-[9px] tracking-[0.12em] text-[#9A8777]">
            TIMELESS STYLE · THOUGHTFUL DETAILS
          </p>

          <p className="text-[10px] text-[#9A8777]">
            © {new Date().getFullYear()} ÉLORA
          </p>
        </div>
      </footer>

      <QuickView
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </main>
  );
}

export default Products;
