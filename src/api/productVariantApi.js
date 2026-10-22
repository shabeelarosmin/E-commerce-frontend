import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const VARIANT_API = `${API_BASE_URL}/dashboard/product-variant`;
const PRODUCT_API = `${API_BASE_URL}/dashboard/product`;
const WEBSITE_VARIANT_API = `${API_BASE_URL}/website/product-variant`;

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// GET ALL VARIANTS
export const getProductVariants = async () => {
  const { data } = await axios.get(VARIANT_API, authConfig());
  return data;
};

// GET SINGLE VARIANT
export const getProductVariant = async (id) => {
  const { data } = await axios.get(`${VARIANT_API}/${id}`, authConfig());
  return data;
};

// GET PRODUCTS FOR DROPDOWN
export const getDashboardProducts = async () => {
  const { data } = await axios.get(PRODUCT_API, authConfig());
  return data;
};

// CREATE VARIANT
export const createProductVariant = async (variantData) => {
  const { data } = await axios.post(VARIANT_API, variantData, authConfig());
  return data;
};

// UPDATE VARIANT
export const updateProductVariant = async (id, variantData) => {
  const { data } = await axios.put(
    `${VARIANT_API}/${id}`,
    variantData,
    authConfig(),
  );
  return data;
};

// DELETE VARIANT
export const deleteProductVariant = async (id) => {
  const { data } = await axios.delete(`${VARIANT_API}/${id}`, authConfig());
  return data;
};

// PUBLIC WEBSITE VARIANTS
export const getWebsiteProductVariants = async () => {
  const { data } = await axios.get(WEBSITE_VARIANT_API);
  return data;
};
