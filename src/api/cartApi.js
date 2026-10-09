import axios from "axios";

const API_URL = "http://localhost:8000/api/website/cart";

// Get customer token
const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// GET CART
export const getCart = async () => {
  const response = await axios.get(API_URL, getAuthConfig());

  return response.data;
};

// ADD TO CART
export const addToCart = async (item) => {
  const response = await axios.post(API_URL, item, getAuthConfig());

  return response.data;
};

// UPDATE CART ITEM QUANTITY
export const updateCartItem = async (cartId, itemId, quantity) => {
  const response = await axios.put(
    `${API_URL}/${cartId}/item/${itemId}`,
    { quantity },
    getAuthConfig(),
  );

  return response.data;
};

// REMOVE CART ITEM
export const removeCartItem = async (cartId, itemId) => {
  const response = await axios.delete(
    `${API_URL}/${cartId}/item/${itemId}`,
    getAuthConfig(),
  );

  return response.data;
};

// CLEAR CART
export const clearCart = async (cartId) => {
  const response = await axios.delete(
    `${API_URL}/${cartId}/clear`,
    getAuthConfig(),
  );

  return response.data;
};
