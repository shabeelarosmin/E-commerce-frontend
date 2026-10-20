import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getCategories } from "../../api/categoryApi";
import { getWebsiteProducts } from "../../api/productApi";

const API_BASE_URL = "http://localhost:8000";

function getImageUrl(image) {
  if (!image) return "";

  const imagePath =
    typeof image === "string"
      ? image
      : image.url || image.path || image.secure_url || "";

  if (!imagePath) return "";

  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

function getProductImage(product) {
  return getImageUrl(
    product.image ||
      product.imageUrl ||
      (Array.isArray(product.images) ? product.images[0] : ""),
  );
}

function getArrayFromResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.products)) return response.products;
  if (Array.isArray(response?.categories)) return response.categories;
  if (Array.isArray(response?.data?.products)) return response.data.products;
  if (Array.isArray(response?.data?.categories)) {
    return response.data.categories;
  }

  return [];
}

function getProductId(product) {
  return product._id ?? product.id;
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

function ImagePlaceholder({ name = "ÉLORA" }) {
  return (
    <div className="flex h-full min-h-40 w-full flex-col items-center justify-center bg-[#E0D9CF] px-3 text-center">
      <span className="font-serif text-xl tracking-[0.2em] text-[#8A6C5F]">
        ÉLORA
      </span>
      <span className="mt-2 font-serif text-sm text-[#544339]">{name}</span>
    </div>
  );
}

function ProductCard({ product, latest = false }) {
  const image = getProductImage(product);
  const productId = getProductId(product);
  const price = getProductPrice(product);
  const [imageFailed, setImageFailed] = useState(false);

  const category =
    typeof product.categoryId === "object"
      ? product.categoryId?.name
      : (product.category?.name ?? product.category);

  return (
    <article className="group min-w-0">
      <Link
        to={`/product/${productId}`}
        className="relative block aspect-[3/4] overflow-hidden bg-[#E0D9CF]"
      >
        {image && !imageFailed ? (
          <img
            src={image}
            alt={product.name || "ÉLORA fashion"}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder name={product.name || "Collection"} />
        )}

        <span className="absolute left-3 top-3 bg-[#F3E8D3]/95 px-3 py-1.5 text-[9px] tracking-[0.18em] text-[#544339]">
          {latest ? "JUST ARRIVED" : product.label || "ÉLORA EDIT"}
        </span>

        <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F3E8D3] text-[#544339] transition-colors duration-300 group-hover:bg-[#544339] group-hover:text-white">
          ↗
        </span>
      </Link>

      <div className="space-y-2 py-4">
        {category && (
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8A6C5F]">
            {category}
          </p>
        )}

        <Link to={`/product/${productId}`}>
          <h3 className="font-serif text-lg text-[#544339] transition-colors hover:text-[#8A6C5F] sm:text-xl">
            {product.name}
          </h3>
        </Link>

        <p className="text-sm font-medium text-[#544339]">
          ₹{price.toLocaleString("en-IN")}
        </p>

        <Link
          to={`/product/${productId}`}
          className="inline-block border-b border-[#BFA38A] pb-1 pt-1 text-xs text-[#8A6C5F] transition-colors hover:border-[#544339] hover:text-[#544339]"
        >
          Discover Product ↗
        </Link>
      </div>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  linkText = "Shop All Products ↗",
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
      <div>
        <span className="mb-3 block text-[10px] tracking-[0.25em] text-[#8A6C5F]">
          {eyebrow}
        </span>

        <h2 className="font-serif text-3xl leading-tight text-[#544339] sm:text-4xl lg:text-5xl">
          {title}
        </h2>

        {description && (
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#8A6C5F]">
            {description}
          </p>
        )}
      </div>

      <Link
        to="/products"
        className="mb-1 border-b border-[#BFA38A] pb-2 text-xs text-[#544339] transition-colors hover:text-[#8A6C5F]"
      >
        {linkText}
      </Link>
    </div>
  );
}

