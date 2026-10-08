import { Outlet, Link } from "react-router-dom";

function WebsiteLayout() {
  return (
    <>
      <header>
        <h2>E-Commerce</h2>

        <nav>
          <Link to="/">Home</Link> <Link to="/products">Products</Link>{" "}
          <Link to="/login">Login</Link> <Link to="/cart">Cart</Link>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  );
}

export default WebsiteLayout;
