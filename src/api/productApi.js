import axios from "axios";

const WEBSITE_API = "http://localhost:8000/api/website/product";
const ADMIN_API = "http://localhost:8000/api/dashboard/product";

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// WEBSITE: Fetch products
export const getWebsiteProducts = async () => {
  const response = await axios.get(WEBSITE_API);
  return response.data;
};

// DASHBOARD: Fetch products
export const getAdminProducts = async () => {
  const response = await axios.get(ADMIN_API, getAuthConfig());
  return response.data;
};

// Alternative name for dashboard Products.jsx
export const getProducts = getAdminProducts;

// DASHBOARD: Create product
export const createProduct = async (productData) => {
  const response = await axios.post(ADMIN_API, productData, getAuthConfig());
  return response.data;
};

// DASHBOARD: Update product
export const updateProduct = async (id, productData) => {
  const response = await axios.put(
    `${ADMIN_API}/${id}`,
    productData,
    getAuthConfig(),
  );
  return response.data;
};

// DASHBOARD: Delete product
export const deleteProduct = async (id) => {
  const response = await axios.delete(`${ADMIN_API}/${id}`, getAuthConfig());
  return response.data;
};
