import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getCategories } from "../../api/categoryApi";
import { getWebsiteProducts } from "../../api/productApi";

import "../styles/website.css";

// Image fallback
function handleImageError(event) {
  event.currentTarget.style.display = "none";
}

// Read different possible API response formats
function getArrayFromResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.products)) return response.products;
  if (Array.isArray(response?.categories)) return response.categories;
  if (Array.isArray(response?.data?.products)) {
    return response.data.products;
  }
  if (Array.isArray(response?.data?.categories)) {
    return response.data.categories;
  }

  return [];
}

// Get product image
function getProductImage(product) {
  if (typeof product.image === "string" && product.image) {
    return product.image;
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0];

    if (typeof firstImage === "string") return firstImage;
    if (firstImage?.url) return firstImage.url;
  }

  return "";
}

// Get product price
function getProductPrice(product) {
  return Number(
    product.sellingPrice ??
      product.salePrice ??
      product.basePrice ??
      product.price ??
      0,
  );
}

// Get product ID
function getProductId(product) {
  return product._id ?? product.id;
}

// Reusable product card
function ProductCard({ product, latest = false }) {
  const productId = getProductId(product);
  const image = getProductImage(product);
  const price = getProductPrice(product);

  const categoryName =
    typeof product.categoryId === "object"
      ? product.categoryId?.name
      : (product.category?.name ?? product.category);

  return (
    <article className="elora-product-card">
      <Link to={`/product/${productId}`} className="elora-product-image">
        {image ? (
          <img
            src={image}
            alt={product.name || "ELORA product"}
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="elora-product-placeholder">
            <span>ELORA</span>
            <p>{product.name}</p>
          </div>
        )}

        <span className="elora-product-label">
          {latest ? "LATEST" : product.label || "FEATURED"}
        </span>

        <span className="elora-product-arrow">↗</span>
      </Link>

      <div className="elora-product-details">
        {categoryName && (
          <p className="elora-product-category">{categoryName}</p>
        )}

        <Link to={`/product/${productId}`}>
          <h3>{product.name}</h3>
        </Link>

        <p className="elora-product-price">₹{price.toLocaleString("en-IN")}</p>

        <Link to={`/product/${productId}`} className="elora-product-link">
          View Product ↗
        </Link>
      </div>
    </article>
  );
}

