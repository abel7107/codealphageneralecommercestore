import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Settings, LogOut, UserRound, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminHeader({ title, description, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-5">
        {/* Left: menu + title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">{title || "Admin workspace"}</h2>
            {description && (
              <p className="hidden truncate text-xs text-slate-500 sm:block">{description}</p>
            )}
          </div>
        </div>

        {/* Center: search */}
        <div className="hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <Search size={16} className="text-slate-400" />
          <input
            placeholder="Search across admin..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-600" />
          </button>
          <button
            onClick={() => navigate("/admin/settings")}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 hover:bg-slate-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <UserRound size={16} />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-slate-900">{user?.name || "Administrator"}</p>
                <p className="text-[11px] text-slate-500">Administrator</p>
              </div>
              <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
            </button>

            {profileOpen && (
              <>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="fixed inset-0 z-40"
                  aria-label="Close profile menu"
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/admin/settings");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
