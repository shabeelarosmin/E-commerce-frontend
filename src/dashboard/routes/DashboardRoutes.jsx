import { Routes, Route, Link } from "react-router-dom";
import Orders from "../pages/Orders";
import Products from "../pages/Products";
import ProductVariants from "./pages/ProductVariants";

function DashboardHome() {
  return (
    <div style={{ padding: "24px" }}>
      <h1>Admin Dashboard</h1>

      <hr />

      <h2>Dashboard Menu</h2>

      <ul>
        <li>
          <Link to="/dashboard">Home</Link>
        </li>
        <li>
          <Link to="/dashboard/orders">Orders Management</Link>
        </li>
      </ul>
    </div>
  );
}

function DashboardRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/products" element={<Products />} />
      <Route path="/ProductVariants" element={<ProductVariants />} />
    </Routes>
  );
}

export default DashboardRoutes;
