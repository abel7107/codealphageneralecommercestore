
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, Bell, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="font-bold text-slate-900">Admin workspace</h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your Shopora store
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            <div className="hidden items-center gap-3 border-l border-slate-200 pl-5 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <UserRound size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
