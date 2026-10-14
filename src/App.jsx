import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./dashboard/styles/dashboard.css";

import AdminLogin from "./dashboard/pages/AdminLogin";
import DashboardRoutes from "./dashboard/routes/DashboardRoutes";
import ProtectedRoute from "./dashboard/routes/ProtectedRoute";
import DashboardLayout from "./dashboard/layouts/DashboardLayout";
import WebsiteRoutes from "./website/routes/WebsiteRoutes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Dashboard */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardRoutes />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Customer Website */}
        <Route path="/*" element={<WebsiteRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
