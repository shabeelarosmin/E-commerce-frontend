import { Routes, Route } from "react-router-dom";

import DashboardHome from "../pages/DashboardHome";
import Orders from "../pages/Orders";
import Products from "../pages/Products";
import ProductVariants from "../pages/ProductVariants.jsx";
import Categories from "../pages/Categories";
import Customers from "../pages/Customers";
import Inventory from "../pages/Inventory";
import Payments from "../pages/Payments";
import Reports from "../pages/Reports";

function DashboardRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/products" element={<Products />} />
      <Route path="/product-variants" element={<ProductVariants />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/payments" element={<Payments />} />
      <Route path="/reports" element={<Reports />} />
    </Routes>
  );
}

export default DashboardRoutes;
