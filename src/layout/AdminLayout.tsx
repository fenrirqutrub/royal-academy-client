import { Outlet } from "react-router";
import AdminSidebar from "../pages/Admin/Dashboard/AdminSidebar";

const AdminLayout = () => (
  <div className="flex min-h-screen bg-[var(--color-bg)] bangla">
    <AdminSidebar />
    <main className="flex-1 p-3 lg:p-5 overflow-auto">
      <div className="max-w-7xl mx-auto mt-12 lg:mt-0">
        <Outlet />
      </div>
    </main>
  </div>
);

export default AdminLayout;
