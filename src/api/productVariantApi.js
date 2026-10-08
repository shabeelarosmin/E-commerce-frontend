import axios from "axios";

const API_URL = "http://localhost:8000/api/website/product-variant";

// GET ALL PRODUCT VARIANTS
export const getProductVariants = async () => {
  const response = await axios.get(API_URL);

  return response.data;
};

// GET SINGLE PRODUCT VARIANT
export const getProductVariant = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);

  return response.data;
};
