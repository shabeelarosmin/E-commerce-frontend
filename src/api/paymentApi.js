import axios from "axios";

const PAYMENT_URL = "http://localhost:8000/api/dashboard/payment";

const getAuthConfig = () => {
  const token = localStorage.getItem("adminToken");

  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

// ADMIN - GET ALL PAYMENTS
export const getAllPayments = async () => {
  const response = await axios.get(PAYMENT_URL, getAuthConfig());
  return response.data;
};

// ADMIN - GET PAYMENT BY ID
export const getPaymentById = async (paymentId) => {
  const response = await axios.get(
    `${PAYMENT_URL}/${paymentId}`,
    getAuthConfig(),
  );

  return response.data;
};
