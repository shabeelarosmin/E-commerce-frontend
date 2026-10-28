import { Routes, Route } from "react-router-dom";

import WebsiteLayout from "../layouts/WebsiteLayout";

import Home from "../pages/Home";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import Profile from "../pages/Profile";
import EditProfile from "../pages/EditProfile";
import Categories from "../pages/Categories";

function WebsiteRoutes() {
  return (
    <Routes>
      <Route element={<WebsiteLayout />}>
        <Route index element={<Home />} />

        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetails />} />

        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<Orders />} />

        <Route path="profile" element={<Profile />} />
        <Route path="profile/edit" element={<EditProfile />} />

        <Route path="categories" element={<Categories />} />
      </Route>
    </Routes>
  );
}

export default WebsiteRoutes;