function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [categoryLoading, setCategoryLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);

  const [categoryError, setCategoryError] = useState("");
  const [productError, setProductError] = useState("");

  const categoryScrollRef = useRef(null);

  const scrollCategories = (direction) => {
    if (!categoryScrollRef.current) return;

    categoryScrollRef.current.scrollBy({
      left: direction * categoryScrollRef.current.clientWidth * 0.75,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        setCategoryError("");

        const response = await getCategories();
        const list = getArrayFromResponse(response);

        if (active) {
          setCategories(list.filter((category) => category.active !== false));
        }
      } catch (error) {
        console.error("Category API error:", error);

        if (active) {
          setCategoryError(
            error.response?.data?.message || "Unable to load categories.",
          );
        }
      } finally {
        if (active) setCategoryLoading(false);
      }
    }

    async function loadProducts() {
      try {
        setProductError("");

        const response = await getWebsiteProducts();
        const list = getArrayFromResponse(response);

        if (active) {
          setProducts(
            list.filter(
              (product) =>
                product.active !== false &&
                product.status !== "inactive" &&
                product.status !== "draft",
            ),
          );
        }
      } catch (error) {
        console.error("Product API error:", error);

        if (active) {
          setProductError(
            error.response?.data?.message || "Unable to load products.",
          );
        }
      } finally {
        if (active) setProductLoading(false);
      }
    }

    loadCategories();
    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const featuredProducts = products
    .filter(
      (product) => product.featured === true || product.isFeatured === true,
    )
    .slice(0, 4);

  const latestProducts = [...products]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    )
    .slice(0, 4);

  return (
    <main className="min-h-screen overflow-hidden bg-[#F3E8D3] text-[#544339]">
      {/* Announcement bar */}
      <div className="bg-[#544339] px-4 py-3 text-center text-[9px] tracking-[0.18em] text-[#F3E8D3] sm:text-[10px]">
        A THOUGHTFULLY CURATED WARDROBE · DISCOVER ÉLORA
      </div>

      {/* Hero */}
      <section className="relative grid overflow-hidden bg-[#BFA38A] lg:min-h-[620px] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative z-10 flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-14 xl:px-20">
          <span className="mb-5 text-[10px] uppercase tracking-[0.28em] text-[#544339]">
            The ÉLORA collection
          </span>

          <h1 className="max-w-xl font-serif text-5xl leading-[1.08] text-[#F3E8D3] sm:text-6xl xl:text-7xl">
            Elegance in
            <br />
            <span className="italic">Every Thread.</span>
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-[#F3E8D3]">
            Thoughtfully chosen dresses and timeless pieces for the woman who
            finds beauty in the details.
          </p>

          <div className="mt-8">
            <Link
              to="/products"
              className="inline-flex items-center gap-5 bg-[#544339] px-7 py-4 text-[10px] tracking-[0.16em] text-[#F3E8D3] transition duration-300 hover:bg-[#8A6C5F]"
            >
              EXPLORE THE COLLECTION <span>↗</span>
            </Link>
          </div>

          <div className="mt-12 flex items-center gap-4 text-[9px] tracking-[0.2em] text-[#544339]">
            <span>01</span>
            <span className="h-px w-12 bg-[#544339]/60" />
            <span>TIMELESS BY DESIGN</span>
          </div>
        </div>

        <div className="relative min-h-[350px] bg-[#8A6C5F] lg:min-h-[620px]">
          <img
            src="/images/hero.jpg.jfif"
            alt="ÉLORA fashion collection"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#BFA38A]/20 via-transparent to-[#544339]/10" />

          <div className="absolute bottom-5 right-5 border border-[#F3E8D3]/70 bg-[#544339]/20 px-4 py-3 text-xs italic text-[#F3E8D3] backdrop-blur-sm sm:bottom-8 sm:right-8">
            Made for your moments
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="px-5 py-16 text-center sm:px-8 lg:py-20">
        <span className="text-[10px] tracking-[0.25em] text-[#8A6C5F]">
          THE ART OF EVERYDAY ELEGANCE
        </span>

        <h2 className="mx-auto mt-4 max-w-3xl font-serif text-3xl leading-snug text-[#544339] sm:text-4xl lg:text-5xl">
          A little more beauty in the everyday.
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#8A6C5F]">
          Explore carefully selected styles designed to feel beautiful,
          effortless, and entirely your own.
        </p>

        <div className="mx-auto mt-7 h-px w-16 bg-[#BFA38A]" />
      </section>

      {/* Categories with left and right arrows */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-12 lg:pb-24">
        <SectionHeading
          eyebrow="EXPLORE ÉLORA"
          title="Find Your Style"
          description="Discover collections that speak to you."
          linkText="ALL CATEGORIES ↗"
        />

        {categoryLoading && (
          <p className="py-8 text-sm text-[#8A6C5F]">Loading categories...</p>
        )}

        {!categoryLoading && categoryError && (
          <p className="py-8 text-sm text-red-700">{categoryError}</p>
        )}

        {!categoryLoading && !categoryError && categories.length === 0 && (
          <p className="py-8 text-sm text-[#8A6C5F]">
            No active categories available yet.
          </p>
        )}

        {!categoryLoading && !categoryError && categories.length > 0 && (
          <div className="relative">
            {/* Left arrow */}
            <button
              type="button"
              onClick={() => scrollCategories(-1)}
              aria-label="Scroll categories left"
              className="absolute -left-3 top-1/3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#BFA38A] bg-[#F3E8D3] text-2xl text-[#544339] shadow-md transition hover:bg-[#544339] hover:text-[#F3E8D3] sm:-left-5"
            >
              ‹
            </button>

            {/* Horizontal scroll area */}
            <div
              ref={categoryScrollRef}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6 lg:gap-7"
            >
              {categories.map((category, index) => {
                const image = getImageUrl(category.image || category.imageUrl);

                return (
                  <Link
                    key={category._id || category.slug || category.name}
                    to={`/products?category=${encodeURIComponent(
                      category.slug || category.name,
                    )}`}
                    className="group w-[46%] shrink-0 snap-start text-center sm:w-[30%] lg:w-[calc((100%-84px)/4)]"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-t-[110px] bg-[#E0D9CF]">
                      {image ? (
                        <img
                          src={image}
                          alt={category.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <ImagePlaceholder name={category.name} />
                      )}

                      <span className="absolute bottom-3 left-3 text-xs text-white drop-shadow">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#F3E8D3] text-[#544339] transition-colors group-hover:bg-[#544339] group-hover:text-white">
                        ↗
                      </span>
                    </div>

                    <h3 className="mt-4 font-serif text-lg text-[#544339]">
                      {category.name}
                    </h3>

                    <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-[#8A6C5F]">
                      Explore Collection
                    </p>
                  </Link>
                );
              })}
            </div>

            {/* Right arrow */}
            <button
              type="button"
              onClick={() => scrollCategories(1)}
              aria-label="Scroll categories right"
              className="absolute -right-3 top-1/3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#BFA38A] bg-[#F3E8D3] text-2xl text-[#544339] shadow-md transition hover:bg-[#544339] hover:text-[#F3E8D3] sm:-right-5"
            >
              ›
            </button>
          </div>
        )}
      </section>

      {/* Featured products */}
      <section className="bg-[#E0D9CF]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[210px_1fr] lg:gap-10 lg:px-12 lg:py-20">
          <div className="flex flex-col items-start justify-center">
            <span className="mb-4 text-[10px] tracking-[0.2em] text-[#8A6C5F]">
              HANDPICKED FOR YOU
            </span>

            <h2 className="font-serif text-4xl leading-tight text-[#544339] sm:text-5xl">
              The
              <br />
              ÉLORA Edit
            </h2>

            <p className="mt-4 text-sm leading-6 text-[#8A6C5F]">
              Beautiful pieces for your most memorable moments.
            </p>

            <Link
              to="/products"
              className="mt-7 bg-[#544339] px-6 py-3 text-[10px] tracking-[0.15em] text-[#F3E8D3] transition hover:bg-[#8A6C5F]"
            >
              SHOP ALL DRESSES ↗
            </Link>
          </div>

          <div>
            {productLoading && (
              <p className="py-8 text-sm text-[#8A6C5F]">Loading products...</p>
            )}

            {!productLoading && productError && (
              <p className="py-8 text-sm text-red-700">{productError}</p>
            )}

            {!productLoading &&
              !productError &&
              featuredProducts.length === 0 && (
                <div className="border border-[#BFA38A] bg-[#F3E8D3]/50 p-6">
                  <p className="font-serif text-lg text-[#544339]">
                    Your featured collection awaits.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#8A6C5F]">
                    Mark products as featured in your dashboard to display them
                    here.
                  </p>
                </div>
              )}

            {!productLoading &&
              !productError &&
              featuredProducts.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {featuredProducts.map((product) => (
                    <ProductCard
                      key={getProductId(product)}
                      product={product}
                    />
                  ))}
                </div>
              )}
          </div>
        </div>
      </section>

      {/* Editorial banner */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid overflow-hidden bg-[#BFA38A] md:grid-cols-2">
          <div className="relative min-h-[280px] bg-[#8A6C5F] md:min-h-[430px]">
            <img
              src="/images/promo-banner.jpg"
              alt="ÉLORA timeless fashion"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>

          <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-16">
            <span className="mb-4 text-[10px] tracking-[0.2em] text-[#544339]">
              A WARDROBE WITH MEANING
            </span>

            <h2 className="font-serif text-4xl leading-tight text-[#F3E8D3] sm:text-5xl">
              Your style.
              <br />
              <span className="italic">Your story.</span>
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-7 text-[#F3E8D3]">
              Discover versatile essentials and timeless pieces that feel
              uniquely yours.
            </p>

            <div className="mt-7">
              <Link
                to="/products"
                className="inline-flex items-center gap-4 bg-[#544339] px-6 py-3 text-[10px] tracking-[0.15em] text-[#F3E8D3] transition hover:bg-[#8A6C5F]"
              >
                EXPLORE THE COLLECTION ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest products */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-12 lg:pb-24">
        <SectionHeading
          eyebrow="JUST ARRIVED"
          title="Latest Products"
          description="Fresh styles, thoughtfully chosen for you."
        />

        {productLoading && (
          <p className="py-8 text-sm text-[#8A6C5F]">Loading products...</p>
        )}

        {!productLoading && productError && (
          <p className="py-8 text-sm text-red-700">{productError}</p>
        )}

        {!productLoading && !productError && latestProducts.length === 0 && (
          <p className="py-8 text-sm text-[#8A6C5F]">
            No products available yet.
          </p>
        )}

        {!productLoading && !productError && latestProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-7">
            {latestProducts.map((product) => (
              <ProductCard
                key={getProductId(product)}
                product={product}
                latest
              />
            ))}
          </div>
        )}
      </section>

      {/* Brand quote */}
      <section className="bg-[#544339] px-5 py-16 text-center sm:px-8 lg:py-20">
        <span className="text-[10px] tracking-[0.25em] text-[#BFA38A]">
          THE ÉLORA PROMISE
        </span>

        <h2 className="mx-auto mt-5 max-w-3xl font-serif text-3xl leading-snug text-[#F3E8D3] sm:text-4xl lg:text-5xl">
          Less ordinary. More you.
        </h2>

        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-[#E0D9CF]">
          Thoughtful details, timeless silhouettes, and styles to make your own.
        </p>

        <Link
          to="/products"
          className="mt-8 inline-flex items-center gap-4 border border-[#BFA38A] px-7 py-4 text-[10px] tracking-[0.15em] text-[#F3E8D3] transition hover:bg-[#BFA38A] hover:text-[#544339]"
        >
          FIND YOUR FAVOURITES ↗
        </Link>
      </section>

      {/* Service highlights */}
      <section className="border-y border-[#BFA38A]/50 bg-[#F3E8D3]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-9 sm:px-8 md:grid-cols-4 lg:px-12">
          {[
            {
              icon: "♧",
              title: "Thoughtful Delivery",
              text: "Carefully packed for you",
            },
            {
              icon: "◇",
              title: "Secure Payments",
              text: "A secure checkout experience",
            },
            {
              icon: "♡",
              title: "Easy Shopping",
              text: "Find your favourites",
            },
            {
              icon: "✳",
              title: "Timeless Fashion",
              text: "Style beyond seasons",
            },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <span className="text-2xl text-[#8A6C5F]">{item.icon}</span>
              <h3 className="mt-3 font-serif text-sm text-[#544339]">
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-[#8A6C5F]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing section */}
      <section className="px-5 py-16 text-center sm:px-8 lg:py-24">
        <span className="text-[10px] tracking-[0.25em] text-[#8A6C5F]">
          A LITTLE MORE ÉLORA
        </span>

        <h2 className="mt-4 font-serif text-3xl leading-snug text-[#544339] sm:text-5xl">
          Make every day feel special.
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#8A6C5F]">
          Find your favourites and create a wardrobe you love.
        </p>

        <Link
          to="/products"
          className="mt-7 inline-flex items-center gap-4 bg-[#544339] px-8 py-4 text-[10px] tracking-[0.15em] text-[#F3E8D3] transition hover:bg-[#8A6C5F]"
        >
          SHOP NOW <span>↗</span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#BFA38A]/50 bg-[#E0D9CF] px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Link
            to="/"
            className="font-serif text-2xl tracking-[0.2em] text-[#544339]"
          >
            ÉLORA
          </Link>

          <div className="flex flex-wrap justify-center gap-5 text-xs text-[#544339]">
            <Link to="/" className="hover:text-[#8A6C5F]">
              Home
            </Link>
            <Link to="/products" className="hover:text-[#8A6C5F]">
              Shop
            </Link>
            <Link to="/products" className="hover:text-[#8A6C5F]">
              Collections
            </Link>
          </div>

          <p className="text-xs text-[#8A6C5F]">
            © {new Date().getFullYear()} ÉLORA. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

export default Home;
