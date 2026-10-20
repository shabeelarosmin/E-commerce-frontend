import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

function WebsiteLayout() {
  return (
    <div className="min-h-screen bg-[#F8F4EE]">
      <Navbar />

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default WebsiteLayout;
