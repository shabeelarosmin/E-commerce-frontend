import axios from "axios";

const WEBSITE_ORDER_URL = "http://localhost:8000/api/website/order";
const ADMIN_ORDER_URL = "http://localhost:8000/api/dashboard/order";

// AUTH TOKEN
const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// ========================================
// CUSTOMER - CREATE ORDER
// ========================================
export const createOrder = async (orderData) => {
  const response = await axios.post(
    WEBSITE_ORDER_URL,
    orderData,
    getAuthConfig(),
  );

  return response.data;
};

// ========================================
// CUSTOMER - GET MY ORDERS
// ========================================
export const getCustomerOrders = async () => {
  const response = await axios.get(WEBSITE_ORDER_URL, getAuthConfig());

  return response.data;
};

// ========================================
// CUSTOMER - GET ORDER BY ID
// ========================================
export const getOrderById = async (orderId) => {
  const response = await axios.get(
    `${WEBSITE_ORDER_URL}/${orderId}`,
    getAuthConfig(),
  );

  return response.data;
};

// ========================================
// CUSTOMER - CANCEL ORDER
// ========================================
export const cancelOrder = async (orderId) => {
  const response = await axios.put(
    `${WEBSITE_ORDER_URL}/${orderId}/cancel`,
    {},
    getAuthConfig(),
  );

  return response.data;
};

// ========================================
// ADMIN - GET ALL ORDERS
// ========================================
export const getAllOrders = async () => {
  const response = await axios.get(ADMIN_ORDER_URL, getAuthConfig());

  return response.data;
};

// ========================================
// ADMIN - GET ORDER BY ID
// ========================================
export const getAdminOrderById = async (orderId) => {
  const response = await axios.get(
    `${ADMIN_ORDER_URL}/${orderId}`,
    getAuthConfig(),
  );

  return response.data;
};

// ========================================
// ADMIN - UPDATE ORDER STATUS
// ========================================
export const updateOrderStatus = async (orderId, status) => {
  const response = await axios.put(
    `${ADMIN_ORDER_URL}/${orderId}/status`,
    { status },
    getAuthConfig(),
  );

  return response.data;
};