function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [categoryLoading, setCategoryLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);

  const [categoryError, setCategoryError] = useState("");
  const [productError, setProductError] = useState("");

  // Fetch categories and products from backend
  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      try {
        setCategoryLoading(true);
        setCategoryError("");

        const response = await getCategories();
        const categoryList = getArrayFromResponse(response);

        if (isMounted) {
          setCategories(
            categoryList.filter((category) => category.active !== false),
          );
        }
      } catch (error) {
        console.error("Category API error:", error);

        if (isMounted) {
          setCategoryError(
            error.response?.data?.message ||
              "Categories load ചെയ്യാൻ കഴിഞ്ഞില്ല.",
          );
        }
      } finally {
        if (isMounted) {
          setCategoryLoading(false);
        }
      }
    }

    async function fetchProducts() {
      try {
        setProductLoading(true);
        setProductError("");

        const response = await getWebsiteProducts();
        const productList = getArrayFromResponse(response);

        if (isMounted) {
          setProducts(
            productList.filter(
              (product) =>
                product.active !== false &&
                product.status !== "inactive" &&
                product.status !== "draft",
            ),
          );
        }
      } catch (error) {
        console.error("Product API error:", error);

        if (isMounted) {
          setProductError(
            error.response?.data?.message ||
              "Products load ചെയ്യാൻ കഴിഞ്ഞില്ല.",
          );
        }
      } finally {
        if (isMounted) {
          setProductLoading(false);
        }
      }
    }

    fetchCategories();
    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Featured products: use the backend featured flag
  const featuredProducts = products
    .filter(
      (product) => product.featured === true || product.isFeatured === true,
    )
    .slice(0, 4);

  // Latest products: newest records first
  const latestProducts = [...products]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();

      const dateB = new Date(b.createdAt || 0).getTime();

      return dateB - dateA;
    })
    .slice(0, 4);

  return (
    <main className="elora-home">
      {/* Announcement */}
      <div className="elora-announcement">Discover your style with ELORA</div>

      {/* Hero */}
      <section className="elora-hero">
        <div className="elora-hero-content">
          <span className="elora-eyebrow">THE NEW SEASON COLLECTION</span>

          <h1>
            Elegance in
            <br />
            <span>Every Thread</span>
          </h1>

          <p>
            Discover timeless dresses and thoughtfully selected styles for every
            moment of your life.
          </p>

          <Link to="/products" className="elora-button">
            Shop Collection <span>↗</span>
          </Link>

          <div className="elora-hero-note">
            <span>01</span>
            <span className="elora-note-line"></span>
            <span>TIMELESS STYLE</span>
          </div>
        </div>

        <div className="elora-hero-image">
          <img
            src="/images/home-banner.jpg"
            alt="ELORA fashion collection"
            onError={handleImageError}
          />

          <span className="elora-banner-caption">
            TIMELESS STYLE · NEW SEASON
          </span>
        </div>
      </section>

      {/* Categories from backend */}
      <section className="elora-section">
        <div className="elora-section-heading">
          <div>
            <span className="elora-eyebrow">EXPLORE ELORA</span>
            <h2>Shop by Category</h2>
          </div>

          <Link to="/products" className="elora-text-link">
            View All Categories ↗
          </Link>
        </div>

        <div className="elora-category-grid">
          {categoryLoading && <p>Loading categories...</p>}

          {!categoryLoading && categoryError && <p>{categoryError}</p>}

          {!categoryLoading && !categoryError && categories.length === 0 && (
            <p>No active categories available yet.</p>
          )}

          {!categoryLoading &&
            !categoryError &&
            categories.map((category, index) => (
              <Link
                key={category._id || category.slug || category.name}
                to={`/products?category=${encodeURIComponent(
                  category.slug || category.name,
                )}`}
                className="elora-category-card"
              >
                <div className="elora-category-image">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="elora-category-placeholder">
                      <span>ELORA</span>
                      <p>{category.name}</p>
                    </div>
                  )}

                  <span className="elora-category-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="elora-category-arrow">↗</span>
                </div>

                <h3>{category.name}</h3>

                <p>{category.description || "Explore Collection"} ↗</p>
              </Link>
            ))}
        </div>
      </section>

      {/* Featured products from backend */}
      <section className="elora-section elora-featured-section">
        <div className="elora-section-heading">
          <div>
            <span className="elora-eyebrow">HANDPICKED FOR YOU</span>

            <h2>Featured Dresses</h2>

            <p className="elora-section-description">
              Beautiful pieces for your most memorable moments.
            </p>
          </div>

          <Link to="/products" className="elora-text-link">
            Shop All Dresses ↗
          </Link>
        </div>

        <div className="elora-product-grid">
          {productLoading && <p>Loading products...</p>}

          {!productLoading && productError && <p>{productError}</p>}

          {!productLoading &&
            !productError &&
            featuredProducts.length === 0 && (
              <p>
                No featured products available yet. Set the featured flag for
                products in the dashboard.
              </p>
            )}

          {!productLoading &&
            !productError &&
            featuredProducts.map((product) => (
              <ProductCard key={getProductId(product)} product={product} />
            ))}
        </div>
      </section>

      {/* Promotional banner */}
      <section className="elora-promo-banner">
        <div className="elora-promo-content">
          <span className="elora-eyebrow">THE ELORA EDIT</span>

          <h2>
            Your style.
            <br />
            <span>Your story.</span>
          </h2>

          <p>
            Discover versatile essentials and timeless pieces that feel uniquely
            yours.
          </p>

          <Link to="/products" className="elora-button">
            Explore the Edit <span>↗</span>
          </Link>
        </div>

        <div className="elora-promo-image">
          <img
            src="/images/promo-banner.jpg"
            alt="ELORA everyday fashion"
            loading="lazy"
            onError={handleImageError}
          />
        </div>
      </section>

      {/* Latest products from backend */}
      <section className="elora-section">
        <div className="elora-section-heading">
          <div>
            <span className="elora-eyebrow">JUST ARRIVED</span>

            <h2>Latest Products</h2>

            <p className="elora-section-description">
              Fresh styles, thoughtfully chosen for you.
            </p>
          </div>

          <Link to="/products" className="elora-text-link">
            Shop All Products ↗
          </Link>
        </div>

        <div className="elora-product-grid">
          {productLoading && <p>Loading products...</p>}

          {!productLoading && productError && <p>{productError}</p>}

          {!productLoading && !productError && latestProducts.length === 0 && (
            <p>No products available yet.</p>
          )}

          {!productLoading &&
            !productError &&
            latestProducts.map((product) => (
              <ProductCard
                key={getProductId(product)}
                product={product}
                latest
              />
            ))}
        </div>
      </section>

      {/* Bottom banner */}
      <section className="elora-bottom-banner">
        <span className="elora-eyebrow">A LITTLE MORE ELORA</span>

        <h2>Make every day feel special.</h2>

        <p>Find your favourites and create a wardrobe you love.</p>

        <Link to="/products" className="elora-button">
          Shop Now <span>↗</span>
        </Link>
      </section>
    </main>
  );
}

export default Home;
