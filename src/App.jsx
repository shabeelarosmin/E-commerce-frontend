import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminLogin from "./dashboard/pages/AdminLogin";
import DashboardRoutes from "./dashboard/routes/DashboardRoutes";
import ProtectedRoute from "./dashboard/routes/ProtectedRoute";
import DashboardLayout from "./dashboard/layouts/DashboardLayout";
import WebsiteRoutes from "./website/routes/WebsiteRoutes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />

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

        <Route path="/*" element={<WebsiteRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
