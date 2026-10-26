import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("adminUser") || "null");
  } catch {
    user = null;
  }

  const isAdmin = Boolean(token) && user?.role?.toLowerCase() === "admin";

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
