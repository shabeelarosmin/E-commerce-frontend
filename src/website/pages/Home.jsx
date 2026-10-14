import { Link } from "react-router-dom";
import "../styles/website.css";

const categories = [
  { name: "Dresses", image: "/images/category-dresses.jpg" },
  { name: "Tops", image: "/images/category-tops.jpg" },
  { name: "Co-ord Sets", image: "/images/category-coords.jpg" },
  { name: "Accessories", image: "/images/category-accessories.jpg" },
];

const featuredDresses = [
  {
    id: 1,
    name: "Elegant Midi Dress",
    price: 2499,
    image: "/images/featured-dress-1.jpg",
    label: "BESTSELLER",
  },
  {
    id: 2,
    name: "Floral Summer Dress",
    price: 2199,
    image: "/images/featured-dress-2.jpg",
    label: "FEATURED",
  },
  {
    id: 3,
    name: "Classic Evening Dress",
    price: 2899,
    image: "/images/featured-dress-3.jpg",
    label: "POPULAR",
  },
  {
    id: 4,
    name: "Soft Linen Dress",
    price: 1999,
    image: "/images/featured-dress-4.jpg",
    label: "NEW",
  },
];

const latestProducts = [
  {
    id: 5,
    name: "Everyday Essential Top",
    category: "Tops",
    price: 1299,
    image: "/images/everyday-essential-top.png",
  },
  {
    id: 6,
    name: "Linen Co-ord Set",
    category: "Co-ord Sets",
    price: 2999,
    image: "/images/latest-coords.jpg",
  },
  {
    id: 7,
    name: "Classic Beige Dress",
    category: "Dresses",
    price: 2499,
    image: "/images/latest-beige-dress.jpg",
  },
  {
    id: 8,
    name: "Everyday Handbag",
    category: "Abayas",
    price: 1599,
    image: "/images/Abigail Leigh Striped Wide-Leg Pants Set - Camel _ L.jfif",
  },
];

function ProductCard({ product, latest = false }) {
  return (
    <article className="elora-product-card">
      <Link to={`/product/${product.id}`} className="elora-product-image">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.visibility = "hidden";
          }}
        />

        <span className="elora-product-label">
          {latest ? "LATEST" : product.label}
        </span>

        <span className="elora-product-arrow">↗</span>
      </Link>

      <div className="elora-product-details">
        {product.category && (
          <p className="elora-product-category">{product.category}</p>
        )}

        <Link to={`/product/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>

        <p className="elora-product-price">
          ₹{product.price.toLocaleString("en-IN")}
        </p>

        <Link to={`/product/${product.id}`} className="elora-product-link">
          View Product ↗
        </Link>
      </div>
    </article>
  );
}

function Home() {
  return (
    <main className="elora-home">
      {/* Top promotional banner */}
      <div className="elora-announcement">Discover your style with ELORA</div>

      {/* Main fashion banner */}
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
        </div>

        <div className="elora-hero-image">
          <img
            src="/images/home-banner.jpg"
            alt="ELORA fashion collection"
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          />
          <span className="elora-banner-caption">
            TIMELESS STYLE · NEW SEASON
          </span>
        </div>
      </section>

      {/* Category section */}
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
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={`/products?category=${encodeURIComponent(category.name)}`}
              className="elora-category-card"
            >
              <div className="elora-category-image">
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />
                <span className="elora-category-number">0{index + 1}</span>
                <span className="elora-category-arrow">↗</span>
              </div>

              <h3>{category.name}</h3>
              <p>Explore Collection ↗</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured dresses */}
      <section className="elora-section elora-featured-section">
        <div className="elora-section-heading">
          <div>
            <span className="elora-eyebrow">HANDPICKED FOR YOU</span>
            <h2>Featured Dresses</h2>
            <p className="elora-section-description">
              Beautiful pieces for your most memorable moments.
            </p>
          </div>

          <Link to="/products?category=Dresses" className="elora-text-link">
            Shop All Dresses ↗
          </Link>
        </div>

        <div className="elora-product-grid">
          {featuredDresses.map((product) => (
            <ProductCard key={product.id} product={product} />
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
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          />
        </div>
      </section>

      {/* Latest products */}
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
          {latestProducts.map((product) => (
            <ProductCard key={product.id} product={product} latest />
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
