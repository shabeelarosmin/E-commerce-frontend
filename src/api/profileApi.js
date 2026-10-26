import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export const updateProfile = async (profileData) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Please log in to update your profile.");
  }

  const response = await axios.put(
    `${API_BASE_URL}/website/auth/profile`,
    profileData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};
