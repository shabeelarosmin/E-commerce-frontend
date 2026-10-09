import axios from "axios";

const WEBSITE_API = "http://localhost:8000/api/website/category";
const ADMIN_API = "http://localhost:8000/api/dashboard/category";

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

// Website - Get categories
export const getCategories = async () => {
  const response = await axios.get(WEBSITE_API);
  return response.data;
};

// Admin - Get categories
export const getAdminCategories = async () => {
  const response = await axios.get(ADMIN_API, getAuthConfig());
  return response.data;
};

// Admin - Create category
export const createCategory = async (categoryData) => {
  const response = await axios.post(ADMIN_API, categoryData, getAuthConfig());
  return response.data;
};

export const updateCategory = async (id, categoryData) => {
  const response = await axios.put(
    `${ADMIN_API}/${id}`,
    categoryData,
    getAuthConfig(),
  );
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await axios.delete(`${ADMIN_API}/${id}`, getAuthConfig());
  return response.data;
};
