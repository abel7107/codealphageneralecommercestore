import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  ChartNoAxesCombined,
  Settings,
  Bell,
  UserRound,
  Store,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const sections = [
  {
    title: "Workspace",
    items: [
      { name: "Dashboard", path: "/admin", Icon: LayoutDashboard },
      { name: "Products", path: "/admin/products", Icon: Package },
      { name: "Categories", path: "/admin/categories", Icon: FolderTree },
      { name: "Orders", path: "/admin/orders", Icon: ShoppingCart },
      { name: "Customers", path: "/admin/customers", Icon: Users },
      { name: "Analytics", path: "/admin/analytics", Icon: ChartNoAxesCombined },
    ],
  },
  {
    title: "Preferences",
    items: [
      { name: "Settings", path: "/admin/settings", Icon: Settings },
      { name: "Notifications", path: "/admin/settings", Icon: Bell },
    ],
  },
  {
    title: "Account",
    items: [
      { name: "Profile", path: "/admin/settings", Icon: UserRound },
    ],
  },
];

export default function AdminSidebar({ open, onClose, collapsed, onToggleCollapse }) {
  return (
    <>
      {open && (
        <button
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-16" : "w-60"} lg:h-screen`}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-white">
              <Store size={18} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-base font-black tracking-tight text-slate-900">shopora.</h1>
                <p className="truncate text-xs text-slate-400">Administration</p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
          <button
            onClick={onToggleCollapse}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:block"
            aria-label="Collapse sidebar"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3">
          {sections.map((section) => (
            <div key={section.title} className="mb-4">
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  {section.title}
                </p>
              )}
              <nav className="space-y-1">
                {section.items.map(({ name, path, Icon }) => (
                  <NavLink
                    key={name + path}
                    to={path}
                    end={path === "/admin"}
                    onClick={onClose}
                    title={collapsed ? name : undefined}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-violet-50 text-violet-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      } ${collapsed ? "justify-center" : ""}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={19} className={isActive ? "text-violet-700" : "text-slate-400 group-hover:text-slate-700"} />
                        {!collapsed && <span className="truncate">{name}</span>}
                        {isActive && !collapsed && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-700" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4">
          {!collapsed ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Shopora Admin Panel</p>
              <p className="text-xs text-slate-300">Version 1.0.0</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="text-[10px] text-slate-300">v1</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
