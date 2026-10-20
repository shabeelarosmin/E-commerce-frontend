import axios from "axios";

const API_URL = "http://localhost:8000/api/dashboard/product-variant";

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// GET ALL VARIANTS
export const getProductVariants = async () => {
  const response = await axios.get(API_URL, getAuthConfig());
  return response.data;
};

// GET SINGLE VARIANT
export const getProductVariant = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};

// CREATE VARIANT
export const createProductVariant = async (variantData) => {
  const response = await axios.post(API_URL, variantData, getAuthConfig());
  return response.data;
};

// UPDATE VARIANT
export const updateProductVariant = async (id, variantData) => {
  const response = await axios.put(
    `${API_URL}/${id}`,
    variantData,
    getAuthConfig(),
  );
  return response.data;
};

// DELETE VARIANT
export const deleteProductVariant = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
  return response.data;
};
// PUBLIC WEBSITE API
const WEBSITE_API_URL =
  "http://localhost:8000/api/website/product-variant";

export const getWebsiteProductVariants = async () => {
  const response = await axios.get(WEBSITE_API_URL);
  return response.data;
};

