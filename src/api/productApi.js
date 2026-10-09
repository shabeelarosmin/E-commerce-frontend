import axios from "axios";

const WEBSITE_API = "http://localhost:8000/api/website/product";
const ADMIN_API = "http://localhost:8000/api/dashboard/product";

// Admin token
const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// WEBSITE - Get all products
export const getProducts = async () => {
  const response = await axios.get(WEBSITE_API);
  return response.data;
};

// ADMIN - Get all products
export const getAdminProducts = async () => {
  const response = await axios.get(ADMIN_API, getAuthConfig());
  return response.data;
};

// ADMIN - Get single product
export const getAdminProduct = async (id) => {
  const response = await axios.get(`${ADMIN_API}/${id}`, getAuthConfig());
  return response.data;
};

// ADMIN - Create product
export const createProduct = async (productData) => {
  const response = await axios.post(ADMIN_API, productData, getAuthConfig());
  return response.data;
};

// ADMIN - Update product
export const updateProduct = async (id, productData) => {
  const response = await axios.put(
    `${ADMIN_API}/${id}`,
    productData,
    getAuthConfig(),
  );
  return response.data;
};

// ADMIN - Delete product
export const deleteProduct = async (id) => {
  const response = await axios.delete(`${ADMIN_API}/${id}`, getAuthConfig());
  return response.data;
};
