import { useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  Users,
  Wallet,
  Clock,
} from "lucide-react";
import { apiRequest } from "../../services/api";

function money(value) {
  return `ETB ${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await apiRequest("/api/admin/analytics/overview?range=30d");
        setData(response.data);
      } catch (err) {
        setError(err.message || "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summary = data?.summary;

  const statsCards = [
    { title: "Total Revenue", value: loading ? "…" : money(summary?.totalRevenue ?? 0), description: "Non-cancelled order totals", Icon: Wallet },
    { title: "Total Orders", value: loading ? "…" : summary?.totalOrders ?? 0, description: "Orders received", Icon: ShoppingCart },
    { title: "Total Customers", value: loading ? "…" : summary?.totalCustomers ?? 0, description: "Registered customers", Icon: Users },
    { title: "Total Products", value: loading ? "…" : summary?.totalProducts ?? 0, description: "Active products", Icon: Package },
    { title: "Pending Orders", value: loading ? "…" : summary?.pendingOrders ?? 0, description: "Awaiting processing", Icon: Clock },
    { title: "Completed Orders", value: loading ? "…" : summary?.completedOrders ?? 0, description: "Delivered orders", Icon: ShoppingCart },
    { title: "Low Stock", value: loading ? "…" : summary?.lowStockProducts ?? 0, description: "Products below 5 units", Icon: Package },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-slate-500">Overview</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Real store performance and recent activity.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map(({ title, value, description, Icon }) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Icon size={22} />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">{value}</h2>
            <p className="mt-2 text-xs text-slate-400">{description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Recent orders</h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Loading...</p>
          ) : (data?.recentOrders || []).length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500">
                      {order.customer} · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{money(order.total)}</p>
                    <p className="text-xs text-slate-500">{order.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Best-selling products</h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Loading...</p>
          ) : (data?.bestSellingProducts || []).length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No sales data yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.bestSellingProducts.map((product) => (
                <li key={product.productId} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.quantity} sold</p>
                  </div>
                  <p className="text-sm font-bold">{money(product.revenue)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
