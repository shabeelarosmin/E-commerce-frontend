import axios from "axios";

const API_URL = "http://localhost:8000/api/website/product";

export const getProducts = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};
