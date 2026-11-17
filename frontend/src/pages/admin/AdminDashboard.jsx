import { useEffect, useState } from "react";
import { Package, ShoppingCart, Users, Wallet, Clock, TrendingUp } from "lucide-react";
import { apiRequest } from "../../services/api";
import PageHeader from "../../components/admin/PageHeader";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";

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
    { title: "Total Revenue", value: loading ? "…" : money(summary?.totalRevenue ?? 0), description: "Non-cancelled order totals", Icon: Wallet, accent: "purple" },
    { title: "Total Orders", value: loading ? "…" : summary?.totalOrders ?? 0, description: "Orders received", Icon: ShoppingCart, accent: "blue" },
    { title: "Total Customers", value: loading ? "…" : summary?.totalCustomers ?? 0, description: "Registered customers", Icon: Users, accent: "green" },
    { title: "Total Products", value: loading ? "…" : summary?.totalProducts ?? 0, description: "Active products", Icon: Package, accent: "amber" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Welcome back! Here's what's happening with your store today."
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </section>

      {/* Secondary stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Pending Orders"
          value={loading ? "…" : summary?.pendingOrders ?? 0}
          description="Awaiting processing"
          Icon={Clock}
          accent="amber"
        />
        <StatCard
          title="Completed Orders"
          value={loading ? "…" : summary?.completedOrders ?? 0}
          description="Delivered orders"
          Icon={TrendingUp}
          accent="green"
        />
        <StatCard
          title="Low Stock"
          value={loading ? "…" : summary?.lowStockProducts ?? 0}
          description="Products below 5 units"
          Icon={Package}
          accent="purple"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent orders</h2>
            <a href="/admin/orders" className="text-sm font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-800 dark:text-violet-300">
              View all
            </a>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading...</p>
          ) : (data?.recentOrders || []).length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No orders yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead className="text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <tr>
                    <th className="pb-3 font-semibold">Order</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="py-3 text-sm font-semibold text-slate-900 dark:text-white">{order.orderNumber}</td>
                      <td className="py-3 text-sm text-slate-600 dark:text-slate-300">{order.customer}</td>
                      <td className="py-3 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-sm font-semibold text-slate-900 dark:text-white">{money(order.total)}</td>
                      <td className="py-3">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Best-selling products</h2>
            {loading ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading...</p>
            ) : (data?.bestSellingProducts || []).length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No sales data yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.bestSellingProducts.slice(0, 5).map((product) => (
                  <li key={product.productId} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{product.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{product.quantity} sold</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-slate-900 dark:text-white">{money(product.revenue)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick info</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Pending orders</span>
                <span className="font-semibold text-slate-900 dark:text-white">{loading ? "…" : summary?.pendingOrders ?? 0}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Low stock products</span>
                <span className="font-semibold text-slate-900 dark:text-white">{loading ? "…" : summary?.lowStockProducts ?? 0}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total customers</span>
                <span className="font-semibold text-slate-900 dark:text-white">{loading ? "…" : summary?.totalCustomers ?? 0}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
