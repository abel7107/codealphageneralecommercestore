
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ChartNoAxesCombined,
  Settings,
  Store,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", path: "/admin", Icon: LayoutDashboard },
  { name: "Products", path: "/admin/products", Icon: Package },
  { name: "Orders", path: "/admin/orders", Icon: ShoppingCart },
  { name: "Customers", path: "/admin/customers", Icon: Users },
  { name: "Analytics", path: "/admin/analytics", Icon: ChartNoAxesCombined },
  { name: "Settings", path: "/admin/settings", Icon: Settings },
];

export default function AdminSidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <button
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950">
              <Store size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">shopora.</h1>
              <p className="text-xs text-slate-400">Administration</p>
            </div>
          </div>

          <button onClick={onClose} className="lg:hidden" aria-label="Close menu">
            <X size={21} />
          </button>
        </div>

        <div className="px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            {navigation.map(({ name, path, Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/admin"}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-slate-950 shadow-lg"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={19} />
                {name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 p-5">
          <p className="text-xs text-slate-500">Shopora Admin Panel</p>
          <p className="mt-1 text-xs text-slate-400">Version 1.0.0</p>
        </div>
      </aside>
    </>
  );
}
