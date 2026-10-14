import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <>
      <div className="announcement-bar">Discover the new season collection</div>

      <header className="elora-navbar">
        <Link to="/" className="elora-logo">
          ELORA
          <span>TIMELESS FASHION</span>
        </Link>

        <nav className="elora-nav-links">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/new-arrivals">New Arrivals</Link>
        </nav>

        <div className="elora-nav-actions">
          <Link to="/login" aria-label="Login">
            Account
          </Link>
          <Link to="/cart" aria-label="Shopping cart">
            Bag
          </Link>
        </div>
      </header>
    </>
  );
}
