import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { apiRequest } from "../../services/api";
import PageHeader from "../../components/admin/PageHeader";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

function money(value) {
  return `ETB ${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function BarChart({ items, valueKey, labelKey, color = "bg-violet-700 dark:bg-violet-600" }) {
  const maxValue = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);

  if (!items.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No data available.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item[labelKey]} className="flex items-center gap-3">
          <span className="w-20 shrink-0 truncate text-xs text-slate-600 dark:text-slate-300 sm:w-24">{item[labelKey]}</span>
          <div className="h-3 flex-1 rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className={`h-3 rounded-full ${color}`}
              style={{ width: `${Math.max(4, (Number(item[valueKey]) / maxValue) * 100)}%` }}
            />
          </div>
          <span className="w-20 text-right text-xs font-semibold text-slate-700 dark:text-slate-200">
            {money(item[valueKey])}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiRequest(`/api/admin/analytics/overview?range=${range}`);
        setData(response.data);
      } catch (err) {
        setError(err.message || "Unable to load analytics.");
      } finally {
        setLoading(false);
      }
    })();
  }, [range]);

  const maxDailyOrders = Math.max(...(data?.dailyRevenue || []).map((item) => item.orders || 0), 1);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Store insights"
        title="Analytics"
        description="Track revenue, orders, and product performance."
        actions={
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none"
          >
            {RANGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <LoaderCircle className="animate-spin" size={22} />
          Loading analytics...
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Revenue", value: money(data?.summary?.totalRevenue ?? 0) },
              { label: "Orders", value: data?.summary?.totalOrders ?? 0 },
              { label: "Customers", value: data?.summary?.totalCustomers ?? 0 },
              { label: "Products", value: data?.summary?.totalProducts ?? 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daily revenue</h2>
              <div className="mt-4">
                <BarChart items={data?.dailyRevenue || []} valueKey="revenue" labelKey="date" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Orders over time</h2>
              <div className="mt-4 space-y-3">
                {(data?.dailyRevenue || []).length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No data available.</p>
                ) : (
                  (data?.dailyRevenue || []).map((item) => (
                    <div key={item.date} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 truncate text-xs text-slate-600 dark:text-slate-300 sm:w-24">{item.date}</span>
                      <div className="h-3 flex-1 rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-3 rounded-full bg-blue-600"
                          style={{ width: `${Math.max(4, (item.orders / maxDailyOrders) * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-slate-700 dark:text-slate-200">{item.orders}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Monthly revenue</h2>
              <div className="mt-4">
                <BarChart items={data?.monthlyRevenue || []} valueKey="revenue" labelKey="month" color="bg-emerald-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top categories</h2>
              <div className="mt-4">
                <BarChart items={data?.topCategories || []} valueKey="revenue" labelKey="name" color="bg-violet-600" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Best-selling products</h2>
            {(data?.bestSellingProducts || []).length === 0 ? (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No sales data yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Quantity</th>
                      <th className="px-4 py-3 font-semibold">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.bestSellingProducts.map((product) => (
                      <tr key={product.productId}>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{product.quantity}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">{money(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
