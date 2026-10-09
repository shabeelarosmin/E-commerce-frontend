import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardRoutes from "./dashboard/routes/DashboardRoutes";
import WebsiteRoutes from "./website/routes/WebsiteRoutes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* WEBSITE */}
        <Route path="/*" element={<WebsiteRoutes />} />

        {/* ADMIN DASHBOARD */}
        <Route path="/dashboard/*" element={<DashboardRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
