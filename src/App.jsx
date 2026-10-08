import { BrowserRouter, Routes, Route } from "react-router-dom";

import WebsiteRoutes from "./website/routes/WebsiteRoutes";

function DashboardHome() {
  return <h1>Admin Dashboard</h1>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* WEBSITE */}
        <Route path="/*" element={<WebsiteRoutes />} />

        {/* ADMIN DASHBOARD */}
        <Route path="/dashboard/*" element={<DashboardHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
